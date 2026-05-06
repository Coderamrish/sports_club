const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const CompetitionRegistration = require('../models/CompetitionRegistration.model');
const User = require('../models/User.model');
const Competition = require('../models/Competition.model');
const Payment = require('../models/payment.model');
const generateCertificate = require('../utils/generateCertificate');
const sendCertificateEmail = require('../utils/sendCertificateEmail');
const emailService = require('../services/email.service');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// ─── ADMIN: Get all registrations for a competition (for issuing certificates) ──
router.get('/admin/competition/:competitionId/registrations', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { competitionId } = req.params;
    if (!competitionId) {
      return res.status(400).json({ message: 'Competition ID is required' });
    }

    const registrations = await CompetitionRegistration.find({
      competition: competitionId,
      status: { $in: ['Active', 'Pending'] },
    })
      .populate('athlete', 'fullName email mobile role')
      .populate('competition', 'title date venue categories registrationFee')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Registrations retrieved successfully',
      count: registrations.length,
      data: registrations,
    });
  } catch (err) {
    console.error('Error fetching registrations for certificates:', err);
    res.status(500).json({ message: 'Failed to retrieve registrations', error: err.message });
  }
});

// ─── ADMIN: Issue certificates & medals, update registrations, email users ────
router.post('/admin/results', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { competitionId, results } = req.body;
    // results = [{ registrationId, medal, attendanceStatus }]

    if (!competitionId || !results || !Array.isArray(results)) {
      return res.status(400).json({ message: 'Invalid input: competitionId and results array required' });
    }

    const competition = await Competition.findById(competitionId);
    if (!competition) return res.status(404).json({ message: 'Competition not found' });

    const generated = [];
    const failed = [];

    for (const entry of results) {
      try {
        // Find the registration
        const registration = await CompetitionRegistration.findById(entry.registrationId)
          .populate('athlete', 'fullName email role');

        if (!registration) {
          failed.push({ registrationId: entry.registrationId, reason: 'Registration not found' });
          continue;
        }

        const user = registration.athlete;
        if (!user) {
          failed.push({ registrationId: entry.registrationId, reason: 'User not found' });
          continue;
        }

        // Update attendance
        registration.attendanceStatus = entry.attendanceStatus || 'Present';
        registration.medalWon = entry.medal || 'None';

        // Generate PDF certificate
        let filePath, fileName;
        try {
          const result = await generateCertificate({
            userName: user.fullName,
            competitionName: competition.title,
            competitionDate: competition.date,
            medal: entry.medal || 'Participant',
            userType: user.role || 'athlete',
          });
          filePath = result.filePath;
          fileName = result.fileName;
        } catch (certErr) {
          console.error(`Certificate generation failed for ${user.fullName}:`, certErr.message);
          failed.push({ registrationId: entry.registrationId, reason: `Certificate generation failed: ${certErr.message}` });
          continue;
        }

        const certUrl = `/uploads/certificates/${fileName}`;
        registration.certificateUrl = certUrl;
        registration.publishedAt = new Date();
        await registration.save();

        // Send email with certificate (non-blocking - don't fail if email fails)
        let emailSent = false;
        try {
          await sendCertificateEmail({
            toEmail: user.email,
            userName: user.fullName,
            competitionName: competition.title,
            competitionDate: competition.date,
            venue: competition.venue,
            medal: entry.medal || 'Participant',
            filePath,
          });
          emailSent = true;
        } catch (emailErr) {
          console.warn(`Email failed for ${user.email}:`, emailErr.message);
        }

        generated.push({
          registrationId: entry.registrationId,
          userId: user._id,
          userName: user.fullName,
          email: user.email,
          medal: entry.medal || 'Participant',
          certUrl,
          emailSent,
          fileName,
        });
      } catch (itemErr) {
        console.error(`Error processing result for registration ${entry.registrationId}:`, itemErr.message);
        failed.push({ registrationId: entry.registrationId, reason: itemErr.message });
      }
    }

    res.json({
      message: 'Certificate generation completed',
      generated: generated.length,
      failed: failed.length,
      results: { generated, failed },
    });
  } catch (err) {
    console.error('Certificate generation error:', err);
    res.status(500).json({ message: 'Certificate generation failed', error: err.message });
  }
});

