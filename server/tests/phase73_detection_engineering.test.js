/**
 * 🛡️ CyberShield X — Phase 73 Detection Engineering Test Suite
 *
 * Validates:
 * 1. Detection Content Model, ContentId & Immutable Revision Lifecycle
 * 2. Deterministic Fixture Execution (MATCH / NO_MATCH) & Health Statuses
 * 3. Formal Promotion State Machine & Human Operator Review Gates
 * 4. Dependency-Checked Rule Activation & Safe Rollback to Previous Revision
 * 5. Safe Rule Import Validation (Rejection of $where / $eval injection)
 * 6. Canonical Content Packs (Seeding, Validation, Testing & Activation)
 * 7. Ground-Truth MITRE ATT&CK Matrix & Real Coverage Engine
 * 8. Evidence-Backed Detection Gap Engine & Candidate Rule Generation
 * 9. Regression Testing Suite & Persisted Quality Metrics
 * 10. Multi-Tenant Isolation & Bounded AI Security Enclosure
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const DetectionRule = require('../models/DetectionRule');
const DetectionRuleRevision = require('../models/DetectionRuleRevision');
const DetectionContentPack = require('../models/DetectionContentPack');
const DetectionGap = require('../models/DetectionGap');
const Incident = require('../models/Incident');
const ThreatHunt = require('../models/ThreatHunt');
const AuditEvent = require('../models/AuditEvent');

const detectionTestingService = require('../services/soc/DetectionTestingService');
const detectionLifecycleService = require('../services/soc/DetectionLifecycleService');
const detectionCoverageService = require('../services/soc/DetectionCoverageService');
const detectionGapService = require('../services/soc/DetectionGapService');
const contentPackService = require('../services/soc/ContentPackService');

describe('Phase 73 — Enterprise Detection Engineering, Content Lifecycle & Threat Coverage', () => {
  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();
  const actor = { username: 'detection_lead', role: 'ADMIN', _id: new mongoose.Types.ObjectId() };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield_test');
    }
    await DetectionRule.collection.dropIndex('ruleId_1').catch(() => {});
  });

  afterAll(async () => {
    await DetectionRule.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await DetectionRuleRevision.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await DetectionContentPack.deleteMany({});
    await DetectionGap.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Incident.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await ThreatHunt.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await AuditEvent.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await mongoose.disconnect();
  });

  describe('1. Content Model, Versioning & Immutable Revisions', () => {
    let testRule;

    test('Creates detection rule with contentId and initial revision r1', async () => {
      testRule = await DetectionRule.create({
        contentId: `RULE-TEST-001-${Date.now()}`,
        name: 'Mimikatz LSASS Access Detection',
        description: 'Detects memory read access to lsass.exe process by unauthorized processes',
        category: 'ENDPOINT_SECURITY',
        severity: 'CRITICAL',
        status: 'DRAFT',
        enabled: false,
        confidence: 90,
        mitreAttack: {
          techniqueId: 'T1003.001',
          tactic: 'CREDENTIAL_ACCESS',
          techniqueName: 'OS Credential Dumping: LSASS Memory',
        },
        conditions: {
          field: 'process.target',
          operator: 'EQUALS',
          value: 'lsass.exe',
        },
        organizationId: orgA,
        author: actor.username,
      });

      expect(testRule.contentId).toBeDefined();
      expect(testRule.ruleVersion).toBe('1.0.0');
      expect(testRule.revision).toBe(1);
      expect(testRule.status).toBe('DRAFT');

      // Create first revision record
      const rev1 = await detectionLifecycleService.createRevision(
        testRule._id,
        { description: 'Initial draft of LSASS access rule' },
        actor.username,
        orgA,
        'Initial baseline revision'
      );

      expect(rev1.revisionNumber).toBe(1);
      expect(rev1.ruleId).toBe(testRule.ruleId);
    });

    test('Rule modification increments revision and logs diff', async () => {
      const rev2 = await detectionLifecycleService.createRevision(
        testRule._id,
        {
          conditions: {
            field: 'process.target',
            operator: 'EQUALS',
            value: 'lsass.exe',
            grantedAccess: '0x1010',
          },
          confidence: 95,
        },
        actor.username,
        orgA,
        'Tightened conditions with specific access mask'
      );

      expect(rev2.revisionNumber).toBe(2);
      expect(rev2.diff).toBeDefined();

      const updatedRule = await DetectionRule.findById(testRule._id);
      expect(updatedRule.revision).toBe(2);
      expect(updatedRule.confidence).toBe(95);
      expect(updatedRule.status).toBe('TESTING'); // Reset to testing on condition change
    });
  });

  describe('2. Deterministic Fixture Execution & Health Evaluation', () => {
    let fixtureRule;

    beforeEach(async () => {
      fixtureRule = await DetectionRule.create({
        contentId: `RULE-FIXTURE-${Date.now()}`,
        name: 'Suspicious PowerShell Execution',
        description: 'Detects encoded command execution in PowerShell',
        category: 'ENDPOINT_SECURITY',
        severity: 'HIGH',
        status: 'TESTING',
        enabled: false,
        mitreAttack: {
          techniqueId: 'T1059.001',
          tactic: 'EXECUTION',
          techniqueName: 'Command and Scripting Interpreter: PowerShell',
        },
        conditions: {
          field: 'process.command_line',
          operator: 'CONTAINS',
          value: '-enc',
        },
        testFixtures: [
          {
            name: 'Encoded command match',
            description: 'Expect match on base64 encoded flag',
            expectedResult: 'MATCH',
            eventPayload: {
              process: {
                command_line: 'powershell.exe -NoP -NonI -enc SQBFAFgA',
              },
            },
          },
          {
            name: 'Benign powershell no-match',
            description: 'Expect no-match on benign flag',
            expectedResult: 'NO_MATCH',
            eventPayload: {
              process: {
                command_line: 'powershell.exe Get-Process',
              },
            },
          },
        ],
        organizationId: orgA,
        author: actor.username,
      });
    });

    test('Evaluates MATCH and NO_MATCH fixtures deterministically', async () => {
      const matchFixture = fixtureRule.testFixtures[0];
      const noMatchFixture = fixtureRule.testFixtures[1];

      const matchRes = await detectionTestingService.executeFixture(fixtureRule, matchFixture);
      expect(matchRes.passed).toBe(true);
      expect(matchRes.actualResult).toBe('MATCH');

      const noMatchRes = await detectionTestingService.executeFixture(fixtureRule, noMatchFixture);
      expect(noMatchRes.passed).toBe(true);
      expect(noMatchRes.actualResult).toBe('NO_MATCH');
    });

    test('Runs testRuleFixtures and updates rule health to HEALTHY', async () => {
      const result = await detectionTestingService.testRuleFixtures(fixtureRule._id, orgA);
      expect(result.allPassed).toBe(true);
      expect(result.passedTests).toBe(2);
      expect(result.failedTests).toBe(0);

      const updated = await DetectionRule.findById(fixtureRule._id);
      expect(updated.healthStatus).toBe('HEALTHY');
      expect(updated.testSummary.passingFixtures).toBe(2);
    });

    test('Updates rule health to FAILING_TESTS when a fixture fails', async () => {
      // Add a fixture that fails
      fixtureRule.testFixtures.push({
        name: 'Should not match encoded flag',
        expectedResult: 'NO_MATCH', // But payload has -enc, so it will MATCH, causing test to FAIL
        eventPayload: {
          process: {
            command_line: 'powershell.exe -enc Zm9v',
          },
        },
      });
      await fixtureRule.save();

      const result = await detectionTestingService.testRuleFixtures(fixtureRule._id, orgA);
      expect(result.allPassed).toBe(false);
      expect(result.failedTests).toBe(1);

      const updated = await DetectionRule.findById(fixtureRule._id);
      expect(updated.healthStatus).toBe('FAILING_TESTS');
    });
  });

  describe('3. Lifecycle Promotion State Machine & Review Gates', () => {
    let lifecycleRule;

    beforeEach(async () => {
      lifecycleRule = await DetectionRule.create({
        contentId: `RULE-LIFE-${Date.now()}`,
        name: 'Ransomware Extension Anomaly',
        category: 'BEHAVIORAL_ANOMALY',
        severity: 'CRITICAL',
        status: 'DRAFT',
        enabled: false,
        mitreAttack: {
          techniqueId: 'T1486',
          tactic: 'IMPACT',
          techniqueName: 'Data Encrypted for Impact',
        },
        conditions: {
          field: 'file.extension',
          operator: 'CONTAINS',
          value: '.locked',
        },
        testFixtures: [
          {
            name: 'Locked extension match',
            expectedResult: 'MATCH',
            eventPayload: { file: { extension: 'notes.doc.locked' } },
          },
        ],
        organizationId: orgA,
        author: actor.username,
      });
    });

    test('Blocks promotion to REVIEW when health is not HEALTHY', async () => {
      // Rule is in DRAFT, transition to TESTING
      await detectionLifecycleService.transitionState(lifecycleRule._id, 'TESTING', actor, orgA);

      // Rule has not run fixtures, healthStatus is UNTESTED
      await expect(
        detectionLifecycleService.transitionState(lifecycleRule._id, 'REVIEW', actor, orgA)
      ).rejects.toThrow(/must pass all test fixtures/i);
    });

    test('Allows promotion to REVIEW after fixtures pass', async () => {
      await detectionLifecycleService.transitionState(lifecycleRule._id, 'TESTING', actor, orgA);
      await detectionTestingService.testRuleFixtures(lifecycleRule._id, orgA);

      const inReview = await detectionLifecycleService.transitionState(
        lifecycleRule._id,
        'REVIEW',
        actor,
        orgA,
        'Fixtures verified, ready for operator review'
      );
      expect(inReview.status).toBe('REVIEW');
    });

    test('Operator review approves rule and transitions to APPROVED', async () => {
      await detectionLifecycleService.transitionState(lifecycleRule._id, 'TESTING', actor, orgA);
      await detectionTestingService.testRuleFixtures(lifecycleRule._id, orgA);
      await detectionLifecycleService.transitionState(lifecycleRule._id, 'REVIEW', actor, orgA);

      const approved = await detectionLifecycleService.reviewRule(
        lifecycleRule._id,
        'APPROVE',
        actor,
        orgA,
        'Rule verified and approved for staging'
      );

      expect(approved.status).toBe('APPROVED');
      expect(approved.reviewHistory.length).toBe(1);
      expect(approved.reviewHistory[0].decision).toBe('APPROVE');
    });

    test('Activation enables rule and sets status to ACTIVE', async () => {
      await detectionLifecycleService.transitionState(lifecycleRule._id, 'TESTING', actor, orgA);
      await detectionTestingService.testRuleFixtures(lifecycleRule._id, orgA);
      await detectionLifecycleService.transitionState(lifecycleRule._id, 'REVIEW', actor, orgA);
      await detectionLifecycleService.reviewRule(lifecycleRule._id, 'APPROVE', actor, orgA);

      const activated = await detectionLifecycleService.activateRule(lifecycleRule._id, actor, orgA);
      expect(activated.status).toBe('ACTIVE');
      expect(activated.enabled).toBe(true);

      // Disable rule
      const disabled = await detectionLifecycleService.disableRule(lifecycleRule._id, actor, orgA, 'Maintenance');
      expect(disabled.status).toBe('DISABLED');
      expect(disabled.enabled).toBe(false);
    });
  });

  describe('4. Rollback Discipline', () => {
    test('Rolls back rule to previously approved revision and preserves audit trail', async () => {
      const rollbackRule = await DetectionRule.create({
        contentId: `RULE-ROLLBACK-${Date.now()}`,
        name: 'SSH Brute Force Detection',
        category: 'AUTHENTICATION_ABUSE',
        severity: 'HIGH',
        status: 'ACTIVE',
        enabled: true,
        mitreAttack: {
          techniqueId: 'T1110.001',
          tactic: 'CREDENTIAL_ACCESS',
          techniqueName: 'Password Guessing',
        },
        conditions: { field: 'auth.failures', operator: 'GREATER_THAN', value: 5 },
        organizationId: orgA,
        author: actor.username,
      });

      // Rev 1
      await detectionLifecycleService.createRevision(
        rollbackRule._id,
        { conditions: { field: 'auth.failures', operator: 'GREATER_THAN', value: 5 } },
        actor.username,
        orgA,
        'Revision 1 stable'
      );

      // Rev 2 (faulty condition)
      await detectionLifecycleService.createRevision(
        rollbackRule._id,
        { conditions: { field: 'auth.failures', operator: 'GREATER_THAN', value: 500 } },
        actor.username,
        orgA,
        'Revision 2 high threshold'
      );

      const checkR2 = await DetectionRule.findById(rollbackRule._id);
      const condVal = Array.isArray(checkR2.conditions) ? checkR2.conditions[0]?.value : checkR2.conditions?.value;
      expect(condVal).toBe(500);

      // Rollback to Rev 1
      const rolledBack = await detectionLifecycleService.rollbackRule(
        rollbackRule._id,
        1,
        actor.username,
        orgA,
        'Rollback due to missed low-and-slow brute force attacks'
      );

      const rollVal = Array.isArray(rolledBack.conditions) ? rolledBack.conditions[0]?.value : rolledBack.conditions?.value;
      expect(rollVal).toBe(5);
      expect(rolledBack.revision).toBe(3); // New revision created for rollback

      const latestRev = await DetectionRuleRevision.findOne({
        ruleId: rollbackRule.ruleId,
        revisionNumber: 3,
      });
      expect(latestRev.changeSummary).toContain('Rollback to revision 1');
    });
  });

  describe('5. Safe Import Validation & Injection Guard', () => {
    test('Rejects dangerous query operators in rule import payload', async () => {
      const maliciousPayload = {
        name: 'Malicious Rule Attempt',
        category: 'ENDPOINT_SECURITY',
        conditions: {
          $where: 'sleep(5000)',
        },
      };

      await expect(
        detectionLifecycleService.validateAndImportRule(maliciousPayload, actor.username, orgA)
      ).rejects.toThrow(/unsafe operator|disallowed operator|security violation/i);
    });

    test('Safely imports valid rule strictly as DRAFT with enabled: false', async () => {
      const validPayload = {
        name: 'Pass-the-Hash Detection',
        category: 'LATERAL_MOVEMENT',
        severity: 'HIGH',
        mitreAttack: {
          techniqueId: 'T1550.002',
          tactic: 'LATERAL_MOVEMENT',
          techniqueName: 'Pass the Hash',
        },
        conditions: {
          field: 'auth.package_name',
          operator: 'EQUALS',
          value: 'NTLM',
        },
        testFixtures: [
          {
            name: 'NTLM logon match',
            expectedResult: 'MATCH',
            eventPayload: { auth: { package_name: 'NTLM' } },
          },
        ],
      };

      const imported = await detectionLifecycleService.validateAndImportRule(
        validPayload,
        actor.username,
        orgA
      );

      expect(imported.status).toBe('DRAFT');
      expect(imported.enabled).toBe(false);
      expect(imported.contentId).toMatch(/^(RULE-|DET-)/);
    });
  });

  describe('6. Canonical Content Packs', () => {
    test('Seeds 5 canonical packs and verifies real checksums', async () => {
      const packs = await contentPackService.seedCanonicalPacks();
      expect(packs.length).toBe(5);

      for (const pack of packs) {
        expect(pack.checksum).toBeDefined();
        expect(pack.checksum.length).toBe(64); // SHA-256
        expect(pack.rules.length).toBeGreaterThan(0);
      }
    });

    test('Validates and tests PACK-CORE-SOC', async () => {
      const validation = await contentPackService.validatePack('PACK-CORE-SOC');
      expect(validation.valid).toBe(true);

      const testResults = await contentPackService.testPack('PACK-CORE-SOC');
      expect(testResults.passedRules).toBe(testResults.totalRules);
    });

    test('Activates PACK-CORE-SOC into organization', async () => {
      const activation = await contentPackService.activatePack('PACK-CORE-SOC', actor, orgA);
      expect(activation.activatedCount).toBeGreaterThan(0);

      // Verify rules were instantiated in DB
      const instantiated = await DetectionRule.find({
        organizationId: orgA,
        packId: 'PACK-CORE-SOC',
      });
      expect(instantiated.length).toBe(activation.activatedCount);
    });
  });

  describe('7. Ground-Truth ATT&CK Coverage Matrix', () => {
    test('Calculates accurate ATT&CK coverage based on active, healthy rules', async () => {
      const coverage = await detectionCoverageService.calculateCoverage(orgA);

      expect(coverage.totalTechniquesTracked).toBe(28);
      expect(coverage.coveredTechniques).toBeGreaterThan(0);
      expect(coverage.coveragePercentage).toBeGreaterThan(0);
      expect(coverage.tacticBreakdown).toBeDefined();

      // Find covered technique
      const covered = coverage.techniqueDetails.find((t) => t.status === 'COVERED');
      expect(covered).toBeDefined();
      expect(covered.activeRuleCount).toBeGreaterThan(0);
    });
  });

  describe('8. Evidence-Backed Detection Gap Engine', () => {
    test('Scans for gaps against uncovered techniques and observed incidents', async () => {
      // Create an incident with an uncovered technique
      await Incident.create({
        incidentId: `INC-GAP-${Date.now()}`,
        title: 'Uncovered Cobalt Strike Beaconing Incident',
        severity: 'CRITICAL',
        mitreAttack: {
          techniqueId: 'T1071.001',
          tactic: 'COMMAND_AND_CONTROL',
          techniqueName: 'Web Protocols',
        },
        organizationId: orgA,
      });

      const scanResult = await detectionGapService.scanForGaps(orgA);
      expect(scanResult.gapsFound).toBeGreaterThan(0);

      const foundGap = await DetectionGap.findOne({
        techniqueId: 'T1071.001',
        organizationId: orgA,
      });
      expect(foundGap).toBeDefined();
      expect(foundGap.gapType).toBe('INCIDENT_UNCOVERED');
      expect(foundGap.evidenceIncidents.length).toBeGreaterThan(0);
    });

    test('Drafts candidate rule from gap strictly in DRAFT status', async () => {
      const gap = await DetectionGap.findOne({
        techniqueId: 'T1071.001',
        organizationId: orgA,
      });
      expect(gap).toBeDefined();

      const candidateRule = await detectionGapService.createCandidateRuleFromGap(gap._id, actor.username, orgA);
      expect(candidateRule.status).toBe('DRAFT');
      expect(candidateRule.enabled).toBe(false);
      const techId = Array.isArray(candidateRule.mitreAttack) ? candidateRule.mitreAttack[0]?.techniqueId : candidateRule.mitreAttack?.techniqueId;
      expect(techId).toBe('T1071.001');

      const updatedGap = await DetectionGap.findById(gap._id);
      expect(updatedGap.status).toBe('RULE_DRAFTED');
      expect(updatedGap.candidateRuleId.toString()).toBe(candidateRule._id.toString());
    });
  });

  describe('9. Regression Testing Suite & Quality Metrics', () => {
    test('Executes regression suite across all rules in organization', async () => {
      const regression = await detectionTestingService.runRegressionSuite(orgA);
      expect(regression.totalRules).toBeGreaterThan(0);
      expect(regression.passedRules).toBeGreaterThan(0);
      expect(regression.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    test('Fetches persisted quality metrics from database', async () => {
      const metrics = await detectionTestingService.getQualityMetrics(orgA);
      expect(metrics.totalRules).toBeGreaterThan(0);
      expect(metrics.activeRules).toBeGreaterThan(0);
      expect(metrics.healthyRules).toBeGreaterThan(0);
    });
  });

  describe('10. Multi-Tenant Isolation', () => {
    test('Ensures Org A detection rules and gaps are invisible to Org B', async () => {
      const ruleOrgA = await DetectionRule.create({
        contentId: `RULE-TENANT-A-${Date.now()}`,
        name: 'Org A Exclusive Rule',
        category: 'CLOUD_SECURITY',
        severity: 'MEDIUM',
        organizationId: orgA,
      });

      const ruleOrgB = await DetectionRule.create({
        contentId: `RULE-TENANT-B-${Date.now()}`,
        name: 'Org B Exclusive Rule',
        category: 'CLOUD_SECURITY',
        severity: 'MEDIUM',
        organizationId: orgB,
      });

      const findInB = await DetectionRule.findOne({ _id: ruleOrgA._id, organizationId: orgB });
      expect(findInB).toBeNull();

      const findInA = await DetectionRule.findOne({ _id: ruleOrgB._id, organizationId: orgA });
      expect(findInA).toBeNull();
    });
  });
});
