/**
 * 🛡️ CyberShield X — ReportSchedule Model (Phase 74)
 *
 * Persists scheduled operational reporting tasks.
 * Strictly separates report generation status from report delivery status.
 */

const mongoose = require('mongoose');

const reportScheduleSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      required: true,
      enum: [
        'EXECUTIVE_SUMMARY',
        'SOC_OPERATIONS',
        'INCIDENT_REPORT',
        'CASE_DOSSIER',
        'THREAT_HUNT_REPORT',
        'DETECTION_COVERAGE',
        'THREAT_INTELLIGENCE',
        'COMPLIANCE_EVIDENCE',
        'AUDIT_ACTIVITY',
      ],
      index: true,
    },
    frequency: {
      type: String,
      required: true,
      enum: ['MANUAL', 'DAILY', 'WEEKLY', 'MONTHLY', 'ON_DEMAND'],
      default: 'WEEKLY',
    },
    cronExpression: {
      type: String,
      default: '0 0 * * 1', // default Monday midnight
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recipients: [
      {
        type: String,
        trim: true,
      },
    ],
    deliveryChannels: [
      {
        channelType: { type: String, enum: ['EMAIL', 'WEBHOOK', 'IN_APP', 'STORAGE'], default: 'IN_APP' },
        destination: { type: String, default: '' },
      },
    ],
    deliveryConfig: {
      channel: { type: String, default: 'IN_APP' },
      destination: { type: String, default: '' },
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    lastDeliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    nextRunAt: {
      type: Date,
      default: null,
    },
    lastStatus: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    lastRunStatus: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    history: [
      {
        runAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['SUCCESS', 'FAILED'] },
        runStatus: { type: String, enum: ['SUCCESS', 'FAILED'] },
        reportId: { type: String },
        deliveryStatus: { type: String, enum: ['PENDING', 'SENT', 'FAILED', 'CANCELLED'] },
        errorMessage: { type: String },
      },
    ],
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reportScheduleSchema.index({ organizationId: 1, scheduleId: 1 });
reportScheduleSchema.index({ organizationId: 1, enabled: 1, nextRunAt: 1 });

module.exports = mongoose.models.ReportSchedule || mongoose.model('ReportSchedule', reportScheduleSchema);
