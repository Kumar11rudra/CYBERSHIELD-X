'use strict';

const fs = require('fs');
const ExecutiveReportEngine = require('../../../../server/csi/reports/ExecutiveReportEngine');
const ReportTemplateRegistry = require('../../../../server/csi/reports/ReportTemplateRegistry');

jest.mock('fs');

describe('ExecutiveReportEngine', () => {
    let engine;

    beforeEach(() => {
        ReportTemplateRegistry.initialized = false;
        ReportTemplateRegistry.templates = new Map();

        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue([
            'ExecutiveReport.md', 'ExecutiveReport.html', 'ExecutiveReport.json',
            'ExecutiveReport.sarif', 'ExecutiveReport.stix'
        ]);
        fs.readFileSync.mockReturnValue('template');

        engine = new ExecutiveReportEngine();
    });

    test('should orchestrate export bundle generation and not mutate input', () => {
        const findings = [{ deterministicSortKey: 'key2', findingId: 'f2' }, { deterministicSortKey: 'key1', findingId: 'f1' }];
        const riskResult = { overallScore: 50 };
        const correlationResult = { chains: [] };
        const reasoningResult = {
            executiveSummary: 'Sum',
            observations: ['Obs'],
            remediation: ['Rem']
        };

        const originalFindings = JSON.stringify(findings);

        const bundle = engine.execute(findings, riskResult, correlationResult, reasoningResult, 'exec1');

        expect(bundle.executionId).toBe('exec1');
        expect(bundle.markdown).toContain('template');
        expect(bundle.html).toContain('template');
        expect(bundle.json).toBeDefined();
        expect(bundle.sarif).toBeDefined();
        expect(bundle.stix).toBeDefined();
        
        expect(Object.isFrozen(bundle)).toBe(true);

        // Prove inputs are not mutated
        expect(JSON.stringify(findings)).toBe(originalFindings);
    });

    test('should reject missing input data', () => {
        expect(() => engine.execute(null, {}, {}, {}, 'exec1')).toThrow(/Invalid input parameters/);
    });
});
