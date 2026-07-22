const AIAnalysis = require('../../models/AIAnalysis');
const AIAnalysisDTO = require('../../models/dto/AIAnalysisDTO');

class AIAnalysisRepository {
    async findByScanIdAndModel(scanId, model) {
        const doc = await AIAnalysis.findOne({ scanId, model });
        if (!doc) return null;
        return new AIAnalysisDTO(doc.toObject());
    }

    async save(dto) {
        const doc = await AIAnalysis.create({
            scanId: dto.scanId,
            model: dto.model,
            executiveSummary: dto.executiveSummary,
            findings: dto.findings,
            recommendations: dto.recommendations,
            remediationPlan: dto.remediationPlan
        });
        return new AIAnalysisDTO(doc.toObject());
    }
}

module.exports = AIAnalysisRepository;
