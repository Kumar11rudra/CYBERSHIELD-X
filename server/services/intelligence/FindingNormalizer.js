const SecurityFindingDTO = require('./dto/SecurityFindingDTO');
const crypto = require('crypto');

class FindingNormalizer {
    /**
     * Converts raw provider findings inside a ScanResultDTO into uniform SecurityFindingDTO objects.
     * @param {import('../scanners/dto/ScanResultDTO')} scanResult
     * @returns {SecurityFindingDTO[]}
     */
    normalize(scanResult) {
        if (!scanResult || !Array.isArray(scanResult.findings)) {
            return [];
        }

        const scannerId = scanResult.scannerId;
        const target = scanResult.target;

        return scanResult.findings.map(rawFinding => {
            const id = crypto.randomUUID();
            let type = 'information';
            let title = rawFinding.description || 'Unknown Finding';
            let description = rawFinding.output || '';
            let metadata = { ...rawFinding };

            // Very basic heuristic classification
            if (rawFinding.port) {
                type = 'port';
                title = `Open Port: ${rawFinding.port}`;
            }
            if (rawFinding.vulnerability) {
                type = 'vulnerability';
                title = `Vulnerability: ${rawFinding.vulnerability}`;
            }

            return new SecurityFindingDTO({
                id,
                scannerId,
                type,
                title,
                description,
                target,
                metadata
            });
        });
    }
}

module.exports = FindingNormalizer;
