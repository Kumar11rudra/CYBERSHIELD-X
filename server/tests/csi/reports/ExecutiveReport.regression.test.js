'use strict';

const fs = require('fs');
const ExecutiveReportEngine = require('../../../../server/csi/reports/ExecutiveReportEngine');
const ReportTemplateRegistry = require('../../../../server/csi/reports/ReportTemplateRegistry');

jest.mock('fs');

describe('ExecutiveReport Regression', () => {
    beforeAll(() => {
        ReportTemplateRegistry.initialized = false;
        ReportTemplateRegistry.templates = new Map();

        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue([
            'ExecutiveReport.md', 'ExecutiveReport.html', 'ExecutiveReport.json',
            'ExecutiveReport.sarif', 'ExecutiveReport.stix'
        ]);
        fs.readFileSync.mockReturnValue('template');
    });

    test('should generate byte-identical output across 100 consecutive executions', () => {
        const engine = new ExecutiveReportEngine();

        const findings = [
            { findingId: 'f2' },
            { findingId: 'f1' }
        ];
        const riskResult = { overallScore: 75 };
        const correlationResult = { score: 100 };
        const reasoningResult = {
            executiveSummary: 'Sum',
            observations: ['Obs'],
            remediation: ['Rem']
        };

        let baseline = null;

        for (let i = 0; i < 100; i++) {
            const bundle = engine.execute(findings, riskResult, correlationResult, reasoningResult, 'exec1');

            // Strip timestamp from bundle since it varies
            const serialized = JSON.stringify(bundle);
            const parsed = JSON.parse(serialized);
            delete parsed.timestamp;

            // Also strip timestamp from inner JSON exporter if any
            const parsedJson = JSON.parse(parsed.json);
            delete parsedJson.timestamp;
            parsed.json = JSON.stringify(parsedJson, null, 2);

            if (i === 0) {
                baseline = parsed;
                // Verify ordering happened
                expect(baseline.markdown.indexOf('f1')).toBeLessThan(baseline.markdown.indexOf('f2'));
            } else {
                expect(parsed).toEqual(baseline);
            }
        }
    });
});
