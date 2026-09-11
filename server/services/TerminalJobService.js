const crypto = require('crypto');
const hostEnvironmentService = require('./HostEnvironmentService');
const TerminalHistory = require('../models/TerminalHistory');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');

class TerminalJobService {
  constructor() {
    this.jobs = new Map(); // jobId -> Job object (in-memory fast cache & active job tracking)
    this.io = null;
    this.MAX_OUTPUT_BYTES = 512 * 1024; // 512 KB bound
  }

  setIO(ioInstance) {
    this.io = ioInstance;
  }

  _getIO(req) {
    if (this.io) return this.io;
    if (req && req.app && typeof req.app.get === 'function') {
      return req.app.get('io');
    }
    return null;
  }

  _broadcastStatus(job, eventName = 'job:status', customIO = null) {
    const io = customIO || this.io;
    if (!io) return;
    try {
      io.emit(eventName, {
        jobId: job.jobId,
        executionId: job.executionId,
        tool: job.tool,
        target: job.target,
        status: job.status,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        durationMs: job.durationMs,
        exitCode: job.exitCode,
        error: job.error,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.warn(`Failed to broadcast ${eventName}: ${err.message}`);
    }
  }

  /**
   * Create and enqueue a new async job
   */
  async createJob({ tool, target, args = [], user, customIO = null }) {
    if (!tool || typeof tool !== 'string') {
      throw new Error('Tool is required');
    }
    if (!target || typeof target !== 'string') {
      throw new Error('Target is required');
    }

    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const executionId = `exec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const ownerId = user?.id || user?._id || 'anonymous';
    const ownerEmail = user?.email || 'operator@cybershield.local';
    const ownerRole = user?.role || 'operator';

    const job = {
      jobId,
      executionId,
      owner: {
        id: ownerId.toString(),
        email: ownerEmail,
        role: ownerRole
      },
      tool: tool.trim(),
      target: target.trim(),
      args: Array.isArray(args) ? args : [],
      status: 'QUEUED',
      queuedAt: new Date(),
      startedAt: null,
      finishedAt: null,
      durationMs: 0,
      exitCode: null,
      output: '',
      error: null,
      resultReference: null,
      retryCount: 0,
      previousExecutionIds: []
    };

    this.jobs.set(jobId, job);
    this._broadcastStatus(job, 'job:status', customIO);

    // Asynchronously dispatch execution without blocking request
    setImmediate(() => {
      this._executeJob(jobId, customIO).catch(err => {
        logger.error(`Error in async job execution for ${jobId}:`, err);
      });
    });

    return job;
  }

  /**
   * Internal job execution lifecycle
   */
  async _executeJob(jobId, customIO = null) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    if (job.status === 'CANCELLING' || job.status === 'CANCELLED') {
      return;
    }

    job.status = 'RUNNING';
    job.startedAt = new Date();
    this._broadcastStatus(job, 'job:status', customIO);

    const startTime = Date.now();
    try {
      const result = await hostEnvironmentService.executeNativeTool(
        job.tool,
        job.target,
        job.args,
        job.executionId,
        job.owner.id
      );

      const durationMs = Date.now() - startTime;
      job.finishedAt = new Date();
      job.durationMs = durationMs;
      job.resultReference = result;
      job.exitCode = result.exitCode ?? (result.success ? 0 : 1);

      // Safe bound output
      const rawOut = (result.stdout || '') + (result.stderr ? `\n[STDERR]\n${result.stderr}` : '');
      job.output = rawOut.slice(0, this.MAX_OUTPUT_BYTES);

      if (job.status === 'CANCELLING') {
        job.status = 'CANCELLED';
      } else if (result.success) {
        job.status = 'COMPLETED';
      } else {
        job.status = 'FAILED';
        job.error = result.error || 'Execution failed';
      }
    } catch (err) {
      const durationMs = Date.now() - startTime;
      job.finishedAt = new Date();
      job.durationMs = durationMs;

      if (job.status === 'CANCELLING') {
        job.status = 'CANCELLED';
      } else if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('timed out')) {
        job.status = 'TIMEOUT';
        job.error = err.message;
      } else {
        job.status = 'FAILED';
        job.error = err.message;
      }
    }

    this._broadcastStatus(job, 'job:status', customIO);

    // Save to persistent TerminalHistory
    try {
      await TerminalHistory.create({
        userId: job.owner.id,
        command: `${job.tool} ${job.target} ${job.args.join(' ')}`.trim(),
        tool: job.tool,
        target: job.target,
        args: job.args,
        executionId: job.executionId,
        durationMs: job.durationMs,
        exitCode: job.exitCode ?? -1
      });
    } catch (histErr) {
      logger.warn(`Failed to record TerminalHistory for job ${jobId}: ${histErr.message}`);
    }

    // Record audit event
    try {
      await auditLogger.log({
        actor: {
          id: job.owner.id,
          email: job.owner.email,
          role: job.owner.role
        },
        action: 'JOB_EXECUTION',
        resource: {
          type: 'TERMINAL_JOB',
          id: job.jobId
        },
        outcome: job.status === 'COMPLETED' ? 'SUCCESS' : 'FAILURE',
        details: {
          tool: job.tool,
          target: job.target,
          status: job.status,
          durationMs: job.durationMs,
          executionId: job.executionId
        }
      });
    } catch (auditErr) {
      logger.warn(`Failed to record audit log for job ${jobId}: ${auditErr.message}`);
    }
  }

  /**
   * Cancel a running or queued job
   */
  async cancelJob(jobId, user, customIO = null) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const userId = (user?.id || user?._id || 'anonymous').toString();
    const userRole = (user?.role || 'viewer').toLowerCase();

    // Check ownership or privileged role (operator or admin)
    if (job.owner.id !== userId && !['operator', 'admin'].includes(userRole)) {
      const err = new Error('Permission denied: You do not own this job');
      err.status = 403;
      throw err;
    }

    if (['COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED'].includes(job.status)) {
      return { success: false, message: `Job is already in terminal state: ${job.status}`, job };
    }

    job.status = 'CANCELLING';
    this._broadcastStatus(job, 'job:status', customIO);

    try {
      const cancelResult = await hostEnvironmentService.cancelExecution(job.executionId, user);
      job.status = 'CANCELLED';
      job.finishedAt = new Date();
      job.error = 'Cancelled by operator';
      this._broadcastStatus(job, 'job:status', customIO);

      // Log audit
      await auditLogger.log({
        actor: {
          id: userId,
          email: user?.email || 'operator@cybershield.local',
          role: userRole
        },
        action: 'JOB_CANCELLATION',
        resource: { type: 'TERMINAL_JOB', id: job.jobId },
        outcome: 'SUCCESS',
        details: { executionId: job.executionId, cancelResult }
      });

      return { success: true, message: 'Job cancelled successfully', job };
    } catch (cancelErr) {
      job.status = 'CANCELLED';
      job.finishedAt = new Date();
      job.error = `Cancelled: ${cancelErr.message}`;
      this._broadcastStatus(job, 'job:status', customIO);
      return { success: true, message: 'Job cancelled with notice', job };
    }
  }

  /**
   * Retry a job: STRICT RULE: "Retry creates a new execution ID. Never reuse a process identity for a retry."
   */
  async retryJob(jobId, user, customIO = null) {
    const oldJob = this.jobs.get(jobId);
    if (!oldJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    const userId = (user?.id || user?._id || 'anonymous').toString();
    const userRole = (user?.role || 'viewer').toLowerCase();

    if (oldJob.owner.id !== userId && !['operator', 'admin'].includes(userRole)) {
      const err = new Error('Permission denied: You do not own this job');
      err.status = 403;
      throw err;
    }

    // Must be finished before retry
    if (['QUEUED', 'RUNNING', 'CANCELLING'].includes(oldJob.status)) {
      throw new Error(`Cannot retry job while it is in state: ${oldJob.status}`);
    }

    // Generate BRAND NEW execution identity
    const newExecutionId = `exec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    oldJob.previousExecutionIds.push(oldJob.executionId);
    oldJob.executionId = newExecutionId;
    oldJob.retryCount += 1;
    oldJob.status = 'QUEUED';
    oldJob.queuedAt = new Date();
    oldJob.startedAt = null;
    oldJob.finishedAt = null;
    oldJob.durationMs = 0;
    oldJob.exitCode = null;
    oldJob.error = null;
    oldJob.output = '';
    oldJob.resultReference = null;

    this._broadcastStatus(oldJob, 'job:status', customIO);

    setImmediate(() => {
      this._executeJob(jobId, customIO).catch(err => {
        logger.error(`Error in retry job execution for ${jobId}:`, err);
      });
    });

    return oldJob;
  }

  /**
   * Get job by ID with RBAC & ownership check
   */
  getJobById(jobId, user) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const userId = (user?.id || user?._id || 'anonymous').toString();
    const userRole = (user?.role || 'viewer').toLowerCase();

    if (job.owner.id !== userId && !['operator', 'admin'].includes(userRole)) {
      const err = new Error('Access denied: You do not own this job');
      err.status = 403;
      throw err;
    }
    return job;
  }

  /**
   * List jobs with pagination, filtering, and role isolation
   */
  getJobs({ user, status = null, limit = 50, page = 1 }) {
    const userId = (user?.id || user?._id || 'anonymous').toString();
    const userRole = (user?.role || 'viewer').toLowerCase();
    const isElevated = ['operator', 'admin'].includes(userRole);

    let allJobs = Array.from(this.jobs.values());

    // Non-elevated users can only see their own jobs
    if (!isElevated) {
      allJobs = allJobs.filter(j => j.owner.id === userId);
    }

    if (status) {
      allJobs = allJobs.filter(j => j.status.toUpperCase() === status.toUpperCase());
    }

    // Sort descending by queuedAt
    allJobs.sort((a, b) => new Date(b.queuedAt) - new Date(a.queuedAt));

    const total = allJobs.length;
    const startIndex = (page - 1) * limit;
    const paginated = allJobs.slice(startIndex, startIndex + limit);

    return {
      jobs: paginated,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
      }
    };
  }
}

// Export singleton instance
module.exports = new TerminalJobService();
