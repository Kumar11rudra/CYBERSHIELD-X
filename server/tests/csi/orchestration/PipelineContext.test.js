'use strict';

const { PipelineContext } = require('../../../../server/csi/orchestration/PipelineContext');
const { TargetDTO } = require('../../../../server/csi/dtos/TargetDTO');

describe('PipelineContext', () => {
    it('should deeply freeze the context and require fields', () => {
        expect(() => new PipelineContext({})).toThrow();
        const target = new TargetDTO({ rawInput: 'example.com', normalized: 'example.com', type: 'domain' });
        const ctx = new PipelineContext({ 
            executionId: '123', 
            target,
            configuration: { active: true },
            startedAt: 'start'
        });

        expect(Object.isFrozen(ctx)).toBe(true);
        expect(Object.isFrozen(ctx.target)).toBe(true);
        expect(Object.isFrozen(ctx.configuration)).toBe(true);

        expect(() => {
            'use strict';
            ctx.executionId = '456'; 
        }).toThrow(TypeError);

        expect(() => {
            'use strict';
            ctx.target.normalized = 'new';
        }).toThrow(TypeError);

        expect(() => {
            'use strict';
            ctx.configuration.active = false;
        }).toThrow(TypeError);

        expect(() => {
            'use strict';
            ctx.startedAt = 'new time';
        }).toThrow(TypeError);
    });
});
