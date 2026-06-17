const PDFDocument = require('pdfkit');
const Scan = require('../models/Scan');
const AIAnalysis = require('../models/AIAnalysis');
const logger = require('../utils/logger');

const generatePdfReport = async (req, res, next) => {
  try {
    const { scanId } = req.params;
    if (!scanId) {
      return res.status(400).json({ error: 'Scan ID parameter is required.' });
    }

    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({ error: 'Scan record not found.' });
    }

    // Attempt to fetch any cached AI analysis
    const aiAnalysis = await AIAnalysis.findOne({ scanId }).sort({ createdAt: -1 });

    // Fetch vulnerabilities for the scan's asset
    let vulnerabilities = [];
    try {
      const Asset = require('../models/Asset');
      const Vulnerability = require('../models/Vulnerability');
      const targetHost = scan.target.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      const assetQuery = scan.organizationId
        ? { organizationId: scan.organizationId, hostname: targetHost }
        : { userId: scan.userId, hostname: targetHost };
      const asset = await Asset.findOne(assetQuery);
      if (asset) {
        vulnerabilities = await Vulnerability.find({ assetId: asset._id }).limit(3);
      }
    } catch (err) {
      logger.error(`[PDF-EXPORT] Failed resolving asset vulnerabilities: ${err.message}`);
    }

    // Initialize PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true // Allows multi-page page number overlays
    });

    // Set response headers to stream PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CyberShield_Enterprise_Report_${scanId}.pdf`);
    doc.pipe(res);

    // ── PAGE 1: COVER PAGE ────────────────────────────────────────────────────
    
    // Draw cyber accent top bar
    doc.rect(0, 0, doc.page.width, 15)
       .fill('#00BFFF');

    // Title Block
    doc.moveDown(4);
    doc.font('Helvetica-Bold')
       .fontSize(28)
       .fillColor('#0B132B')
       .text('CYBERSHIELD X', { tracking: 2 });
    
    doc.fontSize(10)
       .fillColor('#5a7fa8')
       .text('AI-POWERED CYBERSECURITY ASSESSMENT');

    doc.moveDown(5);
    
    // Decorative line
    doc.moveTo(50, doc.y)
       .lineTo(540, doc.y)
       .strokeColor('#e2e8f0')
       .lineWidth(1)
       .stroke();

    doc.moveDown(2);

    doc.fontSize(18)
       .fillColor('#0B132B')
       .text('Enterprise Vulnerability & Threat Assessment');

    doc.moveDown(3);

    // Metadata Table Widget
    const metaY = doc.y;
    doc.rect(50, metaY, 490, 160)
       .fill('#F8FAFC');

    doc.fillColor('#0B132B');
    doc.font('Helvetica-Bold').fontSize(10).text('TARGET NODE:', 70, metaY + 20);
    doc.font('Helvetica').text(scan.target, 200, metaY + 20);

    doc.font('Helvetica-Bold').text('TARGET TYPE:', 70, metaY + 45);
    doc.font('Helvetica').text(scan.targetType?.toUpperCase() || 'IP', 200, metaY + 45);

    doc.font('Helvetica-Bold').text('OVERALL SCORE:', 70, metaY + 70);
    const scoreColor = scan.threatScore >= 75 ? '#FF2244' : scan.threatScore >= 40 ? '#FF8C00' : '#00FF88';
    doc.font('Helvetica-Bold').fillColor(scoreColor).text(`${scan.threatScore}/100 (${scan.riskLevel?.toUpperCase()})`, 200, metaY + 70);
    doc.fillColor('#0B132B'); // reset

    doc.font('Helvetica-Bold').text('SCAN IDENTIFIER:', 70, metaY + 95);
    doc.font('Helvetica').text(scan._id.toString(), 200, metaY + 95);

    doc.font('Helvetica-Bold').text('ASSESSMENT DATE:', 70, metaY + 120);
    doc.font('Helvetica').text(new Date(scan.createdAt).toUTCString(), 200, metaY + 120);

    // Footer info
    doc.font('Helvetica-Bold')
       .fontSize(8)
       .fillColor('#94a3b8')
       .text('CONFIDENTIAL // INTERNAL USE ONLY', 50, doc.page.height - 70, { align: 'center' });

    // ── PAGE 2: SECURITY ANALYST TRIAGE ───────────────────────────────────────
    doc.addPage();
    
    // Header banner on subsequent pages
    doc.rect(0, 0, doc.page.width, 8)
       .fill('#0B132B');

    doc.moveDown(2);
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('#0B132B')
       .text('Security Triage Summary', 50, 40);

    doc.moveTo(50, 62)
       .lineTo(540, 62)
       .strokeColor('#0B132B')
       .lineWidth(0.5)
       .stroke();

    doc.moveDown(2);

    if (aiAnalysis) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#00BFFF').text('AI Senior Analyst Executive Triage:');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(9.5).fillColor('#334155').text(aiAnalysis.executiveSummary, { lineGap: 3 });
      doc.moveDown(1.5);

      if (aiAnalysis.findings && aiAnalysis.findings.length > 0) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#FF2244').text('Key Vulnerability Findings:');
        doc.moveDown(0.5);
        aiAnalysis.findings.forEach(f => {
          doc.font('Helvetica').fontSize(9).fillColor('#334155').text(`• ${f}`, { indent: 15, lineGap: 2 });
        });
        doc.moveDown(1.5);
      }

      if (aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#00FF88').text('Hardening & Action Items:');
        doc.moveDown(0.5);
        aiAnalysis.recommendations.forEach(r => {
          doc.font('Helvetica').fontSize(9).fillColor('#334155').text(`• ${r}`, { indent: 15, lineGap: 2 });
        });
        doc.moveDown(1.5);
      }

      if (aiAnalysis.remediationPlan) {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#FF8C00').text('Detailed Remediation Plan:');
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(9.5).fillColor('#334155').text(aiAnalysis.remediationPlan, { lineGap: 3 });
      }

    } else {
      // Fallback if no AI Analysis is cached
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#5a7fa8').text('Passive Heuristics Assessment:');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).fillColor('#334155')
         .text(`The system assessed the target node in fallback sandbox mode. The threat score resolved to ${scan.threatScore}/100. It is recommended to run a deep AI analysis for customized mitigation roadmaps.`, { lineGap: 3 });
    }

    // ── PAGE 3: AI VULNERABILITY REMEDIATION ROADMAPS ──────────────────────────
    if (vulnerabilities && vulnerabilities.length > 0) {
      doc.addPage();

      doc.rect(0, 0, doc.page.width, 8)
         .fill('#0B132B');

      doc.moveDown(2);
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .fillColor('#0B132B')
         .text('AI Remediation Roadmaps', 50, 40);

      doc.moveTo(50, 62)
         .lineTo(540, 62)
         .strokeColor('#0B132B')
         .lineWidth(0.5)
         .stroke();

      doc.moveDown(1.5);

      const { generateRemediationPlan } = require('../services/remediationService');

      for (const vuln of vulnerabilities) {
        try {
          const plan = await generateRemediationPlan(vuln.cve, vuln.description || '');

          doc.font('Helvetica-Bold').fontSize(11).fillColor('#FF2244').text(`CVE: ${vuln.cve} (${vuln.severity})`);
          doc.moveDown(0.2);

          doc.font('Helvetica-Bold').fontSize(9).fillColor('#0B132B').text('Executive Summary:');
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(plan.executiveSummary, { lineGap: 1.5 });
          doc.moveDown(0.4);

          doc.font('Helvetica-Bold').fontSize(9).fillColor('#0B132B').text('Root Cause:');
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(plan.rootCause, { lineGap: 1.5 });
          doc.moveDown(0.4);

          doc.font('Helvetica-Bold').fontSize(9).fillColor('#0B132B').text('Recommended Fix:');
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(plan.recommendedFix, { lineGap: 1.5 });
          doc.moveDown(0.4);

          doc.font('Helvetica-Bold').fontSize(9).fillColor('#0B132B').text('Verification Checklist:');
          doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(plan.verificationChecklist, { lineGap: 1.5 });
          doc.moveDown(0.8);
        } catch (err) {
          logger.error(`[PDF-REMEDIATION] Failed adding remediation for ${vuln.cve}: ${err.message}`);
        }
      }
    }

    // ── PAGE 4: RAW SCAN LOG DETAILS ──────────────────────────────────────────
    doc.addPage();
    
    doc.rect(0, 0, doc.page.width, 8)
       .fill('#0B132B');

    doc.moveDown(2);
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('#0B132B')
       .text('Raw Execution Log Output', 50, 40);

    doc.moveTo(50, 62)
       .lineTo(540, 62)
       .strokeColor('#0B132B')
       .lineWidth(0.5)
       .stroke();

    doc.moveDown(2);

    // Fetch the raw log from the breakdown
    let rawLogText = '';
    const bd = scan.breakdown || {};
    if (bd.virusTotal && bd.virusTotal.rawLog) rawLogText = bd.virusTotal.rawLog;
    else if (bd.rawOutput) rawLogText = bd.rawOutput;
    else rawLogText = JSON.stringify(bd, null, 2);

    doc.font('Courier')
       .fontSize(7.5)
       .fillColor('#1e293b')
       .text(rawLogText || 'No raw output saved.', { lineGap: 1.5 });

    // Add page numbers overlay at the very end
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('#94a3b8')
         .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 40, { align: 'right' });
    }

    // Conclude document
    doc.end();
    logger.info(`[REPORTS] Compiled backend PDF for Scan ID: ${scanId}`);
  } catch (error) {
    next(error);
  }
};

module.exports = { generatePdfReport };
