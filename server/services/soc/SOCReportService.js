/**
 * 🛡️ CyberShield X — SOCReportService (Phase 74)
 *
 * Enterprise Report Generation, Immutability, Versioning, and Export Engine.
 * Formats operational metrics, executive summaries, compliance packages,
 * incident dossiers, and audit activities into versioned JSON, CSV, and PDF representations.
 */

const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const SOCReport = require('../../models/SOCReport');
const ReportSchedule = require('../../models/ReportSchedule');
const AuditEvent = require('../../models/AuditEvent');
const Incident = require('../../models/Incident');
const ThreatHunt = require('../../models/ThreatHunt');
const ThreatHuntExecution = require('../../models/ThreatHuntExecution');
const IOCRecord = require('../../models/IOCRecord');
const socMetricsService = require('./SOCMetricsService');
const executiveRiskService = require('./ExecutiveRiskService');
const complianceEvidenceService = require('./ComplianceEvidenceService');
const detectionCoverageService = require('./DetectionCoverageService');
const detectionTestingService = require('./DetectionTestingService');
const caseOrchestrationService = require('./CaseOrchestrationService');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

class SOCReportService {
  constructor(io = null) {
    this.io = io;
  }

  setIO(io) {
    this.io = io;
  }

  emitRealTimeEvent(event, data) {
    if (this.io) {
      try {
        this.io.emit(event, data);
      } catch (err) {
        logger.warn(`Failed to emit ${event} via Socket.IO: ${err.message}`);
      }
    }
  }

  _buildTenantQuery(organizationId, baseQuery = {}) {
    if (!organizationId) return { ...baseQuery };
    return {
      ...baseQuery,
      organizationId,
    };
  }

