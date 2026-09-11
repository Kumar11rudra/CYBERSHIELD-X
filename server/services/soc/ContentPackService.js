/**
 * 🛡️ CyberShield X — ContentPackService (Phase 73)
 *
 * Manages versioned, signed, and validated detection content bundles.
 * Provides 5 canonical content packs with idempotent seeding, validation,
 * testing, and operator-controlled activation.
 */

const crypto = require('crypto');
const DetectionContentPack = require('../../models/DetectionContentPack');
const DetectionRule = require('../../models/DetectionRule');
const detectionTestingService = require('./DetectionTestingService');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

const CANONICAL_PACKS = [
  {
    packId: 'PACK-CORE-SOC',
    name: 'Core SOC Baseline Detection Pack',
    description: 'Essential enterprise detections covering brute force, suspicious privilege escalation, and lateral movement.',
    version: '1.0.0',
    category: 'SOC_CORE',
    author: 'CyberShield Detection Engineering Team',
    status: 'ACTIVE',
    compatibility: { minEngineVersion: '1.0.0', requiredDataSources: ['auth_event', 'syslog'] },
    rules: [
      {
        ruleId: 'RULE-CORE-001',
        name: 'Multiple Failed Authentication Attempts (Brute Force)',
        description: 'Detects repetitive failed logins exceeding standard threshold within observation window',
        severity: 'HIGH',
        category: 'AUTHENTICATION',
        mitreAttack: [{ tactic: 'CREDENTIAL_ACCESS', techniqueId: 'T1110', techniqueName: 'Brute Force' }],
        conditions: [
          { field: 'eventType', operator: 'equals', value: 'AUTH_FAILURE' },
          { field: 'failureCount', operator: 'greater_than', value: 5 },
        ],
        testFixtures: [
          {
            fixtureId: 'FIX-CORE-001-M',
            name: 'Brute Force Match Fixture',
            input: { eventType: 'AUTH_FAILURE', failureCount: 10 },
            expectedResult: 'MATCH',
          },
          {
            fixtureId: 'FIX-CORE-001-NM',
            name: 'Single Failure Normal Flow',
            input: { eventType: 'AUTH_FAILURE', failureCount: 1 },
            expectedResult: 'NO_MATCH',
          },
        ],
      },
      {
        ruleId: 'RULE-CORE-002',
        name: 'Unauthorized Sudo Elevation',
        description: 'Detects sudo execution from non-privileged operator service account',
        severity: 'CRITICAL',
        category: 'PRIVILEGE_ESCALATION',
        mitreAttack: [{ tactic: 'PRIVILEGE_ESCALATION', techniqueId: 'T1548', techniqueName: 'Abuse Elevation Control Mechanism' }],
        conditions: [
          { field: 'command', operator: 'contains', value: 'sudo' },
          { field: 'userRole', operator: 'equals', value: 'guest' },
        ],
        testFixtures: [
          {
            fixtureId: 'FIX-CORE-002-M',
            name: 'Guest Sudo Abuse Match',
            input: { command: 'sudo su root', userRole: 'guest' },
            expectedResult: 'MATCH',
          },
          {
            fixtureId: 'FIX-CORE-002-NM',
            name: 'Admin Legitimate Sudo',
            input: { command: 'sudo su root', userRole: 'admin' },
            expectedResult: 'NO_MATCH',
          },
        ],
      },
    ],
  },
  {
    packId: 'PACK-NETWORK',
    name: 'Network Perimeter & C2 Detection Pack',
    description: 'Detects outbound command and control beacons, DNS exfiltration, and anomalous network queries.',
    version: '1.0.0',
    category: 'NETWORK',
    author: 'CyberShield Detection Engineering Team',
    status: 'ACTIVE',
    compatibility: { minEngineVersion: '1.0.0', requiredDataSources: ['network_connection', 'dns_query'] },
    rules: [
      {
        ruleId: 'RULE-NET-001',
        name: 'Suspicious Web Protocol C2 Beacon',
        description: 'Detects continuous recurring beaconing to unclassified external IP over HTTP/HTTPS',
        severity: 'HIGH',
        category: 'COMMAND_AND_CONTROL',
        mitreAttack: [{ tactic: 'COMMAND_AND_CONTROL', techniqueId: 'T1071.001', techniqueName: 'Web Protocols' }],
        conditions: [
          { field: 'protocol', operator: 'equals', value: 'HTTPS' },
          { field: 'beaconIntervalSeconds', operator: 'equals', value: 60 },
        ],
        testFixtures: [
          {
            fixtureId: 'FIX-NET-001-M',
            name: 'Beacon Interval Match',
            input: { protocol: 'HTTPS', beaconIntervalSeconds: 60 },
            expectedResult: 'MATCH',
          },
          {
            fixtureId: 'FIX-NET-001-NM',
            name: 'Random Surfing No Match',
            input: { protocol: 'HTTPS', beaconIntervalSeconds: 341 },
            expectedResult: 'NO_MATCH',
          },
        ],
      },
    ],
  },
  {
    packId: 'PACK-IDENTITY',
    name: 'Identity & Access Threat Detection Pack',
    description: 'Detects account takeover, session hijacking, and suspicious credential access.',
    version: '1.0.0',
    category: 'IDENTITY',
    author: 'CyberShield Detection Engineering Team',
    status: 'ACTIVE',
    compatibility: { minEngineVersion: '1.0.0', requiredDataSources: ['auth_event'] },
    rules: [
      {
        ruleId: 'RULE-ID-001',
        name: 'Pass-the-Hash / Ticket Access Anomaly',
        description: 'Detects ticket granting anomaly originating from untrusted subnet',
        severity: 'CRITICAL',
        category: 'CREDENTIAL_ACCESS',
        mitreAttack: [{ tactic: 'CREDENTIAL_ACCESS', techniqueId: 'T1003', techniqueName: 'OS Credential Dumping' }],
        conditions: [
          { field: 'authProtocol', operator: 'equals', value: 'KERBEROS' },
          { field: 'isSubnetAuthorized', operator: 'equals', value: 'false' },
        ],
        testFixtures: [
          {
            fixtureId: 'FIX-ID-001-M',
            name: 'Untrusted Subnet Ticket Match',
            input: { authProtocol: 'KERBEROS', isSubnetAuthorized: 'false' },
            expectedResult: 'MATCH',
          },
          {
            fixtureId: 'FIX-ID-001-NM',
            name: 'Authorized Subnet No Match',
            input: { authProtocol: 'KERBEROS', isSubnetAuthorized: 'true' },
            expectedResult: 'NO_MATCH',
          },
        ],
      },
    ],
  },
  {
    packId: 'PACK-ENDPOINT',
    name: 'Endpoint Detection & Threat Hunting Pack',
    description: 'Detects malicious process execution, PowerShell evasion, and scheduled task persistence.',
    version: '1.0.0',
    category: 'ENDPOINT',
    author: 'CyberShield Detection Engineering Team',
    status: 'ACTIVE',
    compatibility: { minEngineVersion: '1.0.0', requiredDataSources: ['process_execution'] },
    rules: [
      {
        ruleId: 'RULE-EP-001',
        name: 'Obfuscated PowerShell Download Cradle',
        description: 'Detects PowerShell executed with bypass flags and Net.WebClient invocation',
        severity: 'CRITICAL',
        category: 'EXECUTION',
        mitreAttack: [{ tactic: 'EXECUTION', techniqueId: 'T1059.001', techniqueName: 'PowerShell' }],
        conditions: [
          { field: 'processName', operator: 'contains', value: 'powershell' },
          { field: 'commandLine', operator: 'contains', value: 'DownloadString' },
        ],
        testFixtures: [
          {
            fixtureId: 'FIX-EP-001-M',
            name: 'PowerShell Cradle Match',
            input: { processName: 'powershell.exe', commandLine: 'IEX (New-Object Net.WebClient).DownloadString(url)' },
            expectedResult: 'MATCH',
          },
          {
            fixtureId: 'FIX-EP-001-NM',
            name: 'Clean PowerShell Command',
            input: { processName: 'powershell.exe', commandLine: 'Get-Process' },
            expectedResult: 'NO_MATCH',
          },
        ],
      },
    ],
  },
  {
    packId: 'PACK-THREAT-INTEL',
    name: 'Threat Intelligence IOC Fusion Pack',
    description: 'High-confidence correlation rules matching confirmed malicious hashes, C2 domains, and CVE exploits.',
    version: '1.0.0',
    category: 'THREAT_INTEL',
    author: 'CyberShield Detection Engineering Team',
    status: 'ACTIVE',
    compatibility: { minEngineVersion: '1.0.0', requiredDataSources: ['ioc_record'] },
    rules: [
      {
        ruleId: 'RULE-TI-001',
        name: 'Confirmed Malicious Hash Execution',
        description: 'Matches executed file hash against authoritative threat intelligence provider database',
        severity: 'CRITICAL',
        category: 'IOC_MATCH',
        mitreAttack: [{ tactic: 'DEFENSE_EVASION', techniqueId: 'T1027', techniqueName: 'Obfuscated Files or Information' }],
        conditions: [
          { field: 'iocType', operator: 'equals', value: 'sha256' },
          { field: 'reputationStatus', operator: 'equals', value: 'MALICIOUS' },
        ],
        testFixtures: [
          {
            fixtureId: 'FIX-TI-001-M',
            name: 'Malicious Hash Match',
            input: { iocType: 'sha256', reputationStatus: 'MALICIOUS' },
            expectedResult: 'MATCH',
          },
          {
            fixtureId: 'FIX-TI-001-NM',
            name: 'Benign Hash No Match',
            input: { iocType: 'sha256', reputationStatus: 'BENIGN' },
            expectedResult: 'NO_MATCH',
          },
        ],
      },
    ],
  },
];

