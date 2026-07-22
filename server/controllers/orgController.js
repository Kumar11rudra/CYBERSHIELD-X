const orgService = require('../services/org/OrganizationService');

exports.createOrg = async (req, res, next) => {
    try {
        const org = await orgService.createOrganization(req.user._id, req.body);
        res.status(201).json({ success: true, organization: org });
    } catch (err) { next(err); }
};

exports.getOrganizations = async (req, res, next) => {
    try {
        // Alias for admin to get all orgs vs get user orgs, for simplicity we use getUserOrgs logic here
        // or just map both to getUserOrganizations if it's the primary list.
        const orgs = await orgService.getUserOrganizations(req.user._id);
        res.json({ organizations: orgs });
    } catch (err) { next(err); }
};

exports.getUserOrgs = exports.getOrganizations; // alias

exports.getOrgDetails = async (req, res, next) => {
    try {
        const org = await orgService.getOrganization(req.params.orgId, req.user._id);
        res.json({ organization: org });
    } catch (err) { next(err); }
};

exports.updateOrgSettings = async (req, res, next) => {
    try {
        const org = await orgService.updateOrganization(req.params.orgId, req.user._id, req.body);
        res.json({ success: true, organization: org });
    } catch (err) { next(err); }
};

exports.deleteOrganization = async (req, res, next) => {
    try {
        const result = await orgService.deleteOrganization(req.params.orgId, req.user._id);
        res.json(result);
    } catch (err) { next(err); }
};

exports.inviteMember = async (req, res, next) => {
    try {
        const invite = await orgService.inviteMember(req.params.orgId, req.user._id, req.body.email, req.body.role);
        res.status(201).json({ success: true, invitation: invite });
    } catch (err) { next(err); }
};

exports.addOrgMember = exports.inviteMember; // Alias if they were expecting addMember

exports.removeOrgMember = async (req, res, next) => {
    try {
        const result = await orgService.removeMember(req.params.orgId, req.user._id, req.params.userId);
        res.json(result);
    } catch (err) { next(err); }
};

exports.updateMemberRole = async (req, res, next) => {
    try {
        const result = await orgService.updateMemberRole(req.params.orgId, req.user._id, req.params.userId, req.body.role);
        res.json({ success: true, membership: result });
    } catch (err) { next(err); }
};

exports.createTeam = async (req, res, next) => {
    try {
        const team = await orgService.createTeam(req.params.orgId, req.user._id, req.body);
        res.status(201).json({ success: true, team });
    } catch (err) { next(err); }
};

exports.listTeams = async (req, res, next) => {
    try {
        const result = await orgService.listTeams(req.params.orgId, req.user._id, req.query);
        res.json(result);
    } catch (err) { next(err); }
};

exports.updateTeam = async (req, res, next) => {
    try {
        const team = await orgService.updateTeam(req.params.orgId, req.params.teamId, req.user._id, req.body);
        res.json({ success: true, team });
    } catch (err) { next(err); }
};

exports.deleteTeam = async (req, res, next) => {
    try {
        const result = await orgService.deleteTeam(req.params.orgId, req.params.teamId, req.user._id);
        res.json(result);
    } catch (err) { next(err); }
};

exports.createWebhook = async (req, res, next) => {
    try {
        const webhook = await orgService.createWebhook(req.params.orgId, req.user._id, req.body);
        res.status(201).json({ success: true, webhook });
    } catch (err) { next(err); }
};

exports.listWebhooks = async (req, res, next) => {
    try {
        const result = await orgService.listWebhooks(req.params.orgId, req.user._id, req.query);
        res.json(result);
    } catch (err) { next(err); }
};

exports.updateWebhook = async (req, res, next) => {
    try {
        const webhook = await orgService.updateWebhook(req.params.orgId, req.params.webhookId, req.user._id, req.body);
        res.json({ success: true, webhook });
    } catch (err) { next(err); }
};

exports.deleteWebhook = async (req, res, next) => {
    try {
        const result = await orgService.deleteWebhook(req.params.orgId, req.params.webhookId, req.user._id);
        res.json(result);
    } catch (err) { next(err); }
};
