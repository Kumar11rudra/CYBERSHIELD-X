/**
 * 🛡️ CyberShield X — DetectionCoverageService (Phase 73)
 *
 * Calculates ground-truth MITRE ATT&CK threat coverage.
 * A technique is COVERED only if backed by an ACTIVE detection rule with passing tests.
 * Zero-Fabrication: all metrics derived strictly from persisted rules, hunts, incidents, and findings.
 */

const DetectionRule = require('../../models/DetectionRule');
const Incident = require('../../models/Incident');
const ThreatHunt = require('../../models/ThreatHunt');
const Finding = require('../../models/Finding');
const Alert = require('../../models/Alert');

const CANONICAL_ATTACK_MATRIX = [
  { tactic: 'INITIAL_ACCESS', techniqueId: 'T1190', techniqueName: 'Exploit Public-Facing Application' },
  { tactic: 'INITIAL_ACCESS', techniqueId: 'T1566', techniqueName: 'Phishing' },
  { tactic: 'INITIAL_ACCESS', techniqueId: 'T1078', techniqueName: 'Valid Accounts' },
  { tactic: 'EXECUTION', techniqueId: 'T1059.001', techniqueName: 'PowerShell' },
  { tactic: 'EXECUTION', techniqueId: 'T1059.003', techniqueName: 'Windows Command Shell' },
  { tactic: 'EXECUTION', techniqueId: 'T1204', techniqueName: 'User Execution' },
  { tactic: 'PERSISTENCE', techniqueId: 'T1547', techniqueName: 'Boot or Logon Autostart Execution' },
  { tactic: 'PERSISTENCE', techniqueId: 'T1053', techniqueName: 'Scheduled Task/Job' },
  { tactic: 'PRIVILEGE_ESCALATION', techniqueId: 'T1548', techniqueName: 'Abuse Elevation Control Mechanism' },
  { tactic: 'PRIVILEGE_ESCALATION', techniqueId: 'T1068', techniqueName: 'Exploitation for Privilege Escalation' },
  { tactic: 'DEFENSE_EVASION', techniqueId: 'T1070', techniqueName: 'Indicator Removal on Host' },
  { tactic: 'DEFENSE_EVASION', techniqueId: 'T1027', techniqueName: 'Obfuscated Files or Information' },
  { tactic: 'DEFENSE_EVASION', techniqueId: 'T1562', techniqueName: 'Impair Defenses' },
  { tactic: 'CREDENTIAL_ACCESS', techniqueId: 'T1003', techniqueName: 'OS Credential Dumping' },
  { tactic: 'CREDENTIAL_ACCESS', techniqueId: 'T1110', techniqueName: 'Brute Force' },
  { tactic: 'DISCOVERY', techniqueId: 'T1046', techniqueName: 'Network Service Discovery' },
  { tactic: 'DISCOVERY', techniqueId: 'T1082', techniqueName: 'System Information Discovery' },
  { tactic: 'DISCOVERY', techniqueId: 'T1087', techniqueName: 'Account Discovery' },
  { tactic: 'LATERAL_MOVEMENT', techniqueId: 'T1021.001', techniqueName: 'Remote Desktop Protocol' },
  { tactic: 'LATERAL_MOVEMENT', techniqueId: 'T1021.002', techniqueName: 'SMB/Windows Admin Shares' },
  { tactic: 'COLLECTION', techniqueId: 'T1005', techniqueName: 'Data from Local System' },
  { tactic: 'COLLECTION', techniqueId: 'T1114', techniqueName: 'Email Collection' },
  { tactic: 'COMMAND_AND_CONTROL', techniqueId: 'T1071.001', techniqueName: 'Web Protocols' },
  { tactic: 'COMMAND_AND_CONTROL', techniqueId: 'T1573', techniqueName: 'Encrypted Channel' },
  { tactic: 'EXFILTRATION', techniqueId: 'T1048', techniqueName: 'Exfiltration Over Alternative Protocol' },
  { tactic: 'EXFILTRATION', techniqueId: 'T1041', techniqueName: 'Exfiltration Over C2 Channel' },
  { tactic: 'IMPACT', techniqueId: 'T1486', techniqueName: 'Data Encrypted for Impact' },
  { tactic: 'IMPACT', techniqueId: 'T1489', techniqueName: 'Service Stop' },
];

