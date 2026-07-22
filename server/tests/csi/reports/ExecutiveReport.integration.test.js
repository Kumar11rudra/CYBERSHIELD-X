'use strict';

const fs = require('fs');
const ExecutiveReportEngine = require('../../../../server/csi/reports/ExecutiveReportEngine');
const ReportTemplateRegistry = require('../../../../server/csi/reports/ReportTemplateRegistry');

jest.mock('fs');

describe('ExecutiveReport Integration', () => {
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

    test('should execute E2E pipeline and generate valid bundle', () => {
        const engine = new ExecutiveReportEngine();

        const findings = [
            { findingId: 'f1', type: 'type1' },
            { findingId: 'f2', type: 'type2' }
        ];
        const riskResult = { overallScore: 75 };
        const correlationResult = { score: 100 };
        const reasoningResult = {
            executiveSummary: 'Sum',
            observations: ['Obs'],
            remediation: ['Rem']
        };

        const bundle = engine.execute(findings, riskResult, correlationResult, reasoningResult, 'exec1');

        expect(bundle.markdown).toBeDefined();
        expect(bundle.html).toBeDefined();
        expect(bundle.json).toBeDefined();
        expect(bundle.sarif).toBeDefined();
        expect(bundle.stix).toBeDefined();
        expect(bundle.executionId).toBe('exec1');

        expect(Object.isFrozen(bundle)).toBe(true);
    });
});
