const remediationService = require('../services/remediationService');
const Vulnerability = require('../models/Vulnerability');
const Scan = require('../models/Scan');
const logger = require('../utils/logger');

/**
 * Generate or retrieve an AI remediation plan for a specific CVE
 * Supports optional scan ownership IDOR verification
 */
exports.getRemediation = async (req, res) => {
  try {
    const { cve, context, scanId, vulnId } = req.query;

    if (!cve || typeof cve !== 'string' || !cve.trim()) {
      return res.status(400).json({ success: false, error: 'cve parameter is required.' });
    }

    const normalizedCve = cve.trim().toUpperCase();

    // IDOR check if scanId is provided
    if (scanId) {
      try {
        const scan = await Scan.findById(scanId);
        if (scan) {
          const userRole = req.user?.role;
          const userId = req.user?._id?.toString();
          const isOwner = scan.userId && scan.userId.toString() === userId;
          const isAdmin = ['admin', 'superadmin', 'SOC_ADMIN', 'SOC_MANAGER'].includes(userRole);
          const isPublic = scan.visibility === 'public' || scan.isPublic === true;

          if (!isOwner && !isAdmin && !isPublic) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden. You do not have permission to access remediation for this scan.'
            });
          }
        }
      } catch (scanErr) {
        logger.warn(`[REMEDIATION] Scan IDOR check error: ${scanErr.message}`);
      }
    }

    // IDOR check if vulnId is provided
    if (vulnId) {
      try {
        const vuln = await Vulnerability.findById(vulnId);
        if (vuln) {
          const userRole = req.user?.role;
          const userId = req.user?._id?.toString();
          const isOwner = vuln.userId && vuln.userId.toString() === userId;
          const isOrgMatch = req.organizationId && vuln.organizationId && vuln.organizationId.toString() === req.organizationId.toString();
          const isAdmin = ['admin', 'superadmin', 'SOC_ADMIN', 'SOC_MANAGER'].includes(userRole);

          if (!isOwner && !isOrgMatch && !isAdmin) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden. You do not have permission to access remediation for this vulnerability.'
            });
          }
        }
      } catch (vulnErr) {
        logger.warn(`[REMEDIATION] Vuln IDOR check error: ${vulnErr.message}`);
      }
    }

    const plan = await remediationService.generateRemediationPlan(normalizedCve, context || '');
    return res.json({
      success: true,
      cve: normalizedCve,
      ...plan
    });
  } catch (err) {
    logger.error(`[REMEDIATION] Error generating remediation: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate remediation plan',
      detail: err.message
    });
  }
};

/**
 * Retrieve active vulnerability fixes scoped to organization or user context
 */
exports.getVulnerabilityFixes = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'] || req.organizationId || req.user?.organizationId;
    const userId = req.user?._id;

    // Scope query to organization if provided, otherwise personal user context
    const query = orgId
      ? { organizationId: orgId, status: { $in: ['Open', 'In Progress'] } }
      : { userId: userId, status: { $in: ['Open', 'In Progress'] } };

    const vulns = await Vulnerability.find(query).populate('assetId').limit(100);

    const fixes = vulns.map(v => {
      const cve = v.cve || 'N/A';
      const hostname = v.assetId?.name || v.assetId?.ipAddress || 'Infrastructure Host';

      return {
        vulnId: v._id.toString(),
        cve,
        hostname,
        summary: v.description || v.title || 'Identified Security Finding',
        severity: v.severity || 'Medium',
        fix: v.metadata?.remediation || `1. Identify the software component mapping to ${cve}.\n2. Upgrade the service or library to the vendor's patched version.\n3. Configure default firewalls to isolate critical ports.`,
        checklist: v.metadata?.checklist || `- [ ] Verify the application of the package/system patch.\n- [ ] Execute an asset port scan to verify the service is secure.`
      };
    });

    return res.json(fixes);
  } catch (err) {
    logger.error(`[REMEDIATION] Error resolving vulnerability fixes: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve active vulnerability fixes',
      detail: err.message
    });
  }
};