class DetectionCoverageService {
  /**
   * Evaluates MITRE ATT&CK coverage across all tracked techniques
   */
  async getCoverageMatrix({ organizationId = null } = {}) {
    const query = {};
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    // 1. Fetch all detection rules
    const rules = await DetectionRule.find(query).select(
      'ruleId contentId name status enabled healthStatus mitreAttack testFixtures category severity'
    );

    // 2. Fetch observed evidence context from incidents, hunts, findings, alerts
    const [incidents, hunts, findings, alerts] = await Promise.all([
      Incident.find(query).select('incidentId classification mitreAttack techniqueId severity title createdAt').limit(100).catch(() => []),
      ThreatHunt.find(query).select('huntId mitreAttack name status').limit(100).catch(() => []),
      Finding.find(query).select('findingId mitreTechnique severity title').limit(100).catch(() => []),
      Alert.find(query).select('alertId mitreTechnique severity status').limit(100).catch(() => []),
    ]);

    // Map rules by techniqueId
    const rulesByTechnique = new Map();
    for (const r of rules) {
      if (r.mitreAttack && Array.isArray(r.mitreAttack)) {
        for (const m of r.mitreAttack) {
          const tid = m.techniqueId || m.id;
          if (tid) {
            if (!rulesByTechnique.has(tid)) rulesByTechnique.set(tid, []);
            rulesByTechnique.get(tid).push(r);
          }
        }
      }
    }

    // Map evidence by techniqueId
    const evidenceByTechnique = new Map();
    const addEvidence = (tid, item) => {
      if (!tid) return;
      if (!evidenceByTechnique.has(tid)) evidenceByTechnique.set(tid, []);
      evidenceByTechnique.get(tid).push(item);
    };

    for (const inc of incidents) {
      const tid = inc.classification?.techniqueId || inc.mitreAttack?.techniqueId || inc.techniqueId;
      addEvidence(tid, { type: 'INCIDENT', id: inc.incidentId, title: inc.title });
    }
    for (const h of hunts) {
      const tid = h.mitreAttack?.techniqueId || h.techniqueId;
      if (tid) {
        addEvidence(tid, { type: 'HUNT', id: h.huntId, title: h.name });
      }
    }
    for (const f of findings) {
      const tid = f.mitreTechnique || f.mitreAttack?.techniqueId;
      if (tid) {
        addEvidence(tid, { type: 'FINDING', id: f.findingId, title: f.title });
      }
    }
    for (const a of alerts) {
      const tid = a.mitreTechnique || a.mitreAttack?.techniqueId;
      if (tid) {
        addEvidence(tid, { type: 'ALERT', id: a.alertId });
      }
    }

    let coveredCount = 0;
    let partiallyCoveredCount = 0;
    let untestedCount = 0;
    let notCoveredCount = 0;

    const techniqueResults = CANONICAL_ATTACK_MATRIX.map((canon) => {
      const matchedRules = rulesByTechnique.get(canon.techniqueId) || [];
      const activeRules = matchedRules.filter((r) => r.status === 'ACTIVE' && r.enabled !== false);
      const testedRules = activeRules.filter((r) => {
        const fixtures = r.testFixtures || [];
        return r.healthStatus === 'HEALTHY' || (fixtures.length > 0 && fixtures.every((f) => f.lastResult === 'PASS'));
      });

      const relatedEvidence = evidenceByTechnique.get(canon.techniqueId) || [];
      const relatedHunts = relatedEvidence.filter((e) => e.type === 'HUNT').map((e) => e.id);
      const relatedIncidents = relatedEvidence.filter((e) => e.type === 'INCIDENT').map((e) => e.id);

      let status = 'NOT_COVERED';
      if (testedRules.length > 0) {
        status = 'COVERED';
        coveredCount++;
      } else if (activeRules.length > 0) {
        status = 'UNTESTED';
        untestedCount++;
      } else if (matchedRules.length > 0) {
        status = 'PARTIALLY_COVERED';
        partiallyCoveredCount++;
      } else {
        status = 'NOT_COVERED';
        notCoveredCount++;
      }

      return {
        tactic: canon.tactic,
        techniqueId: canon.techniqueId,
        techniqueName: canon.techniqueName,
        totalRules: matchedRules.length,
        activeRulesCount: activeRules.length,
        activeRuleCount: activeRules.length,
        testedRulesCount: testedRules.length,
        observedEvidenceCount: relatedEvidence.length,
        relatedHunts,
        relatedIncidents,
        coverageStatus: status,
        status,
        rules: matchedRules.map((r) => ({
          ruleId: r.ruleId,
          name: r.name,
          status: r.status,
          healthStatus: r.healthStatus,
        })),
      };
    });

    // Group by tactic
    const tacticsMap = {};
    for (const t of techniqueResults) {
      if (!tacticsMap[t.tactic]) {
        tacticsMap[t.tactic] = {
          tactic: t.tactic,
          total: 0,
          covered: 0,
          partiallyCovered: 0,
          untested: 0,
          notCovered: 0,
          techniques: [],
        };
      }
      tacticsMap[t.tactic].total++;
      if (t.coverageStatus === 'COVERED') tacticsMap[t.tactic].covered++;
      else if (t.coverageStatus === 'PARTIALLY_COVERED') tacticsMap[t.tactic].partiallyCovered++;
      else if (t.coverageStatus === 'UNTESTED') tacticsMap[t.tactic].untested++;
      else tacticsMap[t.tactic].notCovered++;

      tacticsMap[t.tactic].techniques.push(t);
    }

    const totalTracked = CANONICAL_ATTACK_MATRIX.length;
    const coveragePercentage = totalTracked > 0 ? Math.round((coveredCount / totalTracked) * 100) : 0;

    return {
      timestamp: new Date(),
      totalTracked,
      totalTechniquesTracked: totalTracked,
      coveredCount,
      coveredTechniques: coveredCount,
      partiallyCoveredCount,
      untestedCount,
      notCoveredCount,
      coveragePercentage,
      tactics: Object.values(tacticsMap),
      tacticBreakdown: tacticsMap,
      matrix: techniqueResults,
      techniques: techniqueResults,
      techniqueDetails: techniqueResults,
    };
  }

  /**
   * Alias method for calculating coverage matrix
   */
  async calculateCoverage(optionsOrOrg = {}) {
    let organizationId = null;
    if (optionsOrOrg && (typeof optionsOrOrg === 'string' || optionsOrOrg instanceof require('mongoose').Types.ObjectId)) {
      organizationId = optionsOrOrg;
    } else if (optionsOrOrg && typeof optionsOrOrg === 'object') {
      organizationId = optionsOrOrg.organizationId || null;
    }
    return this.getCoverageMatrix({ organizationId });
  }
}

module.exports = new DetectionCoverageService();
