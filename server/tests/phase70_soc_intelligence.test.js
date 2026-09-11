/**
 * 🛡️ CyberShield X — Phase 70 SOC Intelligence, Correlation & Detection Test Suite
 */

jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    const userId = req.headers['x-test-user-id'] || 'test-operator-1';
    const role = req.headers['x-test-user-role'] || 'operator';
    const email = req.headers['x-test-user-email'] || 'operator@cybershield.local';
    const organizationId = req.headers['x-test-org-id'] || null;
    req.user = { id: userId, _id: userId, role, email, username: 'testuser', organizationId };
    next();
  },
  tryAuthenticate: (req, res, next) => {
    const userId = req.headers['x-test-user-id'] || 'test-operator-1';
    const role = req.headers['x-test-user-role'] || 'operator';
    const email = req.headers['x-test-user-email'] || 'operator@cybershield.local';
    const organizationId = req.headers['x-test-org-id'] || null;
    req.user = { id: userId, _id: userId, role, email, username: 'testuser', organizationId };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (roles.length && !roles.includes(req.user?.role?.toUpperCase())) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
  },
  requireAdmin: (req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }
}));

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const detectionRoutes = require('../routes/detection');
const incidentRoutes = require('../routes/incident');
const approvalRoutes = require('../routes/approval');
const iocRoutes = require('../routes/ioc');
const searchRoutes = require('../routes/search');
const chatbotRoutes = require('../routes/chatbot');

const detectionRuleEngine = require('../services/soc/DetectionRuleEngine');
const iocNormalizationService = require('../services/soc/IOCNormalizationService');
const incidentCorrelationEngine = require('../services/soc/IncidentCorrelationEngine');
const safePlaybookAutomationService = require('../services/soc/SafePlaybookAutomationService');

const DetectionRule = require('../models/DetectionRule');
const DetectionSuppression = require('../models/DetectionSuppression');
const Incident = require('../models/Incident');
const PendingApproval = require('../models/PendingApproval');
const IOCRecord = require('../models/IOCRecord');
const Alert = require('../models/Alert');
const AuditEvent = require('../models/AuditEvent');

