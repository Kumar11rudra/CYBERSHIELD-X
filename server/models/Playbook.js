const mongoose = require('mongoose');

// Valid trigger events for a playbook
const PLAYBOOK_EVENTS = [
  'vulnerability_detected',   // any new vulnerability registered
  'sla_breached',             // SLA deadline exceeded
  'critical_ioc',             // critical IOC correlation hit
  'ssl_expired',              // SSL certificate expired alert
  'scan_completed',           // any scan completes
  'manual',                   // manual trigger only
];

// Valid action types
const PLAYBOOK_ACTION_TYPES = [
  'create_jira',
  'create_github_issue',
  'send_slack',
  'send_teams',
  'send_email',
  'ai_remediation',
  'assign_vulnerability',
  'create_audit_entry',
  'create_notification',
  'generic_webhook',
];

const conditionSchema = new mongoose.Schema({
  field: { type: String, required: true },       // e.g. 'severity', 'slaStatus', 'priority'
  operator: {
    type: String,
    enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
    default: 'equals',
  },
  value: { type: String, required: true },        // e.g. 'Critical', 'Breached'
}, { _id: false });

const actionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: PLAYBOOK_ACTION_TYPES,
    required: true,
  },
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IntegrationConfig',
    required: false,                              // not required for 'send_email', 'ai_remediation'
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {},                                  // e.g. { priority: 'High', labels: ['security'] }
  },
  order: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const playbookSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Playbook name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    trigger: {
      event: {
        type: String,
        enum: PLAYBOOK_EVENTS,
        required: true,
      },
      conditions: {
        type: [conditionSchema],
        default: [],
      },
    },
    actions: {
      type: [actionSchema],
      default: [],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Playbook must have at least one action',
      },
    },
    runCount: {
      type: Number,
      default: 0,
    },
    lastRunAt: Date,
    lastRunStatus: {
      type: String,
      enum: ['success', 'partial', 'failed', 'never'],
      default: 'never',
    },
    version: {
      type: Number,
      default: 1,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

playbookSchema.index({ organizationId: 1, enabled: 1 });
playbookSchema.index({ 'trigger.event': 1, organizationId: 1, enabled: 1 });

module.exports = mongoose.model('Playbook', playbookSchema);
module.exports.PLAYBOOK_EVENTS = PLAYBOOK_EVENTS;
module.exports.PLAYBOOK_ACTION_TYPES = PLAYBOOK_ACTION_TYPES;
