/**
 * 🛡️ CyberShield X — ThreatHuntTemplate Model (Phase 71)
 *
 * Implements reusable canonical hunting patterns with validated query ASTs,
 * hypotheses, MITRE ATT&CK references, and data source selections.
 */

const mongoose = require('mongoose');

const threatHuntTemplateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'IOC_SWEEP',
        'BEHAVIORAL',
        'DNS_ANOMALY',
        'OUTBOUND_C2',
        'CREDENTIAL_ACCESS',
        'EXECUTION_ANOMALY',
        'CUSTOM',
      ],
      required: true,
      index: true,
    },
    hypothesis: {
      type: String,
      required: true,
      trim: true,
    },
    structuredQuery: {
      entity: {
        type: String,
        enum: ['asset', 'hostname', 'ip', 'domain', 'url', 'ioc', 'executionId', 'finding', 'alert', 'incident', 'detection'],
        required: true,
      },
      conditions: [
        {
          field: { type: String, required: true },
          operator: {
            type: String,
            enum: ['equals', 'not_equals', 'contains', 'regex', 'greater_than', 'less_than', 'in'],
            required: true,
          },
          value: { type: mongoose.Schema.Types.Mixed, required: true },
        },
      ],
      booleanLogic: {
        type: String,
        enum: ['AND', 'OR'],
        default: 'AND',
      },
    },
    dataSources: {
      type: [String],
      enum: ['FINDINGS', 'ALERTS', 'INCIDENTS', 'ASSETS', 'IOCS', 'TERMINAL_JOBS'],
      default: ['FINDINGS', 'ALERTS'],
    },
    defaultTimeWindow: {
      type: String,
      enum: ['15m', '1h', '24h', '7d', '30d'],
      default: '24h',
    },
    mitreAttack: [
      {
        techniqueId: { type: String, required: true },
        tactic: { type: String, required: true },
        techniqueName: { type: String, required: true },
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    isSystemTemplate: {
      type: Boolean,
      default: true,
    },
    organizationId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

threatHuntTemplateSchema.index({ organizationId: 1, category: 1 });

/**
 * Canonical System Templates
 */
const CANONICAL_TEMPLATES = [
  {
    templateId: 'TMPL-IOC-001',
    name: 'IOC Sweep — High-Confidence Malicious Indicators',
    description: 'Sweeps findings and security events for confirmed external IOCs and elevated threat intelligence markers.',
    category: 'IOC_SWEEP',
    hypothesis: 'Active environment entities or observed traffic correlate directly with high-confidence malicious IOCs.',
    structuredQuery: {
      entity: 'finding',
      conditions: [
        { field: 'severity', operator: 'in', value: 'HIGH,CRITICAL' },
        { field: 'description', operator: 'contains', value: 'malware' },
      ],
      booleanLogic: 'AND',
    },
    dataSources: ['FINDINGS', 'ALERTS', 'IOCS'],
    defaultTimeWindow: '24h',
    mitreAttack: [{ techniqueId: 'T1071', tactic: 'Command and Control', techniqueName: 'Application Layer Protocol' }],
    isSystemTemplate: true,
  },
  {
    templateId: 'TMPL-AUTH-002',
    name: 'Suspicious Authentication & Lateral Movement Spikes',
    description: 'Hunts for anomalous authentication bursts, privilege transitions, and unauthorized administrative access attempts.',
    category: 'CREDENTIAL_ACCESS',
    hypothesis: 'Adversaries are attempting credential stuffing or lateral movement via repeated authentication failures.',
    structuredQuery: {
      entity: 'alert',
      conditions: [
        { field: 'category', operator: 'contains', value: 'AUTH' },
        { field: 'severity', operator: 'in', value: 'HIGH,CRITICAL' },
      ],
      booleanLogic: 'AND',
    },
    dataSources: ['ALERTS', 'FINDINGS'],
    defaultTimeWindow: '24h',
    mitreAttack: [{ techniqueId: 'T1110', tactic: 'Credential Access', techniqueName: 'Brute Force' }],
    isSystemTemplate: true,
  },
  {
    templateId: 'TMPL-DNS-003',
    name: 'Unusual DNS Resolution & DGA Behavior',
    description: 'Detects high-frequency DNS lookups against dynamic or algorithmically generated domains (DGA).',
    category: 'DNS_ANOMALY',
    hypothesis: 'Compromised endpoints are querying algorithmic or unindexed domains for C2 beaconing.',
    structuredQuery: {
      entity: 'terminal_job',
      conditions: [
        { field: 'tool', operator: 'in', value: 'dns,whois' },
        { field: 'status', operator: 'equals', value: 'COMPLETED' },
      ],
      booleanLogic: 'AND',
    },
    dataSources: ['TERMINAL_JOBS', 'FINDINGS'],
    defaultTimeWindow: '24h',
    mitreAttack: [{ techniqueId: 'T1568', tactic: 'Command and Control', techniqueName: 'Dynamic Resolution' }],
    isSystemTemplate: true,
  },
  {
    templateId: 'TMPL-NET-004',
    name: 'Suspicious Outbound C2 Network Connections',
    description: 'Identifies unexpected outbound network connections to non-standard ports or foreign ASNs.',
    category: 'OUTBOUND_C2',
    hypothesis: 'Threat actors have established interactive shells or persistent beacon channels to external IP ranges.',
    structuredQuery: {
      entity: 'alert',
      conditions: [
        { field: 'description', operator: 'contains', value: 'outbound' },
        { field: 'severity', operator: 'in', value: 'HIGH,CRITICAL' },
      ],
      booleanLogic: 'AND',
    },
    dataSources: ['ALERTS', 'FINDINGS', 'INCIDENTS'],
    defaultTimeWindow: '7d',
    mitreAttack: [{ techniqueId: 'T1095', tactic: 'Command and Control', techniqueName: 'Non-Application Layer Protocol' }],
    isSystemTemplate: true,
  },
  {
    templateId: 'TMPL-EXEC-005',
    name: 'Repeated Failed Native Tool & Script Executions',
    description: 'Detects repeated operational failures, command aborts, or exit code faults that indicate evasion or tampering.',
    category: 'EXECUTION_ANOMALY',
    hypothesis: 'Attackers are probing defensive boundaries, triggering permission denied errors or timeout kills.',
    structuredQuery: {
      entity: 'terminal_job',
      conditions: [
        { field: 'status', operator: 'in', value: 'FAILED,TIMEOUT' },
      ],
      booleanLogic: 'AND',
    },
    dataSources: ['TERMINAL_JOBS'],
    defaultTimeWindow: '24h',
    mitreAttack: [{ techniqueId: 'T1059', tactic: 'Execution', techniqueName: 'Command and Scripting Interpreter' }],
    isSystemTemplate: true,
  },
  {
    templateId: 'TMPL-VULN-006',
    name: 'Exposed Critical Vulnerabilities on Sensitive Assets',
    description: 'Sweeps asset inventories for critical CVSS 9.0+ vulnerabilities with known public exploits.',
    category: 'BEHAVIORAL',
    hypothesis: 'Externally accessible perimeter assets possess unpatched CVEs currently targeted in the wild.',
    structuredQuery: {
      entity: 'finding',
      conditions: [
        { field: 'severity', operator: 'equals', value: 'CRITICAL' },
      ],
      booleanLogic: 'AND',
    },
    dataSources: ['FINDINGS', 'ASSETS'],
    defaultTimeWindow: '30d',
    mitreAttack: [{ techniqueId: 'T1190', tactic: 'Initial Access', techniqueName: 'Exploit Public-Facing Application' }],
    isSystemTemplate: true,
  },
  {
    templateId: 'TMPL-HASH-007',
    name: 'Malicious Binary Hash Match across Scan Records',
    description: 'Cross-checks recorded SHA-256 and MD5 hashes from scan artifacts against known malware registries.',
    category: 'IOC_SWEEP',
    hypothesis: 'Static binary artifacts dropped on monitored systems match CIRCL or VirusTotal malware fingerprints.',
    structuredQuery: {
      entity: 'ioc',
      conditions: [
        { field: 'type', operator: 'in', value: 'hash_sha256,hash_md5' },
        { field: 'reputation', operator: 'in', value: 'MALICIOUS,SUSPICIOUS' },
      ],
      booleanLogic: 'AND',
    },
    dataSources: ['IOCS', 'FINDINGS'],
    defaultTimeWindow: '30d',
    mitreAttack: [{ techniqueId: 'T1204', tactic: 'Execution', techniqueName: 'User Execution: Malicious File' }],
    isSystemTemplate: true,
  },
];

threatHuntTemplateSchema.statics.getCanonicalTemplates = function () {
  return CANONICAL_TEMPLATES;
};

threatHuntTemplateSchema.statics.seedCanonicalTemplates = async function () {
  try {
    for (const tmpl of CANONICAL_TEMPLATES) {
      await this.findOneAndUpdate(
        { templateId: tmpl.templateId },
        { $set: tmpl },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    // Non-blocking
  }
};

module.exports = mongoose.model('ThreatHuntTemplate', threatHuntTemplateSchema);