// ─── ADMIN: Resend certificate email ──────────────────────────────────────────
router.post('/admin/resend-email/:registrationId', protect, restrictTo('admin'), async (req, res) => {
  try {
    const registration = await CompetitionRegistration.findById(req.params.registrationId)
      .populate('athlete', 'fullName email')
      .populate('competition', 'title date venue');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    if (!registration.certificateUrl) {
      return res.status(400).json({ message: 'No certificate generated yet for this registration' });
    }

    const filePath = path.join(__dirname, '../../uploads', registration.certificateUrl.replace(/^\/uploads\//, ''));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Certificate file not found on server' });
    }

    await sendCertificateEmail({
      toEmail: registration.athlete.email,
      userName: registration.athlete.fullName,
      competitionName: registration.competition.title,
      competitionDate: registration.competition.date,
      venue: registration.competition.venue,
      medal: registration.medalWon || 'Participant',
      filePath,
    });

    res.json({ message: `Certificate email resent to ${registration.athlete.email}` });
  } catch (err) {
    console.error('Resend email error:', err);
    res.status(500).json({ message: 'Failed to resend email', error: err.message });
  }
});

// ─── ADMIN: Broadcast "Results Published" to all attendees ────────────────────
router.post('/admin/broadcast-results/:competitionId', protect, restrictTo('admin'), async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Get all registrations with users
    const registrations = await CompetitionRegistration.find({
      competition: competition._id,
      status: 'Active',
      attendanceStatus: 'Present',
    }).populate('athlete', 'fullName email');

    if (registrations.length === 0) {
      return res.status(400).json({ message: 'No attendees found for this competition' });
    }

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
    let sent = 0, failed = 0;

    for (const reg of registrations) {
      if (!reg.athlete?.email) { failed++; continue; }
      try {
        const medalEmoji = { Gold: '🥇', Silver: '🥈', Bronze: '🥉', Participant: '🏅', None: '🏅' };
        const medal = reg.medalWon || 'Participant';
        await emailService.sendEmail({
          to: reg.athlete.email,
          subject: `🏆 Results Published — ${competition.title}!`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
              <div style="background:linear-gradient(135deg,#1a3c5e,#1565C0);padding:28px;color:white;text-align:center">
                <h1 style="margin:0;font-size:28px">🏆 Results Are Out!</h1>
                <p style="margin:8px 0 0;opacity:.85;font-size:15px">${competition.title}</p>
              </div>
              <div style="padding:24px;color:#333">
                <p>Dear <strong>${reg.athlete.fullName}</strong>,</p>
                <p>The results for <strong>${competition.title}</strong> have been published by the admin!</p>
                
                <div style="background:linear-gradient(135deg,#F5F5F5,#EEEEEE);border-radius:12px;padding:20px;margin:20px 0;text-align:center">
                  <p style="margin:0 0 4px;font-size:14px;color:#888">Your Achievement</p>
                  <p style="margin:0;font-size:36px">${medalEmoji[medal] || '🏅'}</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#333">${medal}</p>
                </div>
                
                <div style="background:#F3F6FF;border:1px solid #BBDEFB;border-radius:10px;padding:16px;margin:16px 0">
                  <p style="margin:4px 0"><strong>📅 Date:</strong> ${formatDate(competition.date)}</p>
                  <p style="margin:4px 0"><strong>📍 Venue:</strong> ${competition.venue || '—'}</p>
                </div>
                
                ${reg.certificateUrl
                  ? '<p style="text-align:center;margin:20px 0"><strong>🎓 Your certificate is ready!</strong> Log in to your dashboard to download it.</p>'
                  : '<p style="text-align:center;color:#888">Certificate will be available for download from your dashboard shortly.</p>'
                }
                
                <p>Congratulations and thank you for participating! 🎯</p>
              </div>
              <div style="background:#F8F9FA;padding:16px;text-align:center;font-size:12px;color:#999">
                © ${new Date().getFullYear()} Sports Club Management System
              </div>
            </div>
          `,
        });
        sent++;
      } catch (emailErr) {
        console.warn(`Broadcast email failed for ${reg.athlete.email}:`, emailErr.message);
        failed++;
      }
    }

    res.json({
      message: `Results broadcast complete: ${sent} sent, ${failed} failed`,
      sent,
      failed,
      total: registrations.length,
    });
  } catch (err) {
    console.error('Broadcast results error:', err);
    res.status(500).json({ message: 'Broadcast failed', error: err.message });
  }
});

// ─── USER: Get own history (competitions, medals, certificates, payments) ─────
router.get('/my-history', protect, async (req, res) => {
  try {
    // Get competition registrations
    const registrations = await CompetitionRegistration.find({ athlete: req.user._id })
      .populate('competition', 'title description date venue categories ageGroups registrationFee status')
      .sort({ createdAt: -1 });

    // Get payment history
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    // Compute summary stats
    const totalCompetitions = registrations.length;
    const activeRegistrations = registrations.filter(r => r.status === 'Active' || r.status === 'Pending').length;
    const medalCounts = { Gold: 0, Silver: 0, Bronze: 0, Participant: 0 };
    const certificates = [];

    registrations.forEach(reg => {
      if (reg.medalWon && reg.medalWon !== 'None') {
        medalCounts[reg.medalWon] = (medalCounts[reg.medalWon] || 0) + 1;
      }
      if (reg.certificateUrl) {
        certificates.push({
          _id: reg._id,
          competitionTitle: reg.competition?.title || '—',
          competitionDate: reg.competition?.date,
          venue: reg.competition?.venue,
          medal: reg.medalWon || 'Participant',
          certificateUrl: reg.certificateUrl,
          publishedAt: reg.publishedAt,
        });
      }
    });

    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      message: 'History retrieved successfully',
      data: {
        registrations,
        payments,
        certificates,
        summary: {
          totalCompetitions,
          activeRegistrations,
          medalCounts,
          totalCertificates: certificates.length,
          totalPaid,
          totalPayments: payments.length,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ message: 'Failed to retrieve history', error: err.message });
  }
});

// ─── USER: Download certificate ──────────────────────────────────────────────
router.get('/download/:registrationId', protect, async (req, res) => {
  try {
    const registration = await CompetitionRegistration.findOne({
      _id: req.params.registrationId,
      athlete: req.user._id,
    }).populate('competition', 'title');

    if (!registration || !registration.certificateUrl) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', registration.certificateUrl.replace(/^\/uploads\//, ''));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Certificate file not found on server' });
    }

    const compName = (registration.competition?.title || 'Competition').replace(/\s+/g, '_');
    res.download(filePath, `Certificate_${compName}_${registration.medalWon || 'Participant'}.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err.message);
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;