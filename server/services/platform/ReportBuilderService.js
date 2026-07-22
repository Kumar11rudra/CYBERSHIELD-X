class ReportBuilderService {
    constructor(scanRepository, aiAnalysisRepository, assetRepository, vulnerabilityRepository) {
        this.scanRepository = scanRepository;
        this.aiAnalysisRepository = aiAnalysisRepository;
        this.assetRepository = assetRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
    }

    async buildReportData(scanId) {
        const scan = await this.scanRepository.findById(scanId);
        if (!scan) throw new Error('Scan not found');
        
        let aiAnalysis = null;
        if (this.aiAnalysisRepository.findByScanIdAndModel) {
            aiAnalysis = await this.aiAnalysisRepository.findByScanIdAndModel(scanId, 'llama3');
        }

        // Mocking vulnerability resolution for now to decouple
        return {
            scan,
            aiAnalysis,
            vulnerabilities: []
        };
    }
}
module.exports = ReportBuilderService;