  /**
   * Orchestrates generation of a versioned, immutable SOC report
   */
  async generateReport({
    reportType = 'EXECUTIVE_SUMMARY',
    title = null,
    description = '',
    parameters = {},
    reportingPeriod = {},
    requestedBy = {},
    organizationId = null,
    baseReportId = null,
  }) {
    const normType = String(reportType).toUpperCase();
    const effectiveTitle = title || `${normType.replace(/_/g, ' ')} Report`;

    // Determine versioning: if a baseReportId or matching title exists, increment version
    let version = 1;
    let reportId = baseReportId || `REP-${normType.substring(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const existingReports = await SOCReport.find(
      this._buildTenantQuery(organizationId, {
        $or: [{ reportId }, { title: effectiveTitle }],
      })
    ).sort({ version: -1 });

    if (existingReports.length > 0) {
      version = (existingReports[0].version || 1) + 1;
      reportId = baseReportId || existingReports[0].reportId;
    }

    this.emitRealTimeEvent('report:started', {
      reportId,
      reportType: normType,
      version,
      organizationId,
    });

    let content = {};
    const evidenceReferences = [];

    // Dispatch to specialized report gatherer
    switch (normType) {
      case 'EXECUTIVE_SUMMARY': {
        const executiveRisk = await executiveRiskService.getExecutiveRiskSummary(organizationId);
        const kpis = await socMetricsService.getOperationalKPIs(organizationId);
        content = {
          executiveRisk,
          kpis,
          generatedAt: new Date(),
          generator: 'CyberShield X Executive Intelligence Engine',
        };
        for (const cit of executiveRisk.recordCitations || []) {
          evidenceReferences.push(cit.id);
        }
        break;
      }

      case 'SOC_OPERATIONS': {
        const kpis = await socMetricsService.getOperationalKPIs(organizationId);
        const mtta = await socMetricsService.getMTTA(organizationId);
        const mttr = await socMetricsService.getMTTR(organizationId);
        const sla = await socMetricsService.getSLAPerformance(organizationId);
        const trends = await socMetricsService.getHistoricalTrends(organizationId);
        content = {
          kpis,
          mtta,
          mttr,
          sla,
          trends,
          generatedAt: new Date(),
        };
        break;
      }

      case 'INCIDENT_REPORT': {
        const query = this._buildTenantQuery(organizationId);
        if (parameters.incidentId) {
          query.incidentId = parameters.incidentId;
        }
        const incidents = await Incident.find(query)
          .sort({ createdAt: -1 })
          .limit(parameters.limit || 20);

        content = {
          incidentCount: incidents.length,
          incidents: incidents.map((inc) => ({
            incidentId: inc.incidentId,
            title: inc.title,
            severity: inc.severity,
            status: inc.status,
            createdAt: inc.createdAt,
            affectedAssets: inc.affectedAssets,
            timelineEventCount: inc.timeline?.length || 0,
            responseActionCount: inc.responseActions?.length || 0,
            postmortemCompleted: Boolean(inc.closure?.postIncidentReviewCompleted),
          })),
        };
        for (const inc of incidents) {
          evidenceReferences.push(inc.incidentId);
        }
        break;
      }

      case 'CASE_DOSSIER': {
        if (parameters.caseId) {
          try {
            content = await caseOrchestrationService.compileCaseDossier(parameters.caseId, organizationId);
            evidenceReferences.push(parameters.caseId);
          } catch (err) {
            content = { error: err.message, caseId: parameters.caseId };
          }
        } else {
          content = { disclosure: 'Specify caseId parameter for individual case dossier compilation' };
        }
        break;
      }

      case 'THREAT_HUNT_REPORT': {
        const hunts = await ThreatHunt.find(this._buildTenantQuery(organizationId)).limit(20);
        const executions = await ThreatHuntExecution.find(this._buildTenantQuery(organizationId))
          .sort({ completedAt: -1 })
          .limit(20);

        content = {
          totalHunts: hunts.length,
          totalExecutions: executions.length,
          huntSummary: {
            totalHunts: hunts.length,
            totalExecutions: executions.length,
          },
          executions: executions.map((hex) => ({
            executionId: hex.executionId,
            huntTitle: hex.huntTitle,
            status: hex.status,
            matchesCount: hex.matchesCount || 0,
            completedAt: hex.completedAt,
          })),
        };
        for (const h of executions) {
          evidenceReferences.push(h.executionId);
        }
        break;
      }

      case 'DETECTION_COVERAGE': {
        const coverage = await detectionCoverageService.calculateCoverage(organizationId);
        const quality = await detectionTestingService.getQualityMetrics(organizationId);
        content = {
          coverage,
          quality,
          coverageSummary: coverage?.coverageSummary || coverage || {},
          generatedAt: new Date(),
        };
        break;
      }

      case 'THREAT_INTELLIGENCE': {
        const iocs = await IOCRecord.find(this._buildTenantQuery(organizationId))
          .sort({ createdAt: -1 })
          .limit(25)
          .select('iocId type value threatTypes providers reputation');

        content = {
          totalIOCs: iocs.length,
          indicators: iocs,
        };
        for (const i of iocs) {
          evidenceReferences.push(i.iocId || i.value);
        }
        break;
      }

      case 'COMPLIANCE_EVIDENCE': {
        content = await complianceEvidenceService.getComplianceFrameworkSummary(organizationId);
        for (const ctrl of content.controls || []) {
          evidenceReferences.push(ctrl.controlId);
        }
        break;
      }

      case 'AUDIT_ACTIVITY': {
        const query = this._buildTenantQuery(organizationId);
        if (parameters.action) query.action = new RegExp(parameters.action, 'i');
        if (parameters.actor) query['actor.username'] = parameters.actor;

        const auditEvents = await AuditEvent.find(query)
          .sort({ timestamp: -1 })
          .limit(parameters.limit || 50);

        content = {
          totalEvents: auditEvents.length,
          totalEventsReturned: auditEvents.length,
          events: auditEvents.map((a) => ({
            eventId: a.eventId,
            action: a.action,
            actor: a.actor?.username || 'system',
            outcome: a.outcome,
            resource: a.resource,
            timestamp: a.timestamp,
            detailsRedacted: true,
          })),
        };
        for (const a of auditEvents) {
          evidenceReferences.push(a.eventId);
        }
        break;
      }

      default:
        throw new Error(`Unsupported report type: ${normType}`);
    }

    // Compute cryptographic SHA-256 checksum over content snapshot
    const checksum = crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');

    // Generate CSV and PDF representations
    const csvContent = this.generateCSV(normType, content);
    const pdfBuffer = await this.generatePDF(normType, effectiveTitle, version, content, checksum);

    const jsonStr = JSON.stringify(content, null, 2);
    const pdfBase64 = pdfBuffer ? pdfBuffer.toString('base64') : '';

    const report = new SOCReport({
      reportId,
      reportType: normType,
      title: effectiveTitle,
      description,
      version,
      status: 'GENERATED',
      reportingPeriod,
      parameters,
      content,
      contentSnapshot: content,
      evidenceReferences,
      checksum,
      contentHash: checksum,
      generatorVersion: 'v61.7.0',
      fileExports: {
        json: jsonStr,
        csv: csvContent,
        pdf: pdfBase64 ? `data:application/pdf;base64,${pdfBase64}` : null,
      },
      exports: {
        jsonData: jsonStr,
        csvData: csvContent,
        pdfData: pdfBase64,
      },
      requestedBy: {
        userId: requestedBy.userId || requestedBy.id || 'system',
        username: requestedBy.username || requestedBy.name || 'OPERATOR',
        role: requestedBy.role || 'OPERATOR',
      },
      organizationId,
      completedAt: new Date(),
      generatedAt: new Date(),
    });

    await report.save();

    await auditLogger.log({
      actor: requestedBy,
      organizationId,
      action: 'SOC_REPORT_GENERATED',
      resource: { type: 'SOC_REPORT', id: reportId },
      outcome: 'SUCCESS',
      details: { reportType: normType, version, checksum },
    });

    this.emitRealTimeEvent('report:completed', {
      reportId,
      reportType: normType,
      version,
      checksum,
    });

    return report;
  }

  /**
   * Generates flattened tabular CSV output based on report type
   */
  generateCSV(reportType, content) {
    const lines = [];

    switch (reportType) {
      case 'EXECUTIVE_SUMMARY': {
        lines.push('Metric,Value,Status');
        const risk = content.executiveRisk || {};
        lines.push(`Overall Risk Score,${risk.overallRiskScore || 0},${risk.riskLevel || 'NORMAL'}`);
        lines.push(`Open Incidents,${risk.counts?.openIncidents || 0},MONITORED`);
        lines.push(`Critical Incidents,${risk.counts?.criticalIncidents || 0},ATTENTION`);
        lines.push(`Unresolved Findings,${risk.counts?.unresolvedFindings || 0},ACTIVE`);
        lines.push(`Active Detection Gaps,${risk.counts?.activeDetectionGaps || 0},ACTIVE`);
        lines.push(`SLA Breaches,${risk.counts?.slaBreachedIncidents || 0},GOVERNED`);
        break;
      }

      case 'SOC_OPERATIONS': {
        lines.push('Metric,Average,Median,Min,Max,SampleSize');
        const mtta = content.mtta || {};
        const mttr = content.mttr || {};
        lines.push(`MTTA (Minutes),${mtta.averageMinutes || 'N/A'},${mtta.medianMinutes || 'N/A'},${mtta.minMinutes || 'N/A'},${mtta.maxMinutes || 'N/A'},${mtta.sampleSize || 0}`);
        lines.push(`MTTR (Minutes),${mttr.averageMinutes || 'N/A'},${mttr.medianMinutes || 'N/A'},${mttr.minMinutes || 'N/A'},${mttr.maxMinutes || 'N/A'},${mttr.sampleSize || 0}`);
        lines.push('');
        lines.push('SLA Category,Count');
        const sla = content.sla || {};
        lines.push(`Total Governed,${sla.totalSlaGoverned || 0}`);
        lines.push(`On Track,${sla.onTrackCount || 0}`);
        lines.push(`At Risk,${sla.atRiskCount || 0}`);
        lines.push(`Breached,${sla.breachedCount || 0}`);
        lines.push(`Breach Rate %,${sla.breachRate || 0}`);
        break;
      }

      case 'INCIDENT_REPORT': {
        lines.push('IncidentId,Title,Severity,Status,CreatedAt,AffectedAssets,Postmortem');
        for (const i of content.incidents || []) {
          const assets = (i.affectedAssets || []).join(';');
          lines.push(`"${i.incidentId}","${i.title.replace(/"/g, '""')}","${i.severity}","${i.status}","${i.createdAt}","${assets}","${i.postmortemCompleted}"`);
        }
        break;
      }

      case 'AUDIT_ACTIVITY': {
        lines.push('EventId,Action,Actor,Outcome,Timestamp');
        for (const a of content.events || []) {
          lines.push(`"${a.eventId}","${a.action}","${a.actor}","${a.outcome}","${a.timestamp}"`);
        }
        break;
      }

      case 'COMPLIANCE_EVIDENCE': {
        lines.push('ControlId,Domain,Title,Status,EvidenceCount');
        for (const c of content.controls || []) {
          lines.push(`"${c.controlId}","${c.domain}","${c.title.replace(/"/g, '""')}","${c.status}","${c.evidenceCount}"`);
        }
        break;
      }

      default: {
        lines.push('Key,Value');
        lines.push(`ReportType,${reportType}`);
        lines.push(`SnapshotData,${JSON.stringify(content).replace(/"/g, '""')}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generates a formal PDF buffer for reports
   */
  async generatePDF(reportType, title, version, content, checksum) {
    return new Promise((resolve) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).fillColor('#003366').text('CYBERSHIELD X', { align: 'left' });
        doc.fontSize(12).fillColor('#666666').text('Enterprise Security Operations & Compliance Dossier', { align: 'left' });
        doc.moveDown(0.5);

        // Metadata box
        doc.fontSize(16).fillColor('#111111').text(`${title} (v${version})`);
        doc.fontSize(9).fillColor('#555555').text(`Report Type: ${reportType} | Generated: ${new Date().toISOString()}`);
        doc.fontSize(8).fillColor('#888888').text(`Integrity Checksum (SHA-256): ${checksum}`);
        doc.moveDown(1);
        doc.strokeColor('#cccccc').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // Body Content
        doc.fontSize(12).fillColor('#222222').text('Operational Summary & Verified Telemetry:', { underline: true });
        doc.moveDown(0.5);

        const summaryText = JSON.stringify(content, null, 2);
        doc.fontSize(8).fillColor('#333333').font('Courier').text(summaryText.substring(0, 3000), {
          lineBreak: true,
          width: 500,
        });

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).fillColor('#999999').font('Helvetica').text('Truthful SOC Evidence Certification • Zero Synthetic Inflation • CyberShield X', {
          align: 'center',
        });

        doc.end();
      } catch (err) {
        logger.warn(`PDF generation error: ${err.message}`);
        resolve(null);
      }
    });
  }

  /**
   * Fetches report exports in desired format
   */
  async exportReport(reportId, format = 'json', organizationId = null) {
    const report = await SOCReport.findOne(
      this._buildTenantQuery(organizationId, { reportId })
    );
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const normFormat = String(format).toLowerCase();
    const filename = `${report.reportId}_v${report.version}.${normFormat}`;

    if (normFormat === 'json') {
      return {
        contentType: 'application/json',
        filename,
        content: report.fileExports?.json || JSON.stringify(report.content, null, 2),
      };
    } else if (normFormat === 'csv') {
      return {
        contentType: 'text/csv',
        filename,
        content: report.fileExports?.csv || this.generateCSV(report.reportType, report.content),
      };
    } else if (normFormat === 'pdf') {
      let pdfData = report.fileExports?.pdf;
      if (pdfData && pdfData.startsWith('data:application/pdf;base64,')) {
        return {
          contentType: 'application/pdf',
          filename,
          content: Buffer.from(pdfData.split(',')[1], 'base64'),
        };
      }
      // Generate dynamically if missing
      const buffer = await this.generatePDF(report.reportType, report.title, report.version, report.content, report.checksum);
      return {
        contentType: 'application/pdf',
        filename,
        content: buffer || Buffer.from('PDF generation unavailable'),
      };
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Executes a scheduled reporting job
   * Strictly separates report generation result from delivery result
   */
  async executeSchedule(scheduleId) {
    const schedule = await ReportSchedule.findOne({ scheduleId });
    if (!schedule) {
      throw new Error(`Report schedule ${scheduleId} not found`);
    }

    let report = null;
    let runStatus = 'FAILED';
    let deliveryStatus = 'PENDING';
    let errorMessage = null;

    try {
      report = await this.generateReport({
        reportType: schedule.reportType,
        title: `${schedule.name} - Automated Run`,
        parameters: schedule.parameters || {},
        organizationId: schedule.organizationId,
        requestedBy: { username: 'SCHEDULER', role: 'SYSTEM' },
      });
      runStatus = 'SUCCESS';
      deliveryStatus = 'PENDING';
    } catch (err) {
      runStatus = 'FAILED';
      deliveryStatus = 'FAILED';
      errorMessage = err.message;
    }

    schedule.lastRunAt = new Date();
    schedule.lastStatus = runStatus;
    schedule.lastRunStatus = runStatus;
    schedule.deliveryStatus = deliveryStatus;
    schedule.lastDeliveryStatus = deliveryStatus;
    schedule.history.push({
      runAt: new Date(),
      status: runStatus,
      runStatus,
      reportId: report?.reportId || null,
      deliveryStatus,
      errorMessage,
    });

    await schedule.save();

    return {
      success: runStatus === 'SUCCESS',
      scheduleId,
      reportId: report?.reportId,
      runStatus,
      lastRunStatus: runStatus,
      deliveryStatus,
      lastDeliveryStatus: deliveryStatus,
    };
  }
}

module.exports = new SOCReportService();
