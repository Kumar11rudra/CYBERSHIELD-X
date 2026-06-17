const { generateRemediationPlan } = require('../services/remediationService');
const Vulnerability = require('../models/Vulnerability');

const getRemediation = async (req, res, next) => {
  try {
    const { cve } = req.query;
    if (!cve) {
      return res.status(400).json({ error: 'CVE query parameter is required' });
    }

    const contextInfo = req.query.context || '';
    const plan = await generateRemediationPlan(cve, contextInfo);
    return res.json(plan);
  } catch (err) {
    next(err);
  }
};

const getVulnerabilityFixes = async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    if (!orgId) return res.status(400).json({ error: 'Organization context is required' });

    const openVulns = await Vulnerability.find({
      organizationId: orgId,
      status: { $ne: 'Resolved' },
    }).populate('assetId', 'hostname');

    const fixes = [];
    for (const vuln of openVulns) {
      // Resolve plan
      const plan = await generateRemediationPlan(vuln.cve, vuln.description || '');
      fixes.push({
        vulnId: vuln._id,
        cve: vuln.cve,
        severity: vuln.severity,
        hostname: vuln.assetId?.hostname || 'Unknown Host',
        slaStatus: vuln.slaStatus,
        summary: plan.executiveSummary,
        fix: plan.recommendedFix,
        checklist: plan.verificationChecklist,
      });
    }

    return res.json(fixes);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRemediation,
  getVulnerabilityFixes,
};
