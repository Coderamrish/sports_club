const nodemailer = require('nodemailer');
const fs = require('fs');

/**
 * Create transporter using the same SMTP config as the main email service.
 * Uses SMTP_USER / SMTP_PASS from .env (consistent with email.service.js).
 */
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

/**
 * Sends certificate email with PDF attachment and competition details
 * @param {string} toEmail - Recipient email
 * @param {string} userName - User's name
 * @param {string} competitionName - Competition name
 * @param {string} competitionDate - Competition date
 * @param {string} venue - Competition venue
 * @param {string} medal - Medal type (Gold / Silver / Bronze / Participant)
 * @param {string} filePath - Absolute path to certificate PDF file
 */
async function sendCertificateEmail({ toEmail, userName, competitionName, competitionDate, venue, medal, filePath }) {
  // Validate SMTP config
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email configuration missing: SMTP_USER or SMTP_PASS not set in .env');
  }

  // Validate recipient email
  if (!toEmail || !toEmail.includes('@')) {
    throw new Error(`Invalid email address: ${toEmail}`);
  }

  // Check if certificate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Certificate file not found: ${filePath}`);
  }

  const medalEmoji = { Gold: '🥇', Silver: '🥈', Bronze: '🥉', Participant: '🏅' };
  const formattedDate = competitionDate
    ? new Date(competitionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Sports Club" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${medalEmoji[medal] || '🏅'} Your Certificate for ${competitionName} is Ready!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a3c5e, #1565C0); padding: 32px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 8px 0 0; opacity: 0.85; font-size: 14px; }
        .body { padding: 32px; color: #333; }
        .medal-badge { display: inline-block; padding: 10px 24px; border-radius: 30px; font-size: 18px; font-weight: 700; margin: 16px 0; }
        .details { background: #F3F6FF; border: 1px solid #BBDEFB; border-radius: 10px; padding: 16px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E3F2FD; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; }
        .footer { background: #F8F9FA; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #EEE; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${medalEmoji[medal] || '🏅'} Certificate of Achievement</h1>
            <p>Sports Club Management System</p>
          </div>
          <div class="body">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Congratulations! Your certificate for <strong>${competitionName}</strong> has been generated and is attached to this email.</p>
            
            <div style="text-align: center;">
              <div class="medal-badge" style="background: ${medal === 'Gold' ? '#FFF8E1; color: #F57F17' : medal === 'Silver' ? '#ECEFF1; color: #455A64' : medal === 'Bronze' ? '#FBE9E7; color: #BF360C' : '#E3F2FD; color: #1565C0'}">
                ${medalEmoji[medal] || '🏅'} ${medal === 'Participant' ? 'Participation Certificate' : `${medal} Medal`}
              </div>
            </div>

            <div class="details">
              <div class="detail-row"><span>Competition</span><strong>${competitionName}</strong></div>
              <div class="detail-row"><span>Date</span><span>${formattedDate}</span></div>
              ${venue ? `<div class="detail-row"><span>Venue</span><span>${venue}</span></div>` : ''}
              <div class="detail-row"><span>Award</span><span style="font-weight: 700">${medal}</span></div>
            </div>

            <p>You can also download your certificate anytime from the <strong>My History</strong> section on your dashboard.</p>
            <p style="color: #888; font-size: 13px;">Keep achieving! 🎯</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Sports Club Management System · All rights reserved
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `Certificate_${competitionName.replace(/\s+/g, '_')}_${medal}.pdf`,
        content: fs.readFileSync(filePath),
        contentType: 'application/pdf',
      },
    ],
  };

  const transporter = getTransporter();
  await transporter.sendMail(mailOptions);
  console.log(`Certificate email sent successfully to ${toEmail}`);
}

module.exports = sendCertificateEmail;