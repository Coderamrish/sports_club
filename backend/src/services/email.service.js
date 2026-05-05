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

/**
 * Send profile status update email
 */
const sendProfileStatusEmail = async ({ to, fullName, role, status, adminNotes }) => {
  const statusColors = { Approved: '#4CAF50', Rejected: '#F44336', 'Pending Review': '#FF9800', Incomplete: '#9E9E9E' };
  const color = statusColors[status] || '#1565C0';
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

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
      <div class="header"><h1>📋 Profile Update</h1></div>
      <div class="body">
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Your <strong>${roleLabel}</strong> profile has been reviewed by the admin.</p>
        <p>Status: <span class="status-badge">${status}</span></p>
        ${adminNotes ? `<p style="background:#FFF3E0;padding:12px;border-radius:6px;border-left:4px solid ${color}"><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
        ${status === 'Approved' ? '<p>Congratulations! You can now access all features of the platform.</p>' : ''}
        ${status === 'Rejected' ? '<p>Please review the notes and update your profile from your dashboard.</p>' : ''}
      </div>
      <div class="footer">© ${new Date().getFullYear()} Sports Club Management System</div>
    </div></body></html>
  `;

  return sendEmail({ to, subject: `Profile ${status}: ${roleLabel}`, html });
};

/**
 * Send payment confirmation email (competition or profile fee)
 */
const sendPaymentConfirmationEmail = async ({
  to, fullName, type, competition, amount, txnId, orderId, paidAt,
}) => {
  const formattedDate = paidAt
    ? new Date(paidAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN');

  const isComp = type === 'competition';
  const subject = isComp
    ? `✅ Payment Confirmed – ${competition?.title || 'Competition'}`
    : '✅ Profile Registration Fee Paid';

  const html = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0}
      .container{max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
      .header{background:linear-gradient(135deg,#2E7D32,#388E3C);padding:32px;text-align:center;color:white}
      .header h1{margin:0;font-size:24px}
      .header p{margin:8px 0 0;opacity:.85;font-size:14px}
      .body{padding:36px 32px;color:#333}
      .receipt{background:#F1F8E9;border:1px solid #A5D6A7;border-radius:10px;padding:20px;margin:20px 0}
      .receipt-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #C8E6C9;font-size:14px}
      .receipt-row:last-child{border-bottom:none;font-weight:700;font-size:16px;color:#2E7D32}
      .badge{display:inline-block;background:#2E7D32;color:white;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600}
      .footer{background:#F8F9FA;padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #EEE}
    </style></head>
    <body><div class="container">
      <div class="header">
        <h1>🎉 Payment Successful!</h1>
        <p>Your payment has been confirmed</p>
      </div>
      <div class="body">
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>We have received your payment successfully. Here is your receipt:</p>

        <div class="receipt">
          ${isComp ? `
          <div class="receipt-row">
            <span>Competition</span>
            <span>${competition?.title || '—'}</span>
          </div>
          <div class="receipt-row">
            <span>Event Date</span>
            <span>${competition?.date ? new Date(competition.date).toLocaleDateString('en-IN') : '—'}</span>
          </div>
          <div class="receipt-row">
            <span>Venue</span>
            <span>${competition?.venue || '—'}</span>
          </div>
          ` : `
          <div class="receipt-row">
            <span>Description</span>
            <span>Profile Registration Fee</span>
          </div>
          `}
          <div class="receipt-row">
            <span>Transaction ID</span>
            <span style="font-family:monospace;font-size:12px">${txnId}</span>
          </div>
          <div class="receipt-row">
            <span>Order ID</span>
            <span style="font-family:monospace;font-size:12px">${orderId}</span>
          </div>
          <div class="receipt-row">
            <span>Paid On</span>
            <span>${formattedDate}</span>
          </div>
          <div class="receipt-row">
            <span>Amount Paid</span>
            <span>₹${amount}</span>
          </div>
        </div>

        <p>Status: <span class="badge">✓ PAID</span></p>
        <p style="color:#555;font-size:14px">
          ${isComp
            ? 'Your competition slot is confirmed pending admin approval. You will be notified once the admin reviews your registration.'
            : 'Your profile registration fee is confirmed. Login to your dashboard to complete your profile.'}
        </p>
        <p style="color:#888;font-size:13px">Keep this email as your payment receipt. Contact support if you have any questions.</p>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Sports Club Management System · All rights reserved</div>
    </div></body></html>
  `;

  return sendEmail({ to, subject, html });
};

/**
 * Send payment failed email
 */
const sendPaymentFailedEmail = async ({ to, fullName, amount, orderId, reason }) => {
  const html = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0}
      .container{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
      .header{background:linear-gradient(135deg,#C62828,#E53935);padding:32px;text-align:center;color:white}
      .body{padding:36px 32px;color:#333}
      .error-box{background:#FFEBEE;border:1px solid #EF9A9A;border-radius:8px;padding:16px;margin:16px 0;color:#C62828}
      .btn{display:inline-block;background:#1565C0;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px}
      .footer{background:#F8F9FA;padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #EEE}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>❌ Payment Failed</h1></div>
      <div class="body">
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Unfortunately, your payment of <strong>₹${amount}</strong> could not be processed.</p>
        <div class="error-box">
          <strong>Reason:</strong> ${reason || 'Transaction was declined or timed out.'}
          <br><strong>Order ID:</strong> ${orderId}
        </div>
        <p>No money has been deducted from your account. You can retry the payment from your dashboard.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Go to Dashboard →</a>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Sports Club Management System</div>
    </div></body></html>
  `;
  return sendEmail({ to, subject: '❌ Payment Failed – Sports Club', html });
};

/**
 * Send competition registration approval email (when admin accepts)
 */
const sendRegistrationApprovalEmail = async ({ to, fullName, competitionTitle, competitionDate, venue, paymentStatus }) => {
  const isPaid = paymentStatus === 'Paid';
  const html = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0}
      .container{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
      .header{background:linear-gradient(135deg,#1565C0,#1E88E5);padding:32px;text-align:center;color:white}
      .body{padding:36px 32px;color:#333}
      .detail-box{background:#E3F2FD;border-radius:8px;padding:16px;margin:16px 0}
      .detail-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;border-bottom:1px solid #BBDEFB}
      .detail-row:last-child{border:none}
      .footer{background:#F8F9FA;padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #EEE}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>🏆 Registration Approved!</h1></div>
      <div class="body">
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Great news! Your competition registration has been <strong>approved</strong> by the admin.</p>
        <div class="detail-box">
          <div class="detail-row"><span>Competition</span><strong>${competitionTitle}</strong></div>
          <div class="detail-row"><span>Date</span><span>${competitionDate ? new Date(competitionDate).toLocaleDateString('en-IN') : '—'}</span></div>
          <div class="detail-row"><span>Venue</span><span>${venue || '—'}</span></div>
          <div class="detail-row"><span>Payment</span><span style="color:${isPaid ? '#2E7D32' : '#E65100'}">${isPaid ? '✓ Paid' : '⚠ Pending – Please pay to confirm your slot'}</span></div>
        </div>
        ${!isPaid ? `<p style="color:#E65100;background:#FFF3E0;padding:12px;border-radius:6px">⚠️ Your slot is not confirmed until payment is completed. Login to your dashboard to pay now.</p>` : ''}
        <p>Good luck! 🎯</p>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Sports Club Management System</div>
    </div></body></html>
  `;
  return sendEmail({ to, subject: `✅ Registration Approved – ${competitionTitle}`, html });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendDocumentStatusEmail,
  sendProfileStatusEmail,
  sendPaymentConfirmationEmail,
  sendPaymentFailedEmail,
  sendRegistrationApprovalEmail,
};