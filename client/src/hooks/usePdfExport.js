import { useState, useCallback } from 'react';

const riskHex = (level) => ({ dangerous: '#ff2244', medium: '#ff8c00', low: '#ffdd00', safe: '#00ff88' }[level] || '#ff2244');
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

export default function usePdfExport() {
  const [exporting, setExporting] = useState(false);

  const exportPdf = useCallback(async (scan, user) => {
    if (!scan) return;

    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const color = riskHex(scan.riskLevel);
      const [r, g, b] = hexToRgb(color);
      const vt = scan.breakdown?.virusTotal;
      const abuse = scan.breakdown?.abuseIPDB;

      // 1. Background Base
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, W, H, 'F');

      // Watermark (CyberShield centered)
      doc.setTextColor(240, 240, 245);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(70);
      doc.text('CYBERSHIELD', W / 2, H / 2, { align: 'center', angle: -45 });

      // 2. Header Block
      doc.setFillColor(15, 20, 30);
      doc.rect(0, 0, W, 35, 'F');
      
      doc.setTextColor(0, 212, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('CYBERSHIELD X', 14, 18);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 180, 210);
      doc.setFont('helvetica', 'normal');
      doc.text('T H R E A T   I N T E L L I G E N C E   A N A L Y S I S', 15, 26);
      
      doc.setTextColor(200, 210, 220);
      doc.setFontSize(7);
      doc.text(`DATE GENERATED  :  ${new Date().toLocaleString()}`, W - 14, 18, { align: 'right' });
      doc.text(`AUTHORIZED SIG  :  ${user?.username?.toUpperCase() || 'SYSTEM'}`, W - 14, 24, { align: 'right' });
      doc.text(`DOC CLASSIFICATION:  LEVEL-4 RESTRICTED`, W - 14, 30, { align: 'right' });

      doc.setFillColor(r, g, b);
      doc.rect(0, 35, W, 2, 'F');

      // 3. Central Risk Score Core
      let y = 55;
      doc.setTextColor(r, g, b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(54);
      doc.text(`${scan.threatScore}`, 14, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.setTextColor(40, 50, 60);
      doc.text('/100', 48, y);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(r, g, b);
      doc.text(`[ ${(scan.riskLevel || 'UNKNOWN').toUpperCase()} RISK LEVEL ]`, 14, y + 10);

      // 4. Target Matrix details
      y += 25;
      doc.setFillColor(245, 248, 252);
      doc.setDrawColor(200, 210, 220);
      doc.roundedRect(14, y, W - 28, 42, 2, 2, 'FD');

      const row = (label, value, ry, isDark = true) => {
        doc.setTextColor(80, 100, 120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`• ${label.toUpperCase()}`, 20, ry);
        
        doc.setTextColor(isDark ? 0 : 255, isDark ? 0 : 255, isDark ? 0 : 255);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value ?? '—'), W - 20, ry, { align: 'right', maxWidth: 100 });
      };

      row('Analyzed Target', scan.target, y + 10);
      row('Entity Type', (scan.targetType || '').toUpperCase(), y + 20);
      row('Evaluation Status', 'COMPLETED', y + 30);
      
      // 5. VirusTotal Breakdown
      y += 56;
      doc.setTextColor(0, 120, 200);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('▶ VIRUSTOTAL TELEMETRY', 14, y);
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 225, 235);
      doc.roundedRect(14, y + 4, W - 28, 30, 2, 2, 'FD');
      if (vt) {
        doc.setTextColor(vt.positives > 0 ? 200 : 0, vt.positives > 0 ? 30 : 150, 80);
        row('Detection Engines', `${vt.positives ?? 0} FLAGGED / ${vt.total ?? 0} TOTAL`, y + 13);
        row('Last Scanned', vt.scanDate ? new Date(vt.scanDate).toLocaleDateString() : '—', y + 22);
        row('Global Hash Permalink', vt.permalink ? 'AVAILABLE (ONLINE DB)' : '—', y + 31);
      } else {
         doc.setTextColor(150, 150, 160);
         doc.setFontSize(8);
         doc.setFont("helvetica", "italic");
         doc.text('No VirusTotal signatures detected for this entity type.', 20, y + 20);
      }

      // 6. AbuseIPDB Breakdown
      y += 46;
      doc.setTextColor(0, 120, 200);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('▶ ABUSEIPDB NETWORK INTEL', 14, y);
      
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, y + 4, W - 28, 30, 2, 2, 'FD');
      if (abuse) {
        row('Abuse Confidence Index', `${abuse.abuseConfidenceScore ?? 0}%`, y + 13);
        row('Registered Reports', String(abuse.totalReports ?? 0), y + 22);
        row('Origin Node (Country)', abuse.countryCode || '—', y + 31);
      } else {
         doc.setTextColor(150, 150, 160);
         doc.setFontSize(8);
         doc.setFont("helvetica", "italic");
         doc.text('No AbuseIPDB routing data available for this entity type.', 20, y + 20);
      }

      // 7. Footer
      doc.setFillColor(245, 246, 248);
      doc.rect(0, H - 20, W, 20, 'F');
      
      doc.setDrawColor(200, 200, 210);
      doc.line(14, H - 20, W - 14, H - 20);
      
      doc.setTextColor(120, 130, 140);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Provided by CyberShield X', W / 2, H - 8, { align: 'center' });

      doc.save(`NEXUS-REPORT-${scan._id || scan.id || Date.now()}.pdf`);
    } catch (err) {
      console.error('[usePdfExport]', err);
      // eslint-disable-next-line no-alert
      alert('PDF failed. Run: cd client && npm install jspdf');
    } finally {
      setExporting(false);
    }
  }, []);

  const exportAdminProfilePdf = useCallback(async (reportData, adminUser) => {
    if (!reportData || !reportData.user) return;
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      
      // Background Base
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, W, H, 'F');

      // Watermark
      doc.setTextColor(240, 240, 245);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(70);
      doc.text('CYBERSHIELD', W / 2, H / 2, { align: 'center', angle: -45 });

      // Header Block
      doc.setFillColor(15, 20, 30);
      doc.rect(0, 0, W, 35, 'F');
      
      doc.setTextColor(0, 212, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('CYBERSHIELD X', 14, 18);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 180, 210);
      doc.setFont('helvetica', 'normal');
      doc.text('A D M I N   U S E R   P R O F I L E', 15, 26);
      
      doc.setTextColor(200, 210, 220);
      doc.setFontSize(7);
      doc.text(`DATE GENERATED  :  ${new Date().toLocaleString()}`, W - 14, 18, { align: 'right' });
      doc.text(`ADMIN OFFICER  :  ${adminUser?.username?.toUpperCase() || 'SYSTEM'}`, W - 14, 24, { align: 'right' });
      doc.text(`DOC CLASSIFICATION:  SENSITIVE DATA`, W - 14, 30, { align: 'right' });

      let y = 50;
      doc.setTextColor(40, 50, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('TARGET INTELLIGENCE PROFILE', 14, y);

      y += 10;
      doc.setFillColor(245, 248, 252);
      doc.setDrawColor(200, 210, 220);
      doc.roundedRect(14, y, W - 28, 48, 2, 2, 'FD');

      const row = (label, value, ry) => {
        doc.setTextColor(80, 100, 120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`• ${label.toUpperCase()}`, 20, ry);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value ?? '—'), W - 20, ry, { align: 'right' });
      };

      row('Username', reportData.user.username, y + 10);
      row('Email Address', reportData.user.email, y + 20);
      row('Verification Status', reportData.user.emailVerified ? 'VERIFIED' : 'UNVERIFIED', y + 30);
      row('2FA Status', reportData.user.twoFactorEnabled ? 'ENABLED' : 'DISABLED', y + 40);

      y += 60;
      doc.setTextColor(40, 50, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('OPERATIONAL METRICS', 14, y);

      y += 10;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, y, W - 28, 30, 2, 2, 'FD');

      const totalScans = reportData.scans?.length || 0;
      const breachChecks = reportData.activities?.filter(a => a.action?.startsWith('BREACH_CHECK'))?.length || 0;

      row('Total Security Scans', String(totalScans), y + 10);
      row('Data Breach Checks', String(breachChecks), y + 20);

      // Footer
      doc.setFillColor(245, 246, 248);
      doc.rect(0, H - 20, W, 20, 'F');
      
      doc.setDrawColor(200, 200, 210);
      doc.line(14, H - 20, W - 14, H - 20);
      
      doc.setTextColor(120, 130, 140);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Provided by CyberShield X', W / 2, H - 8, { align: 'center' });

      doc.save(`USER-PROFILE-${reportData.user._id}.pdf`);
    } catch (err) {
      console.error('[exportAdminProfilePdf]', err);
    } finally {
      setExporting(false);
    }
  }, []);

  const exportBreachPdf = useCallback(async (result, target, user) => {
    if (!result) return;
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      
      const isBreached = result.found;
      const color = isBreached ? '#ff2244' : '#00ff88';
      const [r, g, b] = hexToRgb(color);

      // Background Base
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, W, H, 'F');

      // Header Block
      doc.setFillColor(15, 20, 30);
      doc.rect(0, 0, W, 35, 'F');
      
      doc.setTextColor(0, 212, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('CYBERSHIELD X', 14, 18);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 180, 210);
      doc.setFont('helvetica', 'normal');
      doc.text('D A R K   W E B   I N T E L L I G E N C E   R E P O R T', 15, 26);
      
      doc.setTextColor(200, 210, 220);
      doc.setFontSize(7);
      doc.text(`DATE GENERATED  :  ${new Date().toLocaleString()}`, W - 14, 18, { align: 'right' });
      doc.text(`AUTHORIZED SIG  :  ${user?.username?.toUpperCase() || 'SYSTEM'}`, W - 14, 24, { align: 'right' });
      
      doc.setFillColor(r, g, b);
      doc.rect(0, 35, W, 2, 'F');

      let y = 50;
      doc.setTextColor(r, g, b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(isBreached ? 'CRITICAL COMPROMISE DETECTED' : 'PERIMETER SECURE', 14, y);

      y += 10;
      doc.setFillColor(245, 248, 252);
      doc.setDrawColor(200, 210, 220);
      doc.roundedRect(14, y, W - 28, 30, 2, 2, 'FD');

      const row = (label, value, ry) => {
        doc.setTextColor(80, 100, 120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`• ${label.toUpperCase()}`, 20, ry);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value ?? '—'), W - 20, ry, { align: 'right' });
      };

      row('Analyzed Target', target, y + 10);
      row('Methodology', result.methodology || 'Dark Web Correlation', y + 20);

      y += 40;

      if (isBreached && result.leaks) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`CONFIRMED LEAKS: ${result.leaks.length}`, 14, y);
        y += 10;

        result.leaks.forEach((leak, idx) => {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFillColor(255, 240, 240);
          doc.setDrawColor(255, 100, 100);
          doc.roundedRect(14, y, W - 28, 45, 2, 2, 'FD');
          
          doc.setTextColor(200, 0, 0);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(leak.name, 18, y + 8);
          
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Date: ${leak.date} | Hacker Group: ${leak.hackerGroup}`, 18, y + 14);
          
          doc.setTextColor(0, 0, 0);
          const desc = doc.splitTextToSize(leak.description || '', W - 36);
          doc.text(desc, 18, y + 22);
          
          const classes = leak.dataClasses?.join(', ') || '';
          doc.setTextColor(200, 50, 50);
          doc.setFont('helvetica', 'bold');
          doc.text(`Data Compromised: ${classes}`, 18, y + 38);

          y += 50;
        });
      }

      // Footer
      doc.setFillColor(245, 246, 248);
      doc.rect(0, H - 20, W, 20, 'F');
      
      doc.setTextColor(120, 130, 140);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Provided by CyberShield X', W / 2, H - 8, { align: 'center' });

      doc.save(`DARK-WEB-REPORT-${target}.pdf`);
    } catch (err) {
      console.error('[exportBreachPdf]', err);
    } finally {
      setExporting(false);
    }
  }, []);

  const exportToolReportPdf = useCallback(async (toolName, target, result, user) => {
    if (!result) return;
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      
      const riskColor = result.riskLevel ? riskHex(result.riskLevel) : '#00bfff';
      const [r, g, b] = hexToRgb(riskColor);

      // Background Base
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, W, H, 'F');

      // Header Block
      doc.setFillColor(15, 20, 30);
      doc.rect(0, 0, W, 35, 'F');
      
      doc.setTextColor(0, 212, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('CYBERSHIELD X', 14, 18);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 180, 210);
      doc.setFont('helvetica', 'normal');
      doc.text(`T O O L   I N T E L L I G E N C E :   ${toolName.toUpperCase()}`, 15, 26);
      
      doc.setTextColor(200, 210, 220);
      doc.setFontSize(7);
      doc.text(`DATE GENERATED  :  ${new Date().toLocaleString()}`, W - 14, 18, { align: 'right' });
      doc.text(`AUTHORIZED SIG  :  ${user?.username?.toUpperCase() || 'SYSTEM'}`, W - 14, 24, { align: 'right' });
      
      doc.setFillColor(r, g, b);
      doc.rect(0, 35, W, 2, 'F');

      let y = 50;
      doc.setTextColor(40, 50, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(`${toolName.toUpperCase()} ANALYSIS REPORT`, 14, y);

      y += 10;
      doc.setFillColor(245, 248, 252);
      doc.setDrawColor(200, 210, 220);
      doc.roundedRect(14, y, W - 28, 45, 2, 2, 'FD');

      const row = (label, value, ry) => {
        doc.setTextColor(80, 100, 120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`• ${label.toUpperCase()}`, 20, ry);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value ?? '—').substring(0, 70), W - 20, ry, { align: 'right' });
      };

      row('Analyzed Target', target || 'File/Text Input', y + 10);
      if (result.riskLevel) row('Assessed Risk Level', result.riskLevel.toUpperCase(), y + 20);
      if (result.score !== undefined) row('Threat Score', String(result.score), y + 30);
      if (result.verifyingAuthority) row('Verifying Authority', result.verifyingAuthority, y + 40);

      y += 60;
      doc.setTextColor(0, 120, 200);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('▶ ANALYSIS RESULTS & METADATA', 14, y);
      
      y += 5;
      doc.setTextColor(40, 50, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Auto-print generic keys
      const skipKeys = ['riskLevel', 'score', 'verifyingAuthority', 'rawAnalysis'];
      Object.entries(result).forEach(([k, v]) => {
        if (skipKeys.includes(k) || typeof v === 'object') return;
        if (y > H - 40) { doc.addPage(); y = 20; }
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.text(`${k.toUpperCase()}:`, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(v), 60, y, { maxWidth: W - 74 });
      });

      // Footer
      doc.setFillColor(245, 246, 248);
      doc.rect(0, H - 20, W, 20, 'F');
      
      doc.setTextColor(120, 130, 140);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Provided by CyberShield X', W / 2, H - 8, { align: 'center' });

      doc.save(`${toolName.replace(/\s+/g, '-').toUpperCase()}-REPORT.pdf`);
    } catch (err) {
      console.error('[exportToolReportPdf]', err);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportPdf, exportAdminProfilePdf, exportBreachPdf, exportToolReportPdf, exporting };
}
