const { getSecurityModule } = require('../services/securityComposition');

const performScan = async (req, res, next) => {
    try {
        const { scanService } = getSecurityModule();
        const { target } = req.body;
        
        const scanResponse = await scanService.performScan(
            req.user._id,
            req.ip,
            req.get('User-Agent'),
            target
        );

        res.json({
            success: true,
            scan: scanResponse,
        });
    } catch (error) {
        if (error.message.includes('Invalid target')) {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

const verifyScanSignature = async (req, res) => {
    try {
        const { scanService } = getSecurityModule();
        const { scanId, target, threatScore, riskLevel, signature } = req.body;
        
        scanService.verifyScanSignature(scanId, target, threatScore, riskLevel, signature);
        
        return res.json({ valid: true, message: 'Scan report integrity verified. No tampering detected.' });
    } catch (error) {
        if (error.message.includes('TAMPER DETECTED') || error.message.includes('Missing') || error.message.includes('Invalid')) {
            return res.status(400).json({ valid: false, error: error.message });
        }
        if (error.message.includes('configured')) {
            return res.status(503).json({ error: error.message });
        }
        res.status(500).json({ error: 'Verification failed' });
    }
};

module.exports = { performScan, verifyScanSignature };
