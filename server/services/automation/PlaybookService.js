const crypto = require('crypto');
const AutomationPlaybook = require('../../models/AutomationPlaybook');
const AutomationPlaybookRevision = require('../../models/AutomationPlaybookRevision');

class PlaybookService {
  /**
   * Calculate SHA-256 content hash for steps
   */
  static computeStepsHash(steps) {
    return crypto.createHash('sha256').update(JSON.stringify(steps)).digest('hex');
  }

  /**
   * Create new playbook in DRAFT status
   */
  static async createPlaybook(playbookData, creatorUser, organizationId = null) {
    const playbookId = playbookData.playbookId || `PB-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const checksum = this.computeStepsHash(playbookData.steps || []);

    const playbook = await AutomationPlaybook.create({
      ...playbookData,
      playbookId,
      organizationId: playbookData.organizationId || organizationId,
      status: 'DRAFT',
      version: 1,
      checksum,
      approvedRevisionHash: null,
      createdBy: {
        userId: creatorUser?.userId || creatorUser?.id || 'SYSTEM',
        username: creatorUser?.username || 'system',
        role: creatorUser?.role || 'ADMIN'
      }
    });

    // Create initial revision snapshot v1
    await AutomationPlaybookRevision.create({
      playbookId: playbook.playbookId,
      organizationId: playbook.organizationId,
      version: 1,
      stepsSnapshot: playbook.steps,
      changeSummary: 'Initial playbook creation',
      changedBy: creatorUser?.username || 'system',
      contentHash: checksum
    });

    return playbook;
  }

  /**
   * Submit playbook for REVIEW
   */
  static async submitReview(playbookId, organizationId = null) {
    const query = { playbookId };
    if (organizationId) query.organizationId = organizationId;

    const playbook = await AutomationPlaybook.findOne(query);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    if (playbook.status !== 'DRAFT') {
      throw new Error(`Playbook ${playbookId} in status ${playbook.status} cannot be submitted for review`);
    }

    playbook.status = 'REVIEW';
    await playbook.save();
    return playbook;
  }

  /**
   * Approve playbook and bind approval to exact revision content hash
   */
  static async approvePlaybook(playbookId, approverUser, organizationId = null) {
    const query = { playbookId };
    if (organizationId) query.organizationId = organizationId;

    const playbook = await AutomationPlaybook.findOne(query);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    if (playbook.status !== 'REVIEW' && playbook.status !== 'DRAFT') {
      throw new Error(`Playbook ${playbookId} in status ${playbook.status} cannot be approved`);
    }

    const currentHash = this.computeStepsHash(playbook.steps);

    playbook.status = 'APPROVED';
    playbook.checksum = currentHash;
    playbook.approvedRevisionHash = currentHash;
    playbook.approvedBy = {
      userId: approverUser?.userId || approverUser?.id || 'ADMIN_USER',
      username: approverUser?.username || 'admin',
      role: approverUser?.role || 'ADMIN',
      approvedAt: new Date()
    };

    await playbook.save();
    return playbook;
  }

  /**
   * Activate playbook
   */
  static async activatePlaybook(playbookId, organizationId = null) {
    const query = { playbookId };
    if (organizationId) query.organizationId = organizationId;

    const playbook = await AutomationPlaybook.findOne(query);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    if (playbook.status !== 'APPROVED' && playbook.status !== 'DISABLED') {
      throw new Error(`Playbook ${playbookId} in status ${playbook.status} cannot be activated. Approval required.`);
    }

    // Verify stale approval check
    const currentHash = this.computeStepsHash(playbook.steps);
    if (playbook.approvedRevisionHash !== currentHash) {
      playbook.status = 'DRAFT';
      await playbook.save();
      throw new Error(`Stale approval detected for ${playbookId}. Content hash changed since approval.`);
    }

    playbook.status = 'ACTIVE';
    await playbook.save();
    return playbook;
  }

  /**
   * Revise playbook content (creates new version snapshot and resets status to DRAFT)
   */
  static async revisePlaybook(playbookId, updatedSteps, changeSummary, editorUser, organizationId = null) {
    const query = { playbookId };
    if (organizationId) query.organizationId = organizationId;

    const playbook = await AutomationPlaybook.findOne(query);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    const newVersion = playbook.version + 1;
    const newHash = this.computeStepsHash(updatedSteps);

    playbook.steps = updatedSteps;
    playbook.version = newVersion;
    playbook.checksum = newHash;
    playbook.status = 'DRAFT'; // Resets approval!
    playbook.approvedRevisionHash = null; // Clears approved revision hash!
    await playbook.save();

    await AutomationPlaybookRevision.create({
      playbookId: playbook.playbookId,
      organizationId: playbook.organizationId,
      version: newVersion,
      stepsSnapshot: updatedSteps,
      changeSummary: changeSummary || `Updated to version ${newVersion}`,
      changedBy: editorUser?.username || 'editor',
      contentHash: newHash
    });

    return playbook;
  }

  /**
   * Disable playbook
   */
  static async disablePlaybook(playbookId, organizationId = null) {
    const query = { playbookId };
    if (organizationId) query.organizationId = organizationId;

    const playbook = await AutomationPlaybook.findOne(query);
    if (!playbook) throw new Error(`Playbook ${playbookId} not found`);

    playbook.status = 'DISABLED';
    await playbook.save();
    return playbook;
  }

  /**
   * Retire playbook
   */
  static async retirePlaybook(playbookId, organizationId = null) {
    const query = { playbookId };
    if (organizationId) query.organizationId = organizationId;

    const playbook = await AutomationPlaybook.findOne(query);
    if (!playbook) throw new Error(`Playbook ${playbookId} not found`);

    playbook.status = 'RETIRED';
    await playbook.save();
    return playbook;
  }

  /**
   * Seed Canonical Automation Playbooks idempotently
   */
  static async seedCanonicalPlaybooks(organizationId = null) {
    const canonicals = [
      {
        playbookId: 'PB-GOV-AUTO-RESTORE-01',
        name: 'Governance Policy Restorer',
        description: 'Restores governance policies to approved baseline snapshots upon drift detection.',
        category: 'GOVERNANCE_DRIFT',
        requiredRole: 'ADMIN',
        approvalRequired: true,
        timeoutSeconds: 60,
        maxConcurrent: 5,
        steps: [
          {
            stepId: 'STEP-1',
            name: 'Verify Governance Policy Drift',
            actionType: 'RESTORE_GOVERNANCE_POLICY',
            targetEntity: 'GovernancePolicy',
            parameters: { restoreBaseline: true },
            onFailure: 'ROLLBACK'
          }
        ]
      },
      {
        playbookId: 'PB-DET-AUTO-ENABLE-01',
        name: 'Detection Rule Restorer',
        description: 'Re-enables approved detection rule revisions if illegally disabled.',
        category: 'DETECTION_TUNING',
        requiredRole: 'OPERATOR',
        approvalRequired: true,
        timeoutSeconds: 45,
        maxConcurrent: 5,
        steps: [
          {
            stepId: 'STEP-1',
            name: 'Enable Approved Detection Rule Revision',
            actionType: 'ENABLE_DETECTION_RULE_REVISION',
            targetEntity: 'DetectionRuleRevision',
            parameters: { autoEnable: true },
            onFailure: 'STOP'
          }
        ]
      },
      {
        playbookId: 'PB-INT-AUTO-REVOKE-01',
        name: 'Expired Integration Revoker',
        description: 'Revokes expired integration metadata credentials automatically.',
        category: 'INTEGRATION_MAINTENANCE',
        requiredRole: 'OPERATOR',
        approvalRequired: false,
        timeoutSeconds: 30,
        maxConcurrent: 10,
        steps: [
          {
            stepId: 'STEP-1',
            name: 'Revoke Expired Integration Metadata',
            actionType: 'REVOKE_EXPIRED_INTEGRATION',
            targetEntity: 'IntegrationMetadata',
            parameters: { markExpired: true },
            onFailure: 'STOP'
          }
        ]
      },
      {
        playbookId: 'PB-REL-AUTO-CHECK-01',
        name: 'Reliability Probe & Recovery',
        description: 'Triggers platform reliability probe and safe internal job restart.',
        category: 'RELIABILITY_RECOVERY',
        requiredRole: 'ADMIN',
        approvalRequired: true,
        timeoutSeconds: 90,
        maxConcurrent: 2,
        steps: [
          {
            stepId: 'STEP-1',
            name: 'Probe Subsystem Reliability',
            actionType: 'TRIGGER_RELIABILITY_HEALTH_CHECK',
            targetEntity: 'ServiceHealthSnapshot',
            parameters: { deepProbe: true },
            onFailure: 'CONTINUE'
          },
          {
            stepId: 'STEP-2',
            name: 'Restart Safe Internal Scheduler',
            actionType: 'RESTART_SAFE_INTERNAL_JOB',
            targetEntity: 'InternalScheduler',
            parameters: { jobName: 'report_scheduler' },
            onFailure: 'STOP'
          }
        ]
      }
    ];

    const seeded = [];
    for (const data of canonicals) {
      const existing = await AutomationPlaybook.findOne({ playbookId: data.playbookId });
      if (!existing) {
        const pb = await this.createPlaybook(data, { username: 'canonical_seeder', role: 'ADMIN' }, organizationId);
        await this.approvePlaybook(pb.playbookId, { username: 'canonical_approver', role: 'ADMIN' }, organizationId);
        await this.activatePlaybook(pb.playbookId, organizationId);
        seeded.push(pb.playbookId);
      }
    }

    return seeded;
  }
}

module.exports = PlaybookService;
