const crypto = require('crypto');
const mongoose = require('mongoose');
const IntegrationConfig = require('../../models/IntegrationConfig');
const IntegrationDTO = require('../../models/dto/IntegrationDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');
const logger = require('../../utils/logger');

class IntegrationService {
    static async getIntegrations(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const qb = new QueryBuilder(IntegrationConfig, query)
            .tenant(orgId)
            .filter(['type', 'status'])
            .paginate()
            .sortBy(['createdAt']);

        const { data, pagination } = await qb.execute();
        return {
            data: data.map(i => new IntegrationDTO(i)),
            pagination
        };
    }

    static async createIntegration(orgId, userId, data) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const integration = new IntegrationConfig({ ...data, organizationId: orgId });
        await integration.save();
        return new IntegrationDTO(integration);
    }

    static async updateIntegration(orgId, userId, id, data) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const integration = await IntegrationConfig.findOneAndUpdate({ _id: id, organizationId: orgId }, data, { new: true });
        if (!integration) {
            const err = new Error('Integration not found');
            err.status = 404;
            throw err;
        }
        return new IntegrationDTO(integration);
    }

    static async deleteIntegration(orgId, userId, id) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const result = await IntegrationConfig.findOneAndDelete({ _id: id, organizationId: orgId });
        if (!result) {
            const err = new Error('Integration not found');
            err.status = 404;
            throw err;
        }
        return { success: true };
    }

    /**
     * Executes real connector testConnection() for the targeted IntegrationConfig.
     * Enforces authoritative tenant isolation, credential protection, and sanitized responses.
     *
     * @param {string} orgId - Authoritative organization ID
     * @param {string} userId - Requesting user ID
     * @param {string} id - IntegrationConfig ID
     * @returns {Promise<object>} Normalized test result { success, message, latencyMs, testedAt }
     */
    static async testIntegration(orgId, userId, id) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            const err = new Error('Invalid integration identifier');
            err.status = 400;
            err.code = 'INVALID_INTEGRATION_ID';
            throw err;
        }

        const startTime = Date.now();

        // Authoritative tenant scoping: integration must belong to the active orgId
        const config = await IntegrationConfig.findOne({ _id: id, organizationId: orgId });

        if (!config) {
            // Check if foreign config exists to distinguish 403 cross-tenant vs 404 nonexistent
            const foreignConfig = await IntegrationConfig.findById(id);
            if (foreignConfig && orgId && foreignConfig.organizationId.toString() !== orgId.toString()) {
                const err = new Error('Tenant isolation violation: Integration belongs to another organization');
                err.status = 403;
                err.code = 'TENANT_MISMATCH';
                throw err;
            }
            const err = new Error('Integration not found');
            err.status = 404;
            err.code = 'INTEGRATION_NOT_FOUND';
            throw err;
        }

        // Inactive integration check -> safe failure without external network calls
        if (!config.active) {
            const testedAt = new Date();
            config.healthStatus = 'Failed';
            config.lastTestedAt = testedAt;
            config.lastTestStatus = 'failed';
            config.lastError = `Integration '${config.name}' is inactive.`;
            config.lastFailureAt = testedAt;
            await config.save();

            return {
                success: false,
                message: `Integration '${config.name}' is inactive.`,
                status: 'INACTIVE',
                healthStatus: 'Failed',
                latencyMs: Date.now() - startTime,
                testedAt: testedAt.toISOString(),
                provider: config.type,
                integrationId: config._id.toString(),
            };
        }

        // Provider connector resolution and execution
        const providerUpper = String(config.type || '').toUpperCase();
        let testSuccess = false;
        let testMessage = '';
        let sanitizedError = null;
        let rawResult = null;

        try {
            if (['JIRA', 'SERVICENOW', 'PAGERDUTY'].includes(providerUpper)) {
                // Reuses canonical OutboundDispatchService and its approved CONNECTOR_REGISTRY
                const OutboundDispatchService = require('../soc/OutboundDispatchService');
                const jobData = {
                    jobId: crypto.randomUUID(),
                    organizationId: config.organizationId.toString(),
                    integrationId: config._id.toString(),
                    provider: providerUpper,
                    operation: 'TEST',
                    payload: {},
                    attempt: 1,
                };

                const dispatchRes = await Promise.race([
                    OutboundDispatchService.processJob(jobData),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Connection test timed out after 10 seconds')), 10000))
                ]);

                if (dispatchRes && dispatchRes.success) {
                    testSuccess = true;
                    rawResult = dispatchRes.result;
                    testMessage = `Connection test to ${config.type} succeeded.`;
                } else {
                    testSuccess = false;
                    rawResult = dispatchRes;
                    testMessage = dispatchRes?.result?.error?.message || dispatchRes?.reason || `Connection test to ${config.type} failed.`;
                    sanitizedError = testMessage;
                }
            } else if (['GITHUB', 'SLACK', 'TEAMS', 'WEBHOOK'].includes(providerUpper)) {
                // Extended canonical notification & webhook providers
                const { testIntegrationConnection } = require('../../integrations/integrationService');
                const connRes = await Promise.race([
                    testIntegrationConnection(config.type, config.config, config._id),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Connection test timed out after 10 seconds')), 10000))
                ]);

                if (connRes && connRes.success) {
                    testSuccess = true;
                    rawResult = connRes.result;
                    testMessage = `Connection test to ${config.type} succeeded.`;
                } else {
                    testSuccess = false;
                    testMessage = connRes?.error || `Connection test to ${config.type} failed.`;
                    sanitizedError = testMessage;
                }
            } else {
                return {
                    success: false,
                    message: `Unsupported integration provider: ${config.type}`,
                    status: 'UNSUPPORTED_PROVIDER',
                    healthStatus: 'Failed',
                    latencyMs: Date.now() - startTime,
                    testedAt: new Date().toISOString(),
                    provider: config.type,
                    integrationId: config._id.toString(),
                };
            }
        } catch (execErr) {
            const { sanitizeError } = require('../../integrations/connectorUtils');
            const sanitized = sanitizeError(execErr, providerUpper);
            testSuccess = false;
            testMessage = sanitized.message || 'Connection test failed';
            sanitizedError = testMessage;
        }

        // Update health status and audit timestamps on IntegrationConfig
        const testedAt = new Date();
        const latencyMs = Date.now() - startTime;
        config.healthStatus = testSuccess ? 'Healthy' : 'Failed';
        config.lastTestedAt = testedAt;
        config.lastTestStatus = testSuccess ? 'success' : 'failed';
        if (testSuccess) {
            config.lastSuccessAt = testedAt;
            config.lastError = '';
        } else {
            config.lastFailureAt = testedAt;
            config.lastError = sanitizedError || 'Connection test failed';
        }
        await config.save();

        return {
            success: testSuccess,
            message: testMessage,
            latencyMs,
            testedAt: testedAt.toISOString(),
            provider: config.type,
            integrationId: config._id.toString(),
            healthStatus: config.healthStatus,
            result: rawResult || undefined,
        };
    }
}
module.exports = IntegrationService;
