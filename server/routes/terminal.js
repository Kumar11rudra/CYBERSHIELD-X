const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const hostEnvironmentService = require('../services/HostEnvironmentService');
const terminalJobService = require('../services/TerminalJobService');
const TerminalHistory = require('../models/TerminalHistory');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');
const auditLogger = require('../utils/auditLogger');
const { getCanonicalToolsWithStatus } = require('../utils/canonicalTools');
const logger = require('../utils/logger');

/**
 * GET /api/terminal/host-capabilities
 * Returns live host OS, hardware resources, network interfaces, and detected binaries.
 */
router.get('/host-capabilities', tryAuthenticate, async (req, res) => {
  try {
    const forceRefresh = Boolean(req.query.refresh === 'true' || req.headers['x-force-refresh']);
    const capabilities = await hostEnvironmentService.getHostCapabilities(forceRefresh);
    res.json({
      success: true,
      data: capabilities
    });
  } catch (error) {
    logger.error('Failed to retrieve host capabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to inspect host capabilities',
      details: error.message
    });
  }
});

/**
 * GET /api/terminal/tool-health
 * Returns actual binary version, path, status, OS, architecture, compatibility, remediation info.
 */
router.get('/tool-health', tryAuthenticate, async (req, res) => {
  try {
    const health = await hostEnvironmentService.getToolHealth();
    const os = require('os');
    const availableCount = health.filter(h => h.status === 'INSTALLED' || h.status === 'AVAILABLE').length;
    const blockedCount = health.filter(h => h.status === 'MISSING' || h.status === 'BLOCKED').length;
    const outdatedCount = health.filter(h => h.status === 'OUTDATED').length;

    res.json({
      success: true,
      data: {
        os: { platform: os.platform(), arch: os.arch() },
        tools: health.map(h => ({
          ...h,
          binary: h.executable || h.toolId,
          detectedVersion: h.installedVersion,
          path: h.detectedPath,
          minSupportedVersion: h.minSupportedVersion,
          remediation: {
            explanation: `Tool '${h.executable}' is currently ${h.status}`,
            manualInstallGuide: h.installationMethod
          }
        })),
        totalAudited: health.length,
        availableCount,
        blockedCount,
        outdatedCount
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve tool health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to inspect tool health',
      details: error.message
    });
  }
});


/**
 * GET /api/terminal/dependencies
 * Returns grouped dependencies (AVAILABLE, BLOCKED, OUTDATED, UNSUPPORTED, etc.)
 */
router.get('/dependencies', tryAuthenticate, async (req, res) => {
  try {
    const data = await hostEnvironmentService.getDependenciesGrouped();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Failed to retrieve dependencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to inspect dependencies',
      details: error.message
    });
  }
});

/**
 * POST /api/terminal/remediate/:toolId
 * Safe remediation probe validation. Requires OPERATOR or ADMIN role.
 * NEVER executes arbitrary package manager strings, sh -c, or bash -c.
 */
router.post('/remediate/:toolId', authenticate, requireMinimumRole('operator'), async (req, res) => {
  const { toolId } = req.params;
  const user = req.user;

  try {
    const result = await hostEnvironmentService.validateDependencyProbe(toolId);

    // Audit log remediation action
    await auditLogger.log({
      actor: {
        id: user.id || user._id,
        email: user.email,
        role: user.role
      },
      action: 'DEPENDENCY_REMEDIATION',
      resource: {
        type: 'HOST_TOOL',
        id: toolId
      },
      outcome: result.success ? 'SUCCESS' : 'FAILURE',
      details: {
        probeResult: result
      }
    });

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error(`Remediation probe failed for ${toolId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/terminal/check-tool/:toolId
 * Checks whether a specific tool is executable natively or requires API engine/sandbox.
 */
router.get('/check-tool/:toolId', tryAuthenticate, async (req, res) => {
  try {
    const { toolId } = req.params;
    const capability = await hostEnvironmentService.checkToolCapability(toolId);
    res.json({
      success: true,
      data: capability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to check capability for ${req.params.toolId}`,
      details: error.message
    });
  }
});

