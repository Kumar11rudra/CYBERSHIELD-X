const PDFDocument = require('pdfkit');

const SOURCE_LABELS = {
  virusTotal: 'VirusTotal',
  abuseIPDB: 'AbuseIPDB',
  domainIntel: 'Domain Intel',
  hashlookup: 'CIRCL Hashlookup',
};

const generateScanReport = (scan, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const riskColors = {
        dangerous: [255, 34, 68],
        medium: [255, 140, 0],
        low: [255, 221, 0],
        safe: [0, 255, 136],
      };
      const riskColor = riskColors[scan.riskLevel] || [255, 34, 68];

      // Header
      doc.rect(0, 0, doc.page.width, 80).fill([13, 17, 23]);
      doc.fillColor([255, 255, 255]).fontSize(22).font('Helvetica-Bold')
        .text('CyberShield X', 50, 25);
      doc.fillColor([100, 120, 180]).fontSize(10).font('Helvetica')
        .text('Threat Intelligence Report', 50, 52);
      doc.fillColor([255, 255, 255]).fontSize(10)
        .text(`Generated: ${new Date().toLocaleString()}`, 300, 40, { align: 'right' });

      doc.moveDown(3);

      // Risk badge
      doc.fillColor(riskColor).fontSize(28).font('Helvetica-Bold')
        .text(`${scan.threatScore}/100`, 50, 110);
      doc.fillColor(riskColor).fontSize(14)
        .text(scan.riskLevel.toUpperCase(), 50, 145);

      // Target info
      doc.fillColor([60, 80, 120]).rect(50, 170, doc.page.width - 100, 1).fill();
      doc.moveDown();

      doc.fillColor([30, 50, 100]).fontSize(12).font('Helvetica-Bold')
        .text('Scan Details', 50, 180);
      doc.fillColor([60, 80, 120]).fontSize(10).font('Helvetica');

      const details = [
        ['Target', scan.target],
        ['Type', scan.targetType.toUpperCase()],
        ['Risk Level', scan.riskLevel.toUpperCase()],
        ['Scanned By', user?.username || 'Unknown'],
        ['Scan Date', new Date(scan.createdAt).toLocaleString()],
      ];

      let y = 200;
      details.forEach(([label, value]) => {
        doc.fillColor([100, 130, 180]).font('Helvetica-Bold').text(`${label}:`, 50, y);
        doc.fillColor([40, 60, 100]).font('Helvetica').text(value, 180, y);
        y += 20;
      });

      // Source scores
      y += 20;
      doc.fillColor([30, 50, 100]).fontSize(12).font('Helvetica-Bold')
        .text('Source Scores', 50, y);
      y += 20;

      Object.entries(scan.sourceScores || {}).forEach(([source, score]) => {
        const label = SOURCE_LABELS[source] || source;
        doc.fillColor([100, 130, 180]).font('Helvetica-Bold').text(`${label}:`, 50, y);
        doc.fillColor([40, 60, 100]).font('Helvetica').text(`${score}/100`, 180, y);
        y += 20;
      });

      // Footer
      doc.fillColor([13, 17, 23])
        .rect(0, doc.page.height - 40, doc.page.width, 40).fill();
      doc.fillColor([100, 130, 180]).fontSize(9)
        .text('CyberShield X — Threat Intelligence Platform — Confidential', 50, doc.page.height - 25, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateScanReport };
