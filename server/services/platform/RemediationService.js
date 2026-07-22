const RBACService = require('../org/RBACService');
const GenericDTO = require('../../models/dto/GenericDTO');
const Vulnerability = require('../../models/Vulnerability');

class RemediationService {
    static async getRemediation(orgId, userId, vulnId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const vuln = await Vulnerability.findOne({ _id: vulnId, organizationId: orgId });
        if (!vuln) throw new Error('Vulnerability not found');
        return new GenericDTO({ remediation: vuln.remediation || 'No remediation steps available.' });
    }
    static async getVulnerabilityFixes(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        return new GenericDTO({ fixes: [] });
    }
}
module.exports = RemediationService;
