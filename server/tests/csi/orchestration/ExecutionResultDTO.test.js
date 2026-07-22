'use strict';

const { ExecutionResultDTO } = require('../../../../server/csi/orchestration/ExecutionResultDTO');

describe('ExecutionResultDTO', () => {
    it('should recursively freeze all properties', () => {
        const dto = new ExecutionResultDTO({
            executionId: 'exec1',
            startedAt: 'start',
            finishedAt: 'end',
            durationMs: 100,
            findings: [{ findingId: 'f1', data: { a: 1 } }],
            evidence: [{ evidenceId: 'e1' }],
            risk: { score: 100 },
            correlation: { edges: [{ id: 'e1' }] },
            reasoning: { summary: 'test' },
            report: { sections: [] },
            exports: { json: '{}' },
            statistics: { count: 1 },
            health: { status: 'healthy', checks: { a: 'ok' } }
        });

        const checkFrozen = (obj) => {
            expect(Object.isFrozen(obj)).toBe(true);
        };

        checkFrozen(dto);
        checkFrozen(dto.findings);
        checkFrozen(dto.findings[0]);
        checkFrozen(dto.findings[0].data);
        checkFrozen(dto.evidence);
        checkFrozen(dto.evidence[0]);
        checkFrozen(dto.risk);
        checkFrozen(dto.correlation);
        checkFrozen(dto.correlation.edges);
        checkFrozen(dto.reasoning);
        checkFrozen(dto.report);
        checkFrozen(dto.report.sections);
        checkFrozen(dto.exports);
        checkFrozen(dto.statistics);
        checkFrozen(dto.health);
        checkFrozen(dto.health.checks);

        // Strict mode mutations throw TypeError
        expect(() => {
            'use strict';
            dto.executionId = 'new';
        }).toThrow(TypeError);

        expect(() => {
            'use strict';
            dto.findings.push({});
        }).toThrow(TypeError);

        expect(() => {
            'use strict';
            dto.findings[0].data.b = 2;
        }).toThrow(TypeError);

        expect(() => {
            'use strict';
            dto.correlation.edges.push({});
        }).toThrow(TypeError);

        expect(() => {
            'use strict';
            dto.health.status = 'degraded';
        }).toThrow(TypeError);
    });
});
