/**
 * Generate a PDF payment receipt using PDFKit.
 * Returns { filePath, fileName } for download or email attachment.
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateReceipt({
  receiptNo,
  userName,
  userEmail,
  description,
  amount,
  txnId,
  orderId,
  paidAt,
  entityType,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const fileName = `receipt_${receiptNo || Date.now()}.pdf`;
      const outputDir = path.join(__dirname, '../../uploads/receipts');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const formattedDate = paidAt
        ? new Date(paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleDateString('en-IN');
      const formattedAmount = `₹${Number(amount).toLocaleString('en-IN')}`;

      // ── Header Band ──────────────────────────────────────────────
      doc.rect(0, 0, 595.28, 100).fill('#1565C0');
      doc.fontSize(24).fillColor('#FFFFFF').font('Helvetica-Bold').text('PAYMENT RECEIPT', 50, 30);
      doc.fontSize(11).fillColor('rgba(255,255,255,0.8)').font('Helvetica').text('Sports Club Management System', 50, 60);
      doc.fontSize(10).text(`Receipt No: ${receiptNo || fileName.replace('.pdf', '')}`, 350, 35, { align: 'right', width: 200 });
      doc.text(`Date: ${formattedDate}`, 350, 55, { align: 'right', width: 200 });

      // ── Status Badge ─────────────────────────────────────────────
      doc.roundedRect(230, 85, 135, 30, 15).fill('#2E7D32');
      doc.fontSize(13).fillColor('#FFFFFF').font('Helvetica-Bold').text('✓ PAYMENT SUCCESSFUL', 240, 92, { width: 115, align: 'center' });

      // ── Bill To ──────────────────────────────────────────────────
      doc.fillColor('#333333').font('Helvetica-Bold').fontSize(11).text('BILLED TO:', 50, 140);
      doc.font('Helvetica').fontSize(11).fillColor('#555555');
      doc.text(userName || '—', 50, 158);
      doc.text(userEmail || '—', 50, 174);

      // ── Horizontal Rule ──────────────────────────────────────────
      doc.moveTo(50, 200).lineTo(545, 200).strokeColor('#E0E0E0').lineWidth(1).stroke();

      // ── Payment Details Table ────────────────────────────────────
      const tableTop = 220;
      const col1 = 50, col2 = 340;

      // Table header
      doc.rect(col1, tableTop, 495, 28).fill('#F5F5F5');
      doc.fillColor('#333333').font('Helvetica-Bold').fontSize(10);
      doc.text('DESCRIPTION', col1 + 10, tableTop + 8);
      doc.text('AMOUNT', col2 + 80, tableTop + 8);

      // Table row
      const rowY = tableTop + 38;
      doc.font('Helvetica').fontSize(10).fillColor('#555555');
      doc.text(description || 'Payment', col1 + 10, rowY);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1565C0');
      doc.text(formattedAmount, col2 + 70, rowY);

      // Type row
      doc.font('Helvetica').fontSize(9).fillColor('#999999');
      doc.text(entityType === 'profile_registration' ? 'Profile Registration Fee' : 'Competition Registration Fee', col1 + 10, rowY + 18);

      // ── Divider ──────────────────────────────────────────────────
      doc.moveTo(col1, rowY + 42).lineTo(545, rowY + 42).strokeColor('#E0E0E0').lineWidth(1).stroke();

      // ── Total ────────────────────────────────────────────────────
      const totalY = rowY + 55;
      doc.rect(col2 + 30, totalY - 5, 165, 30).fill('#1565C0');
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#FFFFFF');
      doc.text(`TOTAL: ${formattedAmount}`, col2 + 40, totalY + 2, { width: 145, align: 'center' });

      // ── Transaction Details ──────────────────────────────────────
      const detailY = totalY + 55;
      doc.fillColor('#333333').font('Helvetica-Bold').fontSize(11).text('TRANSACTION DETAILS', col1, detailY);

      const details = [
        ['Transaction ID', txnId || '—'],
        ['Order ID', orderId || '—'],
        ['Payment Method', 'Razorpay (UPI / Card / Net Banking)'],
        ['Payment Date', formattedDate],
        ['Status', 'Paid ✓'],
      ];

      details.forEach(([label, value], i) => {
        const y = detailY + 25 + i * 22;
        doc.font('Helvetica').fontSize(9).fillColor('#999999').text(label, col1 + 10, y);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#555555').text(value, col2 - 60, y);
      });

      // ── Footer ───────────────────────────────────────────────────
      const footerY = 680;
      doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#E0E0E0').lineWidth(1).stroke();
      doc.font('Helvetica').fontSize(8).fillColor('#BBBBBB');
      doc.text('This is a computer-generated receipt. No signature is required.', 50, footerY + 10, { align: 'center', width: 495 });
      doc.text(`© ${new Date().getFullYear()} Sports Club Management System · All rights reserved`, 50, footerY + 24, { align: 'center', width: 495 });

      doc.end();
      stream.on('finish', () => resolve({ filePath, fileName }));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateReceipt;
