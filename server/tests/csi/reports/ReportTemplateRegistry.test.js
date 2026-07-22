'use strict';

const fs = require('fs');
const ReportTemplateRegistry = require('../../../../server/csi/reports/ReportTemplateRegistry');

jest.mock('fs');

describe('ReportTemplateRegistry', () => {
    beforeEach(() => {
        ReportTemplateRegistry.initialized = false;
        ReportTemplateRegistry.templates = new Map();
        jest.clearAllMocks();
    });

    test('should initialize successfully', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['ExecutiveReport.md', 'ExecutiveReport.html']);
        fs.readFileSync.mockImplementation((path) => {
            if (path.endsWith('.md')) return '# Markdown';
            return '<html>';
        });

        expect(() => ReportTemplateRegistry.initialize()).not.toThrow();
        expect(ReportTemplateRegistry.getTemplate('ExecutiveReport.md').content).toBe('# Markdown');
    });

    test('should fail-fast if directory is missing', () => {
        fs.existsSync.mockReturnValue(false);
        expect(() => ReportTemplateRegistry.initialize()).toThrow(/Base directory not found/);
    });

    test('should detect duplicate templates', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['ExecutiveReport.md', 'ExecutiveReport.md']);
        fs.readFileSync.mockReturnValue('content');

        expect(() => ReportTemplateRegistry.initialize()).toThrow(/Duplicate template detected/);
    });

    test('should calculate deterministic checksum', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['ExecutiveReport.md']);
        fs.readFileSync.mockReturnValue('content');

        ReportTemplateRegistry.initialize();
        const t1 = ReportTemplateRegistry.getTemplate('ExecutiveReport.md');
        expect(t1.checksum).toBeDefined();

        ReportTemplateRegistry.initialized = false;
        ReportTemplateRegistry.templates = new Map();
        ReportTemplateRegistry.initialize();
        const t2 = ReportTemplateRegistry.getTemplate('ExecutiveReport.md');
        expect(t1.checksum).toBe(t2.checksum);
    });

    test('should throw on missing template request', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue([]);
        ReportTemplateRegistry.initialize();

        expect(() => ReportTemplateRegistry.getTemplate('missing.md')).toThrow(/Template not found/);
    });
});