/**
 * POST /api/terminal/execute-native
 * Executes an approved native host tool safely. Requires authentication.
 */
router.post('/execute-native', authenticate, async (req, res) => {
  try {
    const { tool, target, args, executionId } = req.body;

    if (!tool || typeof tool !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Tool name is required'
      });
    }

    if (!target || typeof target !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Target domain/IP/host is required'
      });
    }

    const userId = req.user?.id || req.user?._id || 'anonymous';
    const result = await hostEnvironmentService.executeNativeTool(tool, target, args, executionId, userId);

    // Record TerminalHistory asynchronously without blocking response
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      TerminalHistory.create({
        userId,
        command: `${tool} ${target} ${(args || []).join(' ')}`.trim(),
        tool,
        target,
        args: args || [],
        executionId: result.executionId,
        durationMs: result.durationMs || 0,
        exitCode: result.exitCode ?? (result.success ? 0 : 1)
      }).catch((histErr) => {
        logger.warn(`Failed to record terminal history: ${histErr.message}`);
      });
    }

    // Audit log
    await auditLogger.log({
      actor: {
        id: userId,
        email: req.user?.email || 'operator@cybershield.local',
        role: req.user?.role || 'operator'
      },
      action: 'TOOL_EXECUTION',
      resource: { type: 'HOST_TOOL', id: tool },
      outcome: result.success ? 'SUCCESS' : 'FAILURE',
      details: { target, durationMs: result.durationMs, executionId: result.executionId }
    });

    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.warn(`Native tool execution rejected: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message,
      executionTarget: 'HOST_NATIVE'
    });
  }
});

/**
 * POST /api/terminal/cancel
 * Cancels an active running host-native process safely. Requires authentication.
 */
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const { executionId } = req.body;
    if (!executionId || typeof executionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid executionId string is required to cancel process'
      });
    }

    const result = await hostEnvironmentService.cancelExecution(executionId, req.user);
    const statusCode = result.status === 'PERMISSION_DENIED' ? 403 : result.status === 'NOT_FOUND' ? 404 : 200;

    // Audit log cancellation
    if (result.success) {
      await auditLogger.log({
        actor: {
          id: req.user.id || req.user._id,
          email: req.user.email,
          role: req.user.role
        },
        action: 'TOOL_CANCELLATION',
        resource: { type: 'EXECUTION', id: executionId },
        outcome: 'SUCCESS',
        details: { result }
      });
    }

    res.status(statusCode).json({
      success: result.success,
      data: result
    });
  } catch (error) {
    logger.error('Failed to cancel native process:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel execution',
      details: error.message
    });
  }
});

/**
 * GET /api/terminal/history
 * Returns user's persistent command history (strictly isolated to req.user).
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = (req.user.id || req.user._id).toString();
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const filter = { userId };
    if (req.query.q) {
      filter.command = { $regex: req.query.q, $options: 'i' };
    }

    const total = await TerminalHistory.countDocuments(filter);
    const history = await TerminalHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch terminal history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch terminal history'
    });
  }
});

/**
 * DELETE /api/terminal/history
 * Clears user's persistent command history.
 */
router.delete('/history', authenticate, async (req, res) => {
  try {
    const userId = (req.user.id || req.user._id).toString();
    const result = await TerminalHistory.deleteMany({ userId });

    await auditLogger.log({
      actor: {
        id: userId,
        email: req.user.email,
        role: req.user.role
      },
      action: 'CLEAR_TERMINAL_HISTORY',
      resource: { type: 'TERMINAL_HISTORY', id: userId },
      outcome: 'SUCCESS',
      details: { deletedCount: result.deletedCount }
    });

    res.json({
      success: true,
      message: 'Command history cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    logger.error('Failed to clear terminal history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear command history'
    });
  }
});

/**
 * GET /api/terminal/autocomplete
 * Autocompletes only canonical capabilities.
 * Blocked tools appear as blocked.
 */
router.get('/autocomplete', tryAuthenticate, async (req, res) => {
  try {
    const query = (req.query.q || '').trim().toLowerCase();
    const tools = getCanonicalToolsWithStatus();

    const matches = tools
      .filter(t => {
        if (!query) return true;
        return (
          t.id.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
        );
      })
      .slice(0, 20)
      .map(t => ({
        tool: t.id,
        name: t.name,
        category: t.category,
        executionTarget: t.executionTarget,
        available: t.available,
        inputType: t.inputType,
        description: t.description
      }));

    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    logger.error('Failed to get autocomplete suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve autocomplete suggestions'
    });
  }
});

/**
 * GET /api/terminal/presets
 * Safe execution presets (WHOIS DOMAIN, DNS DOMAIN, SSL HOST, PORT HOST).
 */
router.get('/presets', tryAuthenticate, (req, res) => {
  const presets = [
    {
      id: 'whois-domain',
      label: 'WHOIS DOMAIN',
      tool: 'whois',
      target: 'example.com',
      description: 'Query domain registration and ownership records',
      executionTarget: 'HOST_NATIVE',
      category: 'Reconnaissance'
    },
    {
      id: 'dns-domain',
      label: 'DNS DOMAIN',
      tool: 'dns',
      target: 'google.com',
      description: 'Query authoritative DNS records via dig/DNS-engine',
      executionTarget: 'HOST_NATIVE',
      category: 'DNS & Network Intelligence'
    },
    {
      id: 'ssl-host',
      label: 'SSL HOST',
      tool: 'ssl',
      target: 'google.com',
      description: 'Inspect TLS certificate chain, cipher suites and expiration',
      executionTarget: 'HOST_NATIVE',
      category: 'Web Security'
    },
    {
      id: 'port-host',
      label: 'PORT HOST',
      tool: 'port',
      target: '127.0.0.1',
      description: 'Safe discovery scan for common listening ports',
      executionTarget: 'HOST_NATIVE',
      category: 'Vulnerability Assessment'
    },
    {
      id: 'http-head',
      label: 'HTTP HOST',
      tool: 'http',
      target: 'https://example.com',
      description: 'Fetch security headers and response status via curl/engine',
      executionTarget: 'HOST_NATIVE',
      category: 'Web Security'
    }
  ];

  res.json({
    success: true,
    data: presets
  });
});

/**
 * POST /api/terminal/jobs
 * Dispatch an asynchronous execution job.
 */
router.post('/jobs', authenticate, async (req, res) => {
  try {
    const { tool, target, args } = req.body;
    const io = req.app.get('io');

    const job = await terminalJobService.createJob({
      tool,
      target,
      args,
      user: req.user,
      customIO: io
    });

    res.status(202).json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.warn(`Failed to create terminal job: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/terminal/jobs
 * List jobs with role-aware isolation and pagination.
 */
router.get('/jobs', authenticate, (req, res) => {
  try {
    const { status, limit, page } = req.query;
    const result = terminalJobService.getJobs({
      user: req.user,
      status,
      limit: parseInt(limit) || 50,
      page: parseInt(page) || 1
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/terminal/jobs/:jobId
 * Retrieve single job.
 */
router.get('/jobs/:jobId', authenticate, (req, res) => {
  try {
    const job = terminalJobService.getJobById(req.params.jobId, req.user);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job ${req.params.jobId} not found`
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/terminal/jobs/:jobId/cancel
 * Cancel a running job.
 */
router.post('/jobs/:jobId/cancel', authenticate, async (req, res) => {
  try {
    const io = req.app.get('io');
    const result = await terminalJobService.cancelJob(req.params.jobId, req.user, io);
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/terminal/jobs/:jobId/retry
 * Retry a job with a brand new execution ID.
 */
router.post('/jobs/:jobId/retry', authenticate, async (req, res) => {
  try {
    const io = req.app.get('io');
    const result = await terminalJobService.retryJob(req.params.jobId, req.user, io);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
