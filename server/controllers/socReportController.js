/**
 * 🛡️ CyberShield X — SOC Report Controller (Phase 74)
 *
 * REST APIs for Enterprise SOC Reporting, Metrics Engine, SLA Performance,
 * Executive Intelligence, Scheduled Reports, and Multi-Format Exports.
 */

const SOCReportService = require('../services/soc/SOCReportService');
const SOCMetricsService = require('../services/soc/SOCMetricsService');
const ExecutiveRiskService = require('../services/soc/ExecutiveRiskService');
const SOCReport = require('../models/SOCReport');
const ReportSchedule = require('../models/ReportSchedule');
const logger = require('../utils/logger');

/**
 * POST /api/reports/generate
 * Generates an immutable, versioned SOC report based on real persisted data.
 */
exports.generateReport = async (req, res) => {
  try {
    const { reportType, title, description, parameters, requestedBy } = req.body;
    if (!reportType) {
      return res.status(400).json({ success: false, error: 'reportType is required' });
    }

    const report = await SOCReportService.generateReport(
      {
        reportType,
        title,
        description,
        parameters,
        requestedBy: requestedBy || req.user?.username || req.user?.email || 'analyst',
      },
      req.user
    );

    res.status(201).json({
      success: true,
      message: `Report ${report.reportId} (v${report.version}) generated successfully`,
      data: report,
    });
  } catch (error) {
    logger.error('Report generation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports
 * Lists reports with pagination and tenant isolation.
 */
exports.listReports = async (req, res) => {
  try {
    const {
      reportType,
      status,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const orgId = req.user?.organizationId || null;
    const filter = {};

    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }
    if (reportType) {
      filter.reportType = reportType.toUpperCase();
    }
    if (status) {
      filter.status = status.toUpperCase();
    }
    if (search) {
      filter.$or = [
        { reportId: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { reportType: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [reports, total] = await Promise.all([
      SOCReport.find(filter)
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(take)
        .select('-contentSnapshot -exports.pdfData -exports.csvData')
        .lean(),
      SOCReport.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: take,
          totalPages: Math.ceil(total / take) || 1,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to list reports:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/:reportId
 * Fetches single report details with snapshot.
 */
exports.getReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const orgId = req.user?.organizationId || null;

    const filter = { reportId };
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }

    const report = await SOCReport.findOne(filter).lean();
    if (!report) {
      return res.status(404).json({ success: false, error: `Report ${reportId} not found` });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error(`Failed to get report ${req.params.reportId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/:reportId/export/:format
 * Streams or downloads JSON, CSV, or PDF export of the report.
 */
exports.exportReport = async (req, res) => {
  try {
    const { reportId, format } = req.params;
    const exportFormat = (format || 'json').toLowerCase();
    const orgId = req.user?.organizationId || null;

    const filter = { reportId };
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }

    const report = await SOCReport.findOne(filter).lean();
    if (!report) {
      return res.status(404).json({ success: false, error: `Report ${reportId} not found` });
    }

    if (exportFormat === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${report.reportId}.json"`);
      return res.send(report.exports?.jsonData || JSON.stringify(report.contentSnapshot, null, 2));
    }

    if (exportFormat === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${report.reportId}.csv"`);
      return res.send(report.exports?.csvData || 'No CSV data generated');
    }

    if (exportFormat === 'pdf') {
      const pdfBase64 = report.exports?.pdfData;
      if (!pdfBase64) {
        return res.status(404).json({ success: false, error: 'PDF export not available for this report' });
      }
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.reportId}.pdf"`);
      return res.send(pdfBuffer);
    }

    res.status(400).json({
      success: false,
      error: `Unsupported export format: ${format}. Supported formats: json, csv, pdf`,
    });
  } catch (error) {
    logger.error('Report export failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/metrics/kpis
 * Returns real operational KPIs aggregated across SOC records.
 */
exports.getKPIs = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const kpis = await SOCMetricsService.getOperationalKPIs(orgId);
    res.json({ success: true, data: kpis });
  } catch (error) {
    logger.error('Failed to get operational KPIs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/metrics/mtta-mttr
 * Returns MTTA and MTTR with explicit disclosure of excluded incomplete records.
 */
exports.getMTTAMTT = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const { timeRange = '30d', startDate, endDate } = req.query;

    const data = await SOCMetricsService.calculateMTTAAndMTTR(orgId, {
      timeRange,
      startDate,
      endDate,
    });

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to calculate MTTA/MTTR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/metrics/sla
 * Returns authentic SLA compliance performance metrics.
 */
exports.getSLAPerformance = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const { timeRange = '30d' } = req.query;

    const data = await SOCMetricsService.getSLAPerformance(orgId, { timeRange });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get SLA performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/metrics/trends
 * Returns historical trends with no fabricated baselines.
 */
exports.getTrends = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const { period = '30d', bucket = 'day' } = req.query;

    const data = await SOCMetricsService.getHistoricalTrends(orgId, { period, bucket });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get trends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/metrics/executive-risk
 * Returns evidence-backed executive risk summary.
 */
exports.getExecutiveRisk = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const data = await ExecutiveRiskService.getExecutiveRiskSummary(orgId);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to get executive risk summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/reports/schedules
 * Lists scheduled reports.
 */
exports.listSchedules = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const filter = {};
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }

    const schedules = await ReportSchedule.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: schedules });
  } catch (error) {
    logger.error('Failed to list report schedules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/reports/schedules
 * Creates a scheduled report task.
 */
exports.createSchedule = async (req, res) => {
  try {
    const { name, reportType, frequency, cronExpression, parameters, deliveryConfig, recipients } = req.body;
    if (!name || !reportType || !frequency) {
      return res.status(400).json({
        success: false,
        error: 'name, reportType, and frequency are required',
      });
    }

    const scheduleId = `SCHED-${Date.now().toString(36).toUpperCase()}`;
    const schedule = await ReportSchedule.create({
      scheduleId,
      name,
      reportType,
      frequency,
      cronExpression,
      parameters: parameters || {},
      deliveryConfig: deliveryConfig || {},
      recipients: recipients || [],
      organizationId: req.user?.organizationId || null,
      createdBy: req.user?.username || req.user?.email || 'admin',
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default next day
    });

    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    logger.error('Failed to create report schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/reports/schedules/:scheduleId
 * Updates an existing scheduled report.
 */
exports.updateSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const orgId = req.user?.organizationId || null;
    const filter = { scheduleId };
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }

    const updated = await ReportSchedule.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: `Schedule ${scheduleId} not found` });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error(`Failed to update schedule ${req.params.scheduleId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/reports/schedules/:scheduleId
 * Deletes a scheduled report.
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const orgId = req.user?.organizationId || null;
    const filter = { scheduleId };
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }

    const deleted = await ReportSchedule.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ success: false, error: `Schedule ${scheduleId} not found` });
    }

    res.json({ success: true, message: `Schedule ${scheduleId} deleted` });
  } catch (error) {
    logger.error(`Failed to delete schedule ${req.params.scheduleId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/reports/schedules/:scheduleId/run-now
 * Manually executes a scheduled report.
 */
exports.runScheduleNow = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const orgId = req.user?.organizationId || null;
    const filter = { scheduleId };
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }

    const schedule = await ReportSchedule.findOne(filter);
    if (!schedule) {
      return res.status(404).json({ success: false, error: `Schedule ${scheduleId} not found` });
    }

    const executionResult = await SOCReportService.executeSchedule(scheduleId);
    res.json({ success: true, data: executionResult });
  } catch (error) {
    logger.error(`Failed to execute schedule ${req.params.scheduleId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};
