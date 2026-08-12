const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const ReportService = require('../services/platform/ReportService');

exports.generatePdfReport = async (req, res, next) => {
    try {
        const { scanId } = req.params;
        if (!scanId || !mongoose.Types.ObjectId.isValid(scanId)) {
            return res.status(400).json({ error: 'Invalid scan identifier format' });
        }

        const scan = await Scan.findById(scanId);
        if (!scan) {
            return res.status(404).json({ error: 'Scan report not found' });
        }

        // Enforce strict ownership / IDOR check
        // If scan is associated with a user, check matching owner
        const requesterId = req.user.id || req.user._id;
        if (scan.userId && scan.userId.toString() !== requesterId.toString()) {
            return res.status(403).json({ error: 'You are not authorized to download this report.' });
        }

        // Call report service using metadata derived entirely server-side
        const result = await ReportService.generatePdfReport(scan.organizationId, requesterId, { scanId });
        res.json(result);
    } catch (error) {
        next(error);
    }
};