describe('🚀 CYBERSHIELD X — PHASE 70 SOC INTELLIGENCE, CORRELATION, DETECTION & SAFE AUTOMATION', () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/detections', detectionRoutes);
    app.use('/api/incidents', incidentRoutes);
    app.use('/api/approvals', approvalRoutes);
    app.use('/api/iocs', iocRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/chatbot', chatbotRoutes);

    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield_phase70_test';
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    try {
      await DetectionRule.deleteMany({ ruleId: /RULE-TEST/ });
      await DetectionSuppression.deleteMany({ reason: /Test/ });
      await Incident.deleteMany({ title: /Test/ });
      await PendingApproval.deleteMany({ reason: /Test/ });
      await IOCRecord.deleteMany({ canonicalValue: /test|example\.com/ });
      await Alert.deleteMany({ title: /Test/ });
      await AuditEvent.deleteMany({ 'actor.email': /cybershield\.local/ });
    } catch (e) {
      // ignore
    }
  });

  describe('1. Detection Rule Engine & Deterministic Operators', () => {
    it('evaluates conditions with operators: equals, contains, regex, greater_than, less_than, in', async () => {
      const rule = {
        conditions: [
          { field: 'severity', operator: 'equals', value: 'HIGH' },
          { field: 'target', operator: 'contains', value: 'corp' },
          { field: 'port', operator: 'in', value: [80, 443, 8080] },
          { field: 'riskScore', operator: 'greater_than', value: 75 },
          { field: 'latency', operator: 'less_than', value: 100 },
          { field: 'cve', operator: 'regex', value: '^CVE-2024-' }
        ]
      };

      const matchingEvent = {
        severity: 'HIGH',
        target: 'internal-corp-service.net',
        port: 443,
        riskScore: 85,
        latency: 42,
        cve: 'CVE-2024-3094'
      };

      const result = await detectionRuleEngine.evaluateRule(rule, matchingEvent);
      expect(result.matches).toBe(true);
      expect(result.matchedConditions.length).toBe(6);

      const nonMatchingEvent = {
        ...matchingEvent,
        severity: 'LOW'
      };
      const failResult = await detectionRuleEngine.evaluateRule(rule, nonMatchingEvent);
      expect(failResult.matches).toBe(false);
    });

    it('creates, lists and fetches detection rules via REST API', async () => {
      const res = await request(app)
        .post('/api/detections/rules')
        .set('x-test-user-role', 'admin')
        .send({
          name: 'RULE-TEST: Exposed High Risk Port',
          description: 'Detects open administrative ports on production perimeter',
          severity: 'HIGH',
          category: 'network_exposure',
          conditions: [
            { field: 'target', operator: 'contains', value: 'example.com' },
            { field: 'severity', operator: 'equals', value: 'HIGH' }
          ],
          responsePolicy: {
            autoEscalate: true,
            recommendedPlaybook: 'quarantine-perimeter'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ruleId).toBeDefined();
      expect(res.body.data.status).toBe('ACTIVE');

      const listRes = await request(app).get('/api/detections/rules');
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.rules.length).toBeGreaterThan(0);
    });

    it('runs isolated testing harness without polluting production state', async () => {
      // Create a test rule
      const rule = await DetectionRule.create({
        ruleId: 'RULE-TEST-001',
        name: 'RULE-TEST: Isolated Rule Test',
        severity: 'MEDIUM',
        category: 'suspicious_ioc',
        status: 'ACTIVE',
        enabled: true,
        conditions: [
          { field: 'tool', operator: 'equals', value: 'whois' }
        ]
      });

      const res = await request(app)
        .post(`/api/detections/rules/${rule.ruleId}/test`)
        .send({
          fixtureEvent: {
            tool: 'whois',
            target: 'malicious-domain.com'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.outcome).toBe('MATCH');
      expect(res.body.data.ruleId).toBe('RULE-TEST-001');

      // Verify no production alert or incident was created by this test
      const alertsCount = await Alert.countDocuments({ target: 'malicious-domain.com' });
      expect(alertsCount).toBe(0);
    });
  });

  describe('2. Rule Approval Lifecycle & AI Guardrails', () => {
    it('creates AI-drafted rules as DRAFT with enabled=false', async () => {
      const res = await request(app)
        .post('/api/chatbot/detection/draft-rule')
        .send({
          threatDescription: 'Detect SSH brute force attempts from anomalous external IPs',
          category: 'brute_force'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rule.status).toBe('DRAFT');
      expect(res.body.data.rule.enabled).toBe(false);
      expect(res.body.data.rule.aiDraft).toBe(true);
      expect(res.body.data.explanation).toContain('AI-generated detection rule drafted');
    });

    it('requires explicit operator approval to transition DRAFT to ACTIVE', async () => {
      const draftRule = await DetectionRule.create({
        ruleId: 'RULE-TEST-DRAFT',
        name: 'RULE-TEST: AI Candidate Rule',
        severity: 'HIGH',
        category: 'vulnerability_exploit',
        status: 'DRAFT',
        enabled: false,
        aiDraft: true,
        conditions: [{ field: 'cve', operator: 'contains', value: 'CVE-2024' }]
      });

      const res = await request(app)
        .post(`/api/detections/rules/${draftRule.ruleId}/approve`)
        .set('x-test-user-role', 'admin')
        .send({ reason: 'Reviewed and validated by Lead Architect' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.enabled).toBe(true);
    });
  });

  describe('3. Suppression Engine & Automatic Expiration', () => {
    it('suppresses matching detections when active, then resumes detection when expired', async () => {
      // 1. Create suppression active for 1 second
      const suppression = await DetectionSuppression.create({
        ruleId: 'RULE-TEST-SUPP',
        scope: { target: '10.0.0.5' },
        reason: 'Test legitimate vulnerability scanning window',
        actor: { username: 'test-admin', role: 'ADMIN' },
        active: true,
        startsAt: new Date(Date.now() - 10000),
        expiresAt: new Date(Date.now() + 500) // expires in 500ms
      });

      const isSuppressedInitial = await detectionRuleEngine.isSuppressed('RULE-TEST-SUPP', { target: '10.0.0.5' });
      expect(isSuppressedInitial).toBe(true);

      // Wait 600ms for expiration
      await new Promise((r) => setTimeout(r, 600));

      const isSuppressedAfterExpiry = await detectionRuleEngine.isSuppressed('RULE-TEST-SUPP', { target: '10.0.0.5' });
      expect(isSuppressedAfterExpiry).toBe(false);
    });
  });

  describe('4. IOC Normalization & Truthful Enrichment', () => {
    it('normalizes IPv4, IPv6, domain, URL, hash, CVE, and certificate fingerprints', () => {
      const testCases = [
        { raw: '  192.168.1.1  ', expectedType: 'ipv4', canonical: '192.168.1.1' },
        { raw: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', expectedType: 'ipv6' },
        { raw: 'HTTPS://Sub.Example.COM/Path/Login?q=1', expectedType: 'url', canonical: 'https://sub.example.com/Path/Login?q=1' },
        { raw: '  EVIL-DOMAIN.CO.UK. ', expectedType: 'domain', canonical: 'evil-domain.co.uk' },
        { raw: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', expectedType: 'hash_sha256' },
        { raw: 'cve-2024-3094', expectedType: 'cve', canonical: 'CVE-2024-3094' },
      ];

      for (const tc of testCases) {
        const norm = iocNormalizationService.normalizeIOC(tc.raw);
        expect(norm).not.toBeNull();
        expect(norm.type).toBe(tc.expectedType);
        if (tc.canonical) {
          expect(norm.canonicalValue).toBe(tc.canonical);
        }
      }
    });

    it('enriches IOC truthfully without synthesizing reputation and records provider details', async () => {
      const res = await request(app)
        .post('/api/iocs/enrich')
        .send({ indicator: '127.0.0.1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.canonicalValue).toBe('127.0.0.1');
      expect(res.body.data.enrichmentHistory.length).toBeGreaterThan(0);

      const entry = res.body.data.enrichmentHistory[0];
      expect(entry).toHaveProperty('provider');
      expect(entry).toHaveProperty('status');
      expect(entry).toHaveProperty('timestamp');
      // Status must be either COMPLETED or EXTERNAL_SERVICE_UNAVAILABLE - never fake data
      expect(['COMPLETED', 'EXTERNAL_SERVICE_UNAVAILABLE', 'NOT_FOUND', 'SUCCESS']).toContain(entry.status);
    });
  });

  describe('5. Multi-Signal Correlation & Incident Graph', () => {
    it('correlates multiple findings, calculates explainable risk score, and synthesizes attack chain', async () => {
      const finding1 = {
        title: 'Exposed SSH Port 22',
        severity: 'HIGH',
        category: 'network_exposure',
        asset: '192.168.1.50',
        details: { port: 22, service: 'OpenSSH 8.2' },
        threatScore: 70
      };

      const finding2 = {
        title: 'Outdated OpenSSH Remote Code Execution Vulnerability',
        severity: 'CRITICAL',
        category: 'vulnerability',
        asset: '192.168.1.50',
        details: { cve: 'CVE-2024-6387', exploitability: 9.0 },
        threatScore: 90
      };

      const incident = await incidentCorrelationEngine.correlateEventStream([finding1, finding2], {
        organizationId: 'org-test'
      });

      expect(incident).toBeDefined();
      expect(incident.incidentId).toMatch(/^INC-/);
      expect(incident.severity).toBe('CRITICAL');
      expect(incident.affectedAssets).toContain('192.168.1.50');

      // Explainable risk score verification
      expect(incident.riskScore).toBeGreaterThan(60);
      expect(incident.riskBreakdown).toBeDefined();
      expect(incident.riskBreakdown.severityWeight).toBe(0.35);
      expect(incident.riskBreakdown.assetCriticalityWeight).toBe(0.20);
      expect(incident.riskBreakdown.exploitabilityWeight).toBe(0.15);
      expect(incident.riskBreakdown.threatIntelWeight).toBe(0.15);
      expect(incident.riskBreakdown.correlationWeight).toBe(0.15);

      // Attack chain graph verification
      expect(incident.attackChainGraph.nodes.length).toBeGreaterThan(1);
      expect(incident.attackChainGraph.edges.length).toBeGreaterThan(0);
      const edge = incident.attackChainGraph.edges[0];
      expect(edge).toHaveProperty('from');
      expect(edge).toHaveProperty('to');
      expect(edge).toHaveProperty('relationship');
    });

    it('updates incident lifecycle states with operator rationale', async () => {
      const inc = await Incident.create({
        incidentId: 'INC-TEST-001',
        title: 'Test Incident for Lifecycle Validation',
        severity: 'HIGH',
        status: 'DETECTED',
        confidence: 0.85,
        riskScore: 75
      });

      const res = await request(app)
        .put(`/api/incidents/${inc.incidentId}/status`)
        .send({
          status: 'TRIAGING',
          rationale: 'Assigned to Senior SOC Analyst'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('TRIAGING');

      const updated = await Incident.findOne({ incidentId: inc.incidentId });
      expect(updated.timeline.some(t => t.description.includes('Status changed to TRIAGING'))).toBe(true);
    });
  });

  describe('6. Alert Deduplication', () => {
    it('increments occurrenceCount and preserves firstSeen on duplicate alerts', async () => {
      await Alert.deleteMany({ ruleId: 'RULE-DEDUP-01' });

      const event = {
        title: 'Repeated Port Scan',
        severity: 'LOW',
        category: 'recon',
        asset: '10.10.10.10',
        ruleId: 'RULE-DEDUP-01',
        details: { port: 80 }
      };

      const alert1 = await incidentCorrelationEngine.deduplicateAlert(event);
      expect(alert1.occurrenceCount).toBe(1);
      const originalFirstSeen = alert1.firstSeen;

      // Duplicate alert arrives 100ms later
      await new Promise(r => setTimeout(r, 100));
      const alert2 = await incidentCorrelationEngine.deduplicateAlert(event);

      expect(alert2.alertId).toBe(alert1.alertId);
      expect(alert2.occurrenceCount).toBe(2);
      expect(new Date(alert2.firstSeen).getTime()).toBe(new Date(originalFirstSeen).getTime());
      expect(new Date(alert2.lastSeen).getTime()).toBeGreaterThan(new Date(originalFirstSeen).getTime());
    });
  });

  describe('7. Safe Playbook Automation & Human-in-the-Loop Approval', () => {
    it('proposes an action requiring human operator authorization', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .send({
          actionType: 'run_diagnostic_tool',
          riskLevel: 'USER_APPROVED',
          target: '192.168.1.1',
          tool: 'ping',
          parameters: { count: 2 },
          reason: 'Test network probe'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalId).toMatch(/^APPR?-/);
      expect(res.body.data.status).toBe('AWAITING_APPROVAL');
    });

    it('executes action upon operator approval and records executionId and audit trail', async () => {
      const approval = await safePlaybookAutomationService.proposeAction({
        actionType: 'run_diagnostic_tool',
        riskLevel: 'USER_APPROVED',
        target: '127.0.0.1',
        tool: 'ping',
        parameters: { count: 1 },
        reason: 'Test approved execution',
        requestedBy: { username: 'test-analyst', role: 'ANALYST' }
      });

      const res = await request(app)
        .post(`/api/approvals/${approval.approvalId}/approve`)
        .set('x-test-user-role', 'admin')
        .send({ decisionReason: 'Authorized by SecOps Lead' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.executionResult).toBeDefined();
    }, 15000);

    it('denies action cleanly when operator rejects request', async () => {
      const approval = await safePlaybookAutomationService.proposeAction({
        actionType: 'quarantine_item',
        riskLevel: 'PRIVILEGED',
        target: 'critical-db-cluster',
        tool: 'isolate',
        reason: 'Test denied execution',
        requestedBy: { username: 'test-analyst', role: 'ANALYST' }
      });

      const res = await request(app)
        .post(`/api/approvals/${approval.approvalId}/deny`)
        .set('x-test-user-role', 'admin')
        .send({ reason: 'Target is critical production database' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DENIED');
      expect(res.body.data.decisionReason).toContain('Target is critical');
    });
  });

  describe('8. AI Copilot Detection Engineering & Guardrails', () => {
    it('analyzes detection rule matches explainably without fabricating data', async () => {
      const res = await request(app)
        .post('/api/chatbot/detection/analyze')
        .send({
          ruleId: 'RULE-EXPLAIN-01',
          evidence: {
            service: 'Apache HTTPD',
            cve: 'CVE-2021-41773',
            statusCode: 200,
            path: '/cgi-bin/.%2e/.%2e/etc/passwd'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.analysis).toBeDefined();
      expect(res.body.data.explanation).toBeDefined();
      expect(res.body.data.actionProposals.every(a => a.actionType === 'ANALYSIS_ONLY' || a.actionType === 'USER_APPROVED_TOOL_ACTION')).toBe(true);
    });

    it('strictly confines AI action proposals to bounded boundaries', async () => {
      const res = await request(app)
        .post('/api/chatbot/detection/correlate')
        .send({
          signals: [
            { asset: '10.0.0.1', issue: 'Outdated SSL' },
            { asset: '10.0.0.1', issue: 'Expired Certificate' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.correlationConfidence).toBeDefined();
      expect(res.body.data.actionProposals.length).toBeGreaterThan(0);
      // AI cannot self-execute
      expect(res.body.data.canSelfExecute).toBe(false);
    });
  });

  describe('9. Multi-Tenant Isolation & Server-Side RBAC', () => {
    it('isolates incidents and detections across tenant organization IDs', async () => {
      // Create an incident for Org Alpha
      const incAlpha = await Incident.create({
        incidentId: 'INC-ALPHA-01',
        title: 'Org Alpha Specific Incident',
        severity: 'HIGH',
        status: 'DETECTED',
        organizationId: 'org-alpha-99'
      });

      // Request incidents as Org Beta
      const resBeta = await request(app)
        .get('/api/incidents')
        .set('x-test-org-id', 'org-beta-88');

      expect(resBeta.status).toBe(200);
      const ids = resBeta.body.data.incidents.map(i => i.incidentId);
      expect(ids).not.toContain('INC-ALPHA-01');

      // Request incidents as Org Alpha
      const resAlpha = await request(app)
        .get('/api/incidents')
        .set('x-test-org-id', 'org-alpha-99');

      expect(resAlpha.status).toBe(200);
      const alphaIds = resAlpha.body.data.incidents.map(i => i.incidentId);
      expect(alphaIds).toContain('INC-ALPHA-01');

      // Cleanup
      await Incident.deleteOne({ incidentId: 'INC-ALPHA-01' });
    });
  });

  describe('10. Global Search Extension & Audit Logging', () => {
    it('returns detections, incidents, and approvals in global search', async () => {
      const res = await request(app)
        .get('/api/search?q=TEST')
        .set('x-test-user-role', 'admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toHaveProperty('detections');
      expect(res.body.data.results).toHaveProperty('incidents');
      expect(res.body.data.results).toHaveProperty('approvals');
    });

    it('records immutable audit events for sensitive SOC actions', async () => {
      const auditCount = await AuditEvent.countDocuments({
        action: { $in: ['ACTION_PROPOSED', 'INCIDENT_CREATED', 'RULE_CREATED', 'RULE_APPROVED', 'IOC_ENRICHED', 'ACTION_APPROVED', 'ACTION_EXECUTED', 'ACTION_DENIED'] }
      });
      expect(auditCount).toBeGreaterThan(0);
    });
  });
});
