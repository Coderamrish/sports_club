const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

/**
 * Initialize Nodemailer transporter (lazy init)
 */
const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  return transporter;
};

/**
 * Base send function
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"Sports Club" <noreply@sportsclub.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    logger.info(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`❌ Email failed to ${to}: ${error.message}`);
    throw error;
  }
};

/**
 * Send OTP verification email
 */
const sendOTPEmail = async ({ to, fullName, subject, message, otp, expiryMinutes }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1565C0, #0D47A1); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 36px 32px; }
        .greeting { font-size: 16px; color: #333; margin-bottom: 16px; }
        .message { font-size: 15px; color: #555; margin-bottom: 28px; }
        .otp-box { background: #F3F6FF; border: 2px solid #1565C0; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1565C0; font-family: 'Courier New', monospace; }
        .otp-expiry { font-size: 13px; color: #888; margin-top: 10px; }
        .warning { background: #FFF3E0; border-left: 4px solid #FF9800; padding: 14px 18px; border-radius: 6px; font-size: 13px; color: #666; margin-top: 24px; }
        .footer { background: #F8F9FA; padding: 20px 32px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #EEE; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Sports Club</h1>
          <p>Management Platform</p>
        </div>
        <div class="body">
          <p class="greeting">Hello, <strong>${fullName || 'there'}</strong>!</p>
          <p class="message">${message}</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <p class="otp-expiry">⏱ This OTP expires in <strong>${expiryMinutes} minutes</strong></p>
          </div>
          <div class="warning">
            ⚠️ <strong>Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for it.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Sports Club Management System. All rights reserved.<br>
          If you didn't request this, please ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
};

/**
 * Send welcome email after account creation
 */
const sendWelcomeEmail = async ({ to, fullName, role, loginUrl }) => {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0}
      .container{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
      .header{background:linear-gradient(135deg,#1565C0,#0D47A1);padding:32px;text-align:center;color:white}
      .body{padding:36px 32px;color:#333}
      .btn{display:inline-block;background:#1565C0;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:24px 0}
      .footer{background:#F8F9FA;padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #EEE}
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h1>🎉 Welcome to Sports Club!</h1></div>
        <div class="body">
          <h2>Hello, ${fullName}!</h2>
          <p>Your <strong>${roleLabel}</strong> account has been successfully created.</p>
          <p>Complete your profile to get started with competitions and registrations.</p>
          <a href="${loginUrl || process.env.FRONTEND_URL}" class="btn">Login to Dashboard →</a>
          <p style="color:#888;font-size:13px">If you have any issues, contact our support team.</p>
        </div>
        <div class="footer">© ${new Date().getFullYear()} Sports Club Management System</div>
      </div>
    </body></html>
  `;
  return sendEmail({ to, subject: `Welcome to Sports Club, ${fullName}! 🏆`, html });
};

/**
 * Send document status update email
 */
const sendDocumentStatusEmail = async ({ to, fullName, documentName, status, reason }) => {
  const statusColors = { Approved: '#4CAF50', Rejected: '#F44336', Pending: '#FF9800' };
  const color = statusColors[status] || '#1565C0';

  const html = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0}
      .container{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
      .header{background:linear-gradient(135deg,#1565C0,#0D47A1);padding:32px;text-align:center;color:white}
      .body{padding:36px 32px}
      .status-badge{display:inline-block;background:${color};color:white;padding:8px 20px;border-radius:20px;font-weight:bold;font-size:15px}
      .footer{background:#F8F9FA;padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #EEE}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>📋 Document Update</h1></div>
      <div class="body">
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Your document <strong>${documentName}</strong> has been reviewed.</p>
        <p>Status: <span class="status-badge">${status}</span></p>
        ${reason ? `<p style="background:#FFF3E0;padding:12px;border-radius:6px;border-left:4px solid ${color}"><strong>Note:</strong> ${reason}</p>` : ''}
        ${status === 'Rejected' ? '<p>Please re-upload the correct document from your dashboard.</p>' : ''}
      </div>
      <div class="footer">© ${new Date().getFullYear()} Sports Club Management System</div>
    </div></body></html>
  `;

  return sendEmail({ to, subject: `Document ${status}: ${documentName}`, html });
};

module.exports = { sendEmail, sendOTPEmail, sendWelcomeEmail, sendDocumentStatusEmail };
