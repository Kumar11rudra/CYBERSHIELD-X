class ReportExportService {
    constructor(reportBuilder, pdfRenderer) {
        this.reportBuilder = reportBuilder;
        this.pdfRenderer = pdfRenderer;
    }

    async exportToPdfStream(scanId, writeStream) {
        const reportData = await this.reportBuilder.buildReportData(scanId);
        this.pdfRenderer.renderStream(reportData, writeStream);
    }
}
module.exports = ReportExportService;
