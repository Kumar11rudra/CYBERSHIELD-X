const remediationService = require('../services/remediationService');
const Vulnerability = require('../models/Vulnerability');

exports.getRemediation = async (req, res) => {
  try {
    const { cve, context } = req.query;
    if (!cve) {
      return res.status(400).json({ success: false, error: 'cve parameter is required.' });
    }
    const plan = await remediationService.generateRemediationPlan(cve, context || '');
    return res.json(plan);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to generate remediation plan', detail: err.message });
  }
};

exports.getVulnerabilityFixes = async (req, res) => {
  try {
    const orgId = req.headers['x-organization-id'] || req.user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'Organization context is required.' });
    }

    const vulns = await Vulnerability.find({
      organizationId: orgId,
      status: { $in: ['Open', 'In Progress'] }
    }).populate('assetId');

    const fixes = vulns.map(v => {
      const cve = v.cve || 'N/A';
      const hostname = v.assetId?.name || v.assetId?.ipAddress || 'Unknown Host';
      
      return {
        vulnId: v._id.toString(),
        cve,
        hostname,
        summary: v.description || v.title,
        severity: v.severity,
        fix: v.metadata?.remediation || `1. Identify the software component mapping to ${cve}.\n2. Upgrade the service or library to the vendor's patched version.\n3. Configure default firewalls to isolate critical ports.`,
        checklist: v.metadata?.checklist || `- [ ] Verify the application of the package/system patch.\n- [ ] Execute an asset port scan to verify the service is secure.`
      };
    });

    return res.json(fixes);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to resolve active vulnerability fixes', detail: err.message });
  }
};