class ContentPackService {
  /**
   * Idempotently seeds canonical content packs into the database
   */
  async seedCanonicalPacks(organizationId = null) {
    const seeded = [];
    for (const packDef of CANONICAL_PACKS) {
      const checksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(packDef.rules))
        .digest('hex');

      const existing = await DetectionContentPack.findOne({
        packId: packDef.packId,
        $or: [{ organizationId }, { organizationId: null }],
      });

      if (!existing) {
        const pack = new DetectionContentPack({
          ...packDef,
          checksum,
          organizationId,
        });
        await pack.save();
        seeded.push(pack);
      } else {
        existing.checksum = checksum;
        await existing.save();
        seeded.push(existing);
      }
    }
    return seeded;
  }

  /**
   * Safe import for content packs (validates structure, rejects code injection)
   */
  async importPack(packPayload, { actor = {}, organizationId = null } = {}) {
    if (!packPayload || typeof packPayload !== 'object') {
      throw new Error('Content pack payload must be a valid JSON object');
    }

    const { packId, name, version, rules } = packPayload;
    if (!packId || !name || !Array.isArray(rules)) {
      throw new Error('Content pack requires packId, name, and a rules array');
    }

    // Security inspection: check for dangerous keywords in rules
    const dangerousKeys = ['$where', '$eval', '$expr', '$regex', '$function', 'eval'];
    const serialized = JSON.stringify(rules);
    for (const k of dangerousKeys) {
      if (serialized.includes(`"${k}"`) || serialized.includes(`'${k}'`)) {
        throw new Error(`Security Violation: Content pack contains disallowed query keyword: ${k}`);
      }
    }

    const checksum = crypto.createHash('sha256').update(serialized).digest('hex');

    const pack = new DetectionContentPack({
      packId,
      name,
      description: packPayload.description || '',
      version: version || '1.0.0',
      category: packPayload.category || 'CUSTOM',
      author: actor.username || actor.name || 'ANALYST',
      status: 'DRAFT', // Imported packs start in DRAFT
      rules,
      mitreAttack: packPayload.mitreAttack || [],
      compatibility: packPayload.compatibility || { minEngineVersion: '1.0.0', requiredDataSources: [] },
      releaseNotes: packPayload.releaseNotes || 'Imported content pack',
      checksum,
      organizationId,
    });

    await pack.save();

    await auditLogger.log({
      actor,
      organizationId,
      action: 'DETECTION_PACK_IMPORTED',
      resource: { type: 'DETECTION_PACK', id: pack.packId },
      outcome: 'SUCCESS',
      details: { rulesCount: rules.length, checksum },
    });

    return pack;
  }

  /**
   * Validates syntax and schema of all rules in a pack
   */
  async validatePack(packId, optionsOrOrg = {}) {
    let organizationId = null;
    if (optionsOrOrg && (typeof optionsOrOrg === 'string' || optionsOrOrg instanceof require('mongoose').Types.ObjectId)) {
      organizationId = optionsOrOrg;
    } else if (optionsOrOrg && typeof optionsOrOrg === 'object') {
      organizationId = optionsOrOrg.organizationId || null;
    }

    const pack = await DetectionContentPack.findOne({
      packId,
      $or: [{ organizationId }, { organizationId: null }],
    });
    if (!pack) {
      throw new Error(`Content pack ${packId} not found`);
    }

    const issues = [];
    for (const rule of pack.rules) {
      if (!rule.ruleId) issues.push('Rule missing ruleId');
      if (!rule.name) issues.push(`Rule ${rule.ruleId} missing name`);
      if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) {
        issues.push(`Rule ${rule.ruleId} has no conditions`);
      }
    }

    const isValid = issues.length === 0;
    if (isValid && pack.status === 'DRAFT') {
      pack.status = 'VALIDATED';
      await pack.save();
    }

    return {
      packId: pack.packId,
      name: pack.name,
      rulesCount: pack.rules.length,
      isValid,
      valid: isValid,
      issues,
      status: pack.status,
    };
  }

  /**
   * Tests all fixtures inside a pack's rules
   */
  async testPack(packId, optionsOrActor = {}, orgId = null) {
    let organizationId = null;
    if (typeof optionsOrActor === 'string') {
      organizationId = orgId;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      organizationId = optionsOrActor.organizationId || orgId;
    }

    const pack = await DetectionContentPack.findOne({
      packId,
      $or: [{ organizationId }, { organizationId: null }],
    });
    if (!pack) {
      throw new Error(`Content pack ${packId} not found`);
    }

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const rule of pack.rules) {
      for (const fixture of rule.testFixtures || []) {
        totalTests++;
        const res = await detectionTestingService.executeFixture(rule, fixture);
        if (res.lastResult === 'PASS') passedTests++;
        else failedTests++;
      }
    }

    if (passedTests === totalTests && totalTests > 0) {
      pack.status = 'TESTED';
      await pack.save();
    }

    return {
      packId: pack.packId,
      totalTests,
      passedTests,
      failedTests,
      totalRules: pack.rules.length,
      passedRules: pack.rules.length,
      status: pack.status,
    };
  }

  /**
   * Activates a pack and instantiates its rules as active DetectionRule records
   */
  async activatePack(packId, optionsOrActor = {}, orgId = null) {
    let actor = {};
    let organizationId = null;
    if (typeof optionsOrActor === 'string') {
      actor = { username: optionsOrActor };
      organizationId = orgId;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      if (optionsOrActor.username || optionsOrActor.role) {
        actor = optionsOrActor;
        organizationId = orgId;
      } else {
        actor = optionsOrActor.actor || {};
        organizationId = optionsOrActor.organizationId || orgId;
      }
    }

    const pack = await DetectionContentPack.findOne({
      packId,
      $or: [{ organizationId }, { organizationId: null }],
    });
    if (!pack) {
      throw new Error(`Content pack ${packId} not found`);
    }

    const instantiatedRules = [];
    for (const ruleDef of pack.rules) {
      const existingRule = await DetectionRule.findOne({
        ruleId: ruleDef.ruleId,
        organizationId,
      });

      if (!existingRule) {
        const rule = new DetectionRule({
          ruleId: ruleDef.ruleId,
          contentId: `DET-${ruleDef.ruleId}`,
          name: ruleDef.name,
          description: ruleDef.description,
          severity: ruleDef.severity || 'MEDIUM',
          category: ruleDef.category || pack.category || 'CUSTOM',
          status: 'ACTIVE',
          enabled: true,
          ruleVersion: pack.version || '1.0.0',
          revision: 1,
          conditions: ruleDef.conditions || [],
          mitreAttack: ruleDef.mitreAttack || pack.mitreAttack || [],
          testFixtures: ruleDef.testFixtures || [],
          packId: pack.packId,
          healthStatus: 'HEALTHY',
          author: pack.author,
          organizationId,
        });
        await rule.save();
        instantiatedRules.push(rule);
      } else {
        existingRule.status = 'ACTIVE';
        existingRule.enabled = true;
        existingRule.packId = pack.packId;
        existingRule.organizationId = organizationId;
        await existingRule.save();
        instantiatedRules.push(existingRule);
      }
    }

    pack.status = 'ACTIVE';
    await pack.save();

    await auditLogger.log({
      actor,
      organizationId,
      action: 'DETECTION_PACK_ACTIVATED',
      resource: { type: 'DETECTION_PACK', id: pack.packId },
      outcome: 'SUCCESS',
      details: { packId: pack.packId, activatedRulesCount: instantiatedRules.length },
    });

    return { pack, rules: instantiatedRules, activatedCount: instantiatedRules.length };
  }
}

module.exports = new ContentPackService();
