const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF certificate and saves it locally.
 * Returns the file path and fileName.
 */
async function generateCertificate({ userName, competitionName, competitionDate, medal, userType }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });

      const fileName = `cert_${Date.now()}_${userName.replace(/\s+/g, '_')}.pdf`;
      const outputDir = path.join(__dirname, '../../uploads/certificates');
      
      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, fileName);
      const stream = fs.createWriteStream(filePath);
      
      // Handle stream errors
      stream.on('error', (err) => {
        console.error('Stream write error:', err);
        reject(new Error(`Failed to write certificate file: ${err.message}`));
      });

      doc.on('error', (err) => {
        console.error('PDF document error:', err);
        reject(new Error(`Failed to generate PDF: ${err.message}`));
      });

      doc.pipe(stream);

      // Background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f9f6ee');

      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(4).stroke('#c8a951');

      // Club name / header
      doc.fillColor('#1a3c5e').fontSize(28).font('Helvetica-Bold')
        .text('SPORTS CLUB MANAGEMENT', 0, 60, { align: 'center' });

      // Certificate title
      doc.fillColor('#c8a951').fontSize(42).font('Helvetica-Bold')
        .text('CERTIFICATE OF ACHIEVEMENT', 0, 105, { align: 'center' });

      // Divider line
      doc.moveTo(80, 165).lineTo(doc.page.width - 80, 165).lineWidth(1.5).stroke('#c8a951');

      // Body text
      doc.fillColor('#333').fontSize(16).font('Helvetica')
        .text('This is to certify that', 0, 185, { align: 'center' });

      // Athlete/Coach name
      doc.fillColor('#1a3c5e').fontSize(34).font('Helvetica-Bold')
        .text(userName, 0, 210, { align: 'center' });

      doc.fillColor('#333').fontSize(16).font('Helvetica')
        .text(`registered as ${userType.charAt(0).toUpperCase() + userType.slice(1)}, has`, 0, 255, { align: 'center' })
        .text('successfully participated in', 0, 280, { align: 'center' });

      // Competition name
      doc.fillColor('#c8a951').fontSize(26).font('Helvetica-Bold')
        .text(competitionName, 0, 305, { align: 'center' });

      // Date
      doc.fillColor('#555').fontSize(14).font('Helvetica')
        .text(`held on ${new Date(competitionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 0, 345, { align: 'center' });

      // Medal
      const medalColors = { Gold: '#FFD700', Silver: '#C0C0C0', Bronze: '#CD7F32', Participant: '#1a3c5e' };
      doc.fillColor(medalColors[medal] || '#1a3c5e').fontSize(22).font('Helvetica-Bold')
        .text(`🏅 ${medal} ${medal !== 'Participant' ? 'Medal' : '— Participation'}`, 0, 385, { align: 'center' });

      // Footer / signature line
      doc.moveTo(80, 450).lineTo(280, 450).lineWidth(1).stroke('#333');
      doc.fillColor('#333').fontSize(12).font('Helvetica').text('Administrator Signature', 80, 458);

      doc.moveTo(doc.page.width - 280, 450).lineTo(doc.page.width - 80, 450).lineWidth(1).stroke('#333');
      doc.fillColor('#333').fontSize(12).text('Date of Issue', doc.page.width - 280, 458);

      doc.end();
      
      stream.on('finish', () => {
        console.log(`Certificate generated: ${fileName}`);
        resolve({ filePath, fileName });
      });
    } catch (err) {
      console.error('Certificate generation error:', err);
      reject(new Error(`Certificate generation failed: ${err.message}`));
    }
  });
}

module.exports = generateCertificate;