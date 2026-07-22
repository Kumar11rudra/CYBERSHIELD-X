const ReportService = require('../services/platform/ReportService');

const getOrgId = (req) => {
    const orgId = req.params.orgId || req.query.orgId || req.headers['x-organization-id'];
    if (!orgId) throw new Error('organizationId is required');
    return orgId;
};

exports.generatePdfReport = async (req, res, next) => {
    try {
        const result = await ReportService.generatePdfReport(getOrgId(req), req.user._id, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
