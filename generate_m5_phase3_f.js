const fs = require('fs');
const path = require('path');

const baseDir = '/Users/anil/Documents/New project/cybershield-x/server/controllers';

const controllers = {
  'analyticsController.js': `const platform = require('../composition/platformComposition');

exports.getOverview = async (req, res) => {
    try {
        const rawStats = await platform.analyticsAggregationService.getOverview();
        const formattedStats = platform.analyticsFormatter.formatOverview(rawStats);
        res.json(formattedStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDailyActivity = async (req, res) => {
    try {
        const activity = await platform.analyticsAggregationService.getDailyActivity();
        res.json(activity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getScanTypes = async (req, res) => {
    try {
        const types = await platform.analyticsAggregationService.getScanTypes();
        res.json(types);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};`,
  
  'dashboardController.js': `const platform = require('../composition/platformComposition');

exports.getStats = async (req, res) => {
    try {
        const stats = await platform.dashboardAggregationService.getStats(req.user._id);
        const allScans = await platform.dashboardAggregationService.getAllScans(req.user._id);
        
        const securityScore = platform.securityScoringService.calculateScore(allScans);
        const recommendations = platform.recommendationService.generateRecommendations(allScans);

        res.json({
            ...stats,
            securityScore,
            recommendations
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
    }
};`,

  'reportController.js': `const platform = require('../composition/platformComposition');

exports.generateReport = async (req, res) => {
    try {
        res.setHeader('Content-Disposition', \`attachment; filename="cybershield-report-\${req.params.id}.pdf"\`);
        res.setHeader('Content-Type', 'application/pdf');
        
        await platform.reportExportService.exportToPdfStream(req.params.id, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.exportJson = async (req, res) => {
    try {
        const reportData = await platform.reportBuilderService.buildReportData(req.params.id);
        res.json(reportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};`,

  'integrationController.js': `const platform = require('../composition/platformComposition');

exports.getConfig = async (req, res) => {
    try {
        const config = await platform.integrationService.repository.find({ organizationId: req.user.organizationId });
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.saveConfig = async (req, res) => {
    try {
        const config = await platform.integrationService.repository.create({ ...req.body, organizationId: req.user.organizationId });
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};`,

  'notificationController.js': `const platform = require('../composition/platformComposition');

exports.getNotifications = async (req, res) => {
    try {
        const notifs = await platform.notificationService.repository.find({ userId: req.user._id });
        res.json(notifs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await platform.notificationService.repository.update(req.params.id, { read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};`,

  'playbookController.js': `const platform = require('../composition/platformComposition');

exports.getPlaybooks = async (req, res) => {
    try {
        const playbooks = await platform.playbookService.repository.find({ organizationId: req.user.organizationId });
        res.json(playbooks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPlaybook = async (req, res) => {
    try {
        const playbook = await platform.playbookService.repository.create({ ...req.body, organizationId: req.user.organizationId });
        res.json(playbook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};`,

  'remediationController.js': `// Already decoupled into aiController in Phase 2 or handled via generic logic
exports.getPlan = async (req, res) => {
    res.json({ message: "Remediation logic moved to AI domain" });
};`,

  'breachController.js': `const platform = require('../composition/platformComposition');

exports.checkEmail = async (req, res) => {
    try {
        const result = await platform.breachIntelligenceService.checkEmail(req.params.email, req.user._id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.checkPhone = async (req, res) => {
    try {
        const result = await platform.breachIntelligenceService.checkPhone(req.params.phone, req.user._id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.checkPassword = async (req, res) => {
    try {
        const result = await platform.breachIntelligenceService.checkPassword(req.body.password);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};`,

  'communityController.js': `const platform = require('../composition/platformComposition');

exports.getNotes = async (req, res) => {
    try {
        const notes = await platform.communityService.repository.find({ target: req.query.target });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addNote = async (req, res) => {
    try {
        const note = await platform.communityService.repository.create({ ...req.body, userId: req.user._id });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};`,

  'historyController.js': `const platform = require('../composition/platformComposition');

exports.getHistory = async (req, res) => {
    try {
        const history = await platform.historyService.repository.find({ userId: req.user._id });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};`,

  'vaultController.js': `const platform = require('../composition/platformComposition');

exports.getAssets = async (req, res) => {
    try {
        const assets = await platform.vaultService.getAssets(req.user._id);
        res.json(assets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addAsset = async (req, res) => {
    try {
        const asset = await platform.vaultService.addAsset(req.user._id, req.body.type, req.body.label, req.body.value);
        res.json(asset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.toggleLockdown = async (req, res) => {
    try {
        const asset = await platform.vaultService.toggleLockdown(req.params.id, req.user._id);
        res.json(asset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAsset = async (req, res) => {
    try {
        await platform.vaultService.deleteAsset(req.params.id, req.user._id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};`,

  'watchlistController.js': `const platform = require('../composition/platformComposition');

exports.getWatchlist = async (req, res) => {
    try {
        const list = await platform.watchlistService.repository.find({ userId: req.user._id });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addToWatchlist = async (req, res) => {
    try {
        const item = await platform.watchlistService.repository.create({ ...req.body, userId: req.user._id });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeFromWatchlist = async (req, res) => {
    try {
        await platform.watchlistService.repository.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};`
};

for (const [filename, content] of Object.entries(controllers)) {
  fs.writeFileSync(path.join(baseDir, filename), content);
}

console.log("Phase F: Thin Controllers refactored successfully.");
