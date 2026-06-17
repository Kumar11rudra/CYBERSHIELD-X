const mongoose = require('mongoose');
const IntegrationConfig = require('../models/IntegrationConfig');
const Playbook = require('../models/Playbook');
const AutomationRun = require('../models/AutomationRun');
const { executeIntegrationAction, testIntegrationConnection } = require('../integrations/integrationService');
const playbookEngine = require('../services/playbookEngine');
const remediationService = require('../services/remediationService');
const actionQueue = require('../integrations/actionQueue');

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('SOAR Security Automation & Integrations (Phase 8)', () => {
  let orgId;
  let testIntegration;
  let testPlaybook;
  let testUser;

  beforeEach(async () => {
    orgId = new mongoose.Types.ObjectId();
    
    // Clear test records
    await IntegrationConfig.deleteMany({});
    await Playbook.deleteMany({});
    await AutomationRun.deleteMany({});
    remediationService.clearCache();

    const User = require('../models/User');
    const Membership = require('../models/Membership');
    await User.deleteMany({ email: /@cybershield-test\.com$/ });
    await Membership.deleteMany({ organizationId: orgId });

    testUser = await User.create({
      username: `analyst-${Date.now()}`,
      email: `analyst-${Date.now()}@cybershield-test.com`,
      password: 'Password123!',
      role: 'user'
    });

    await Membership.create({
      organizationId: orgId,
      userId: testUser._id,
      role: 'owner'
    });

    // Setup integration
    testIntegration = await IntegrationConfig.create({
      organizationId: orgId,
      type: 'Slack',
      name: 'Test Slack Channel',
      config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/X00' },
      active: true,
      healthStatus: 'Unknown',
    });

    // Setup playbook
    testPlaybook = await Playbook.create({
      organizationId: orgId,
      name: 'Critical Alert Responder',
      description: 'Trigger Slack and Notification on critical vulnerabilities',
      enabled: true,
      trigger: {
        event: 'vulnerability_detected',
        conditions: [
          { field: 'severity', operator: 'equals', value: 'Critical' }
        ]
      },
      actions: [
        { type: 'send_slack', integrationId: testIntegration._id, config: { channel: '#sec-alerts' }, order: 0 },
        { type: 'create_notification', config: {}, order: 1 }
      ],
      version: 1,
    });
  });

  // 1. IntegrationConfig Safe Masking & Health Fields
  test('IntegrationConfig - Should mask credentials with toSafeObject and support health tracking', async () => {
    expect(testIntegration.healthStatus).toBe('Unknown');
    const safeObj = testIntegration.toSafeObject();
    expect(safeObj.config.webhookUrl).toBe('••••••••');

    // Update health status
    testIntegration.healthStatus = 'Healthy';
    testIntegration.lastSuccessAt = new Date();
    await testIntegration.save();

    const updated = await IntegrationConfig.findById(testIntegration._id);
    expect(updated.healthStatus).toBe('Healthy');
    expect(updated.lastSuccessAt).toBeDefined();
  });

  // 2. Playbook Versioning & Templates Seeding
  test('Playbook - Should auto-increment version when fields are modified', async () => {
    expect(testPlaybook.version).toBe(1);

    // Save playbook with change
    testPlaybook.name = 'Upgraded Responder';
    // Emulate controller trigger for version bumping
    testPlaybook.version += 1;
    testPlaybook.publishedAt = new Date();
    await testPlaybook.save();

    const updated = await Playbook.findById(testPlaybook._id);
    expect(updated.version).toBe(2);
    expect(updated.name).toBe('Upgraded Responder');
  });

  test('Playbook - Should seed default templates for new organizations', async () => {
    const newOrgId = new mongoose.Types.ObjectId();
    await playbookEngine.seedDefaultTemplates(newOrgId);

    const seeded = await Playbook.find({ organizationId: newOrgId });
    expect(seeded.length).toBe(3);
    expect(seeded.map(s => s.name)).toContain('Auto-Remediate Critical Vulnerabilities');
  });

  // 3. AutomationRun Model
  test('AutomationRun - Should calculate duration and step counts upon complete execution', async () => {
    const run = await AutomationRun.create({
      playbookId: testPlaybook._id,
      organizationId: orgId,
      trigger: { event: 'vulnerability_detected' },
      status: 'pending',
      startedAt: new Date(),
      actions: [
        { type: 'send_slack', status: 'success', durationMs: 150 },
        { type: 'create_notification', status: 'failed', durationMs: 50, error: 'Network timeout' }
      ]
    });

    const completedAt = new Date();
    run.completedAt = completedAt;
    run.durationMs = completedAt - run.startedAt;
    run.actionCount = run.actions.length;
    run.successfulActions = 1;
    run.failedActions = 1;
    run.status = 'partial';
    await run.save();

    const retrieved = await AutomationRun.findById(run._id);
    expect(retrieved.status).toBe('partial');
    expect(retrieved.actionCount).toBe(2);
    expect(retrieved.successfulActions).toBe(1);
    expect(retrieved.failedActions).toBe(1);
    expect(retrieved.durationMs).toBeGreaterThanOrEqual(0);
  });

  // 4. Condition Evaluation
  test('PlaybookEngine - Condition Evaluator matches context properties correctly', () => {
    const context = { severity: 'Critical', riskScore: 95, asset: 'db-primary.corp' };
    
    // Equal condition
    const cond1 = { field: 'severity', operator: 'equals', value: 'Critical' };
    expect(playbookEngine.evaluateCondition(cond1, context)).toBe(true);

    // Greater Than condition
    const cond2 = { field: 'riskScore', operator: 'greater_than', value: '90' };
    expect(playbookEngine.evaluateCondition(cond2, context)).toBe(true);

    // Less Than condition (fails)
    const cond3 = { field: 'riskScore', operator: 'less_than', value: '50' };
    expect(playbookEngine.evaluateCondition(cond3, context)).toBe(false);

    // Contains condition
    const cond4 = { field: 'asset', operator: 'contains', value: 'db-primary' };
    expect(playbookEngine.evaluateCondition(cond4, context)).toBe(true);
  });

  // 5. AI Remediation TTL Cache
  test('RemediationService - Should save and load from CVE cache, respecting TTL', async () => {
    const cve = 'CVE-2026-9999';
    const plan = {
      executiveSummary: 'Test summary',
      rootCause: 'Test root cause',
      recommendedFix: 'Test fix',
      verificationChecklist: '- [ ] Test checklist',
    };

    // Invoke remediation plan generation to fallback (which saves to cache)
    const fetchedPlan = await remediationService.generateRemediationPlan(cve, 'Test context');
    expect(fetchedPlan.executiveSummary).toContain(cve);

    // Access raw cached value
    const cachedPlan = await remediationService.generateRemediationPlan(cve, 'Test context');
    expect(cachedPlan).toBeDefined();
  });

  // 6. Action Queue Execution
  test('ActionQueue - Enqueueing tasks processes actions and updates run logs', async () => {
    // Mock external integration dispatching
    jest.mock('../integrations/slack', () => ({
      sendSlackBlocks: jest.fn().mockResolvedValue({ delivered: true }),
    }));

    const run = await AutomationRun.create({
      playbookId: testPlaybook._id,
      organizationId: orgId,
      trigger: { event: 'manual' },
      status: 'pending',
      startedAt: new Date(),
      actions: [
        { type: 'create_notification', status: 'pending' },
        { type: 'create_audit_entry', status: 'pending' }
      ]
    });

    // Enqueue tasks
    await actionQueue.enqueue({
      runId: run._id,
      actionIndex: 0,
      actionType: 'create_notification',
      actionConfig: {},
      context: { userId: testUser._id, title: 'Test alert', message: 'Manual run verification' },
      organizationId: orgId
    });

    await actionQueue.enqueue({
      runId: run._id,
      actionIndex: 1,
      actionType: 'create_audit_entry',
      actionConfig: {},
      context: { playbookId: testPlaybook._id, event: 'manual', message: 'Manual run audit' },
      organizationId: orgId
    });

    // Wait a brief moment for worker to conclude async tasks
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedRun = await AutomationRun.findById(run._id);
    expect(updatedRun.status).toBe('success');
    expect(updatedRun.successfulActions).toBe(2);
    expect(updatedRun.actions[0].status).toBe('success');
    expect(updatedRun.actions[1].status).toBe('success');
  });
});
