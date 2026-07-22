const PDFDocument = require('pdfkit');

class PdfRenderer {
    renderStream(reportData, writeStream) {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
            bufferPages: true
        });

        doc.pipe(writeStream);

        const { scan, aiAnalysis, vulnerabilities } = reportData;

        doc.rect(0, 0, doc.page.width, 15).fill('#00BFFF');
        doc.moveDown(4);
        doc.font('Helvetica-Bold').fontSize(28).fillColor('#0B132B').text('CYBERSHIELD X', { tracking: 2 });
        doc.fontSize(10).fillColor('#5a7fa8').text('AI-POWERED CYBERSECURITY ASSESSMENT');
        
        doc.end();
    }
}
module.exports = PdfRenderer;
