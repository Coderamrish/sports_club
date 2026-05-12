/**
 * Scheduled Reminder System — node-cron based
 * 
 * Runs at configured intervals and sends:
 *  1. Event reminders (48h / 24h before competition date)
 *  2. Fee reminders (3d / 1d before registration deadline for unpaid users)
 *  3. Missing document alerts (7d before competition for users with incomplete docs)
 * 
 * NOTE : Read it for clear and clean implementation
 */
const cron = require('node-cron');
const Competition = require('../models/Competition.model');
const CompetitionRegistration = require('../models/CompetitionRegistration.model');
const AthleteProfile = require('../models/AthleteProfile.model');
const User = require('../models/User.model');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

//  Helpers
const hoursUntil = (date) => (new Date(date) - new Date()) / (1000 * 60 * 60);
const daysUntil = (date) => hoursUntil(date) / 24;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
// 1. Event Reminders — 48h and 24h before competition date
async function sendEventReminders() {
  try {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find competitions happening in the next 24–48 hours
    const upcoming = await Competition.find({
      status: { $in: ['upcoming', 'ongoing'] },
      date: { $gte: now, $lte: in48h },
    });

    for (const comp of upcoming) {
      const h = hoursUntil(comp.date);
      const label = h <= 26 ? '24 hours' : '48 hours';

      // Get all active registrations
      const regs = await CompetitionRegistration.find({
        competition: comp._id,
        status: 'Active',
      }).populate('athlete', 'fullName email');

      let sent = 0;
      for (const reg of regs) {
        if (!reg.athlete?.email) continue;
        try {
          await emailService.sendEmail({
            to: reg.athlete.email,
            subject: `⏰ Reminder: ${comp.title} in ${label}!`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
                <div style="background:linear-gradient(135deg,#1a3c5e,#1565C0);padding:24px;color:white;text-align:center">
                  <h2 style="margin:0">⏰ Event Reminder</h2>
                  <p style="margin:8px 0 0;opacity:.85;font-size:14px">${label} to go!</p>
                </div>
                <div style="padding:24px;color:#333">
                  <p>Dear <strong>${reg.athlete.fullName}</strong>,</p>
                  <p>This is a friendly reminder that <strong>${comp.title}</strong> is happening in <strong>${label}</strong>.</p>
                  <div style="background:#F3F6FF;border:1px solid #BBDEFB;border-radius:10px;padding:16px;margin:16px 0">
                    <p style="margin:4px 0"><strong>📅 Date:</strong> ${formatDate(comp.date)}</p>
                    <p style="margin:4px 0"><strong>📍 Venue:</strong> ${comp.venue || '—'}</p>
                    <p style="margin:4px 0"><strong>💰 Payment:</strong> ${reg.paymentStatus === 'Paid' ? '✅ Paid' : '⚠️ PENDING — Please pay before the event!'}</p>
                  </div>
                  <p><strong>Checklist:</strong></p>
                  <ul style="color:#555">
                    <li>Carry your ID proof / Aadhaar card</li>
                    <li>Reach the venue 30 minutes early</li>
                    <li>Bring required sports gear and equipment</li>
                    ${reg.paymentStatus !== 'Paid' ? '<li style="color:#E65100;font-weight:700">Complete your payment ASAP!</li>' : ''}
                  </ul>
                  <p>Good luck! 🎯</p>
                </div>
                <div style="background:#F8F9FA;padding:16px;text-align:center;font-size:12px;color:#999">
                  © ${new Date().getFullYear()} Sports Club Management System
                </div>
              </div>
            `,
          });
          sent++;
        } catch (e) {
          logger.warn(`Event reminder email failed for ${reg.athlete.email}: ${e.message}`);
        }
      }
      if (sent > 0) logger.info(`📧 Sent ${sent} event reminders for "${comp.title}" (${label})`);
    }
  } catch (err) {
    logger.error(`Event reminder job error: ${err.message}`);
  }
}

// 2. Fee Reminders — 3d and 1d before deadline for unpaid registrations
async function sendFeeReminders() {
  try {
    const now = new Date();
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Competitions with deadline in next 3 days
    const upcoming = await Competition.find({
      status: 'upcoming',
      deadline: { $gte: now, $lte: in3d },
    });

    for (const comp of upcoming) {
      const d = daysUntil(comp.deadline);
      const label = d <= 1.5 ? '1 day' : '3 days';

      // Unpaid registrations
      const unpaid = await CompetitionRegistration.find({
        competition: comp._id,
        status: { $in: ['Active', 'Pending'] },
        paymentStatus: { $ne: 'Paid' },
      }).populate('athlete', 'fullName email');

      let sent = 0;
      for (const reg of unpaid) {
        if (!reg.athlete?.email) continue;
        try {
          await emailService.sendEmail({
            to: reg.athlete.email,
            subject: `💰 Payment Reminder: ${comp.title} — ${label} left!`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
                <div style="background:linear-gradient(135deg,#E65100,#FF8F00);padding:24px;color:white;text-align:center">
                  <h2 style="margin:0">💰 Payment Reminder</h2>
                  <p style="margin:8px 0 0;opacity:.85;font-size:14px">Only ${label} left!</p>
                </div>
                <div style="padding:24px;color:#333">
                  <p>Dear <strong>${reg.athlete.fullName}</strong>,</p>
                  <p>Your registration for <strong>${comp.title}</strong> is <strong>pending payment</strong>. The deadline is <strong>${formatDate(comp.deadline)}</strong>.</p>
                  <div style="background:#FFF3E0;border:1px solid #FFCC80;border-radius:10px;padding:16px;margin:16px 0;text-align:center">
                    <p style="margin:0;font-size:18px;font-weight:700;color:#E65100">₹${comp.registrationFee}</p>
                    <p style="margin:4px 0 0;color:#BF360C">Payment due in ${label}</p>
                  </div>
                  <p>Login to your dashboard and complete the payment to confirm your participation.</p>
                </div>
                <div style="background:#F8F9FA;padding:16px;text-align:center;font-size:12px;color:#999">
                  © ${new Date().getFullYear()} Sports Club Management System
                </div>
              </div>
            `,
          });
          sent++;
        } catch (e) {
          logger.warn(`Fee reminder email failed for ${reg.athlete.email}: ${e.message}`);
        }
      }
      if (sent > 0) logger.info(`💰 Sent ${sent} fee reminders for "${comp.title}" (${label})`);
    }
  } catch (err) {
    logger.error(`Fee reminder job error: ${err.message}`);
  }
}

// 3. Missing Document Alerts — 7 days before competition for incomplete profiles
async function sendMissingDocAlerts() {
  try {
    const now = new Date();
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = await Competition.find({
      status: 'upcoming',
      date: { $gte: now, $lte: in7d },
    });

    for (const comp of upcoming) {
      const regs = await CompetitionRegistration.find({
        competition: comp._id,
        status: 'Active',
      }).populate('athlete', 'fullName email');

      let sent = 0;
      for (const reg of regs) {
        if (!reg.athlete?.email) continue;
        const profile = await AthleteProfile.findOne({ user: reg.athlete._id });
        if (!profile) continue;

        const docs = profile.documents || {};
        const missing = [];
        if (!docs.passportPhoto?.url)  missing.push('Passport Photo');
        if (!docs.aadhaarCard?.url)    missing.push('Aadhaar Card');
        if (!docs.birthCertificate?.url) missing.push('Birth Certificate');

        if (missing.length === 0) continue;

        try {
          await emailService.sendEmail({
            to: reg.athlete.email,
            subject: `📋 Missing Documents for ${comp.title}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
                <div style="background:linear-gradient(135deg,#B71C1C,#E53935);padding:24px;color:white;text-align:center">
                  <h2 style="margin:0">📋 Document Alert</h2>
                  <p style="margin:8px 0 0;opacity:.85;font-size:14px">Action needed before ${comp.title}</p>
                </div>
                <div style="padding:24px;color:#333">
                  <p>Dear <strong>${reg.athlete.fullName}</strong>,</p>
                  <p><strong>${comp.title}</strong> is in <strong>${Math.ceil(daysUntil(comp.date))} days</strong> and you have missing documents:</p>
                  <ul style="color:#B71C1C;font-weight:600">
                    ${missing.map(d => `<li>${d}</li>`).join('')}
                  </ul>
                  <p>Please upload these documents from your profile setup page before the event.</p>
                </div>
                <div style="background:#F8F9FA;padding:16px;text-align:center;font-size:12px;color:#999">
                  © ${new Date().getFullYear()} Sports Club Management System
                </div>
              </div>
            `,
          });
          sent++;
        } catch (e) {
          logger.warn(`Missing doc alert failed for ${reg.athlete.email}: ${e.message}`);
        }
      }
      if (sent > 0) logger.info(`📋 Sent ${sent} missing-doc alerts for "${comp.title}"`);
    }
  } catch (err) {
    logger.error(`Missing doc alert job error: ${err.message}`);
  }
}
// Schedule all cron jobs
function startScheduler() {
  // Event reminders — every 6 hours (at 6am, 12pm, 6pm, midnight)
  cron.schedule('0 */6 * * *', () => {
    logger.info('🕐 Running scheduled event reminders...');
    sendEventReminders();
  });

  // Fee reminders — twice daily (9am and 6pm)
  cron.schedule('0 9,18 * * *', () => {
    logger.info('🕐 Running scheduled fee reminders...');
    sendFeeReminders();
  });

  // Missing document alerts — once daily at 10am
  cron.schedule('0 10 * * *', () => {
    logger.info('🕐 Running scheduled missing-doc alerts...');
    sendMissingDocAlerts();
  });

  logger.info('✅ Scheduled reminder system initialized (event/fee/doc reminders active)');
}

module.exports = {
  startScheduler,
  sendEventReminders,
  sendFeeReminders,
  sendMissingDocAlerts,
};
