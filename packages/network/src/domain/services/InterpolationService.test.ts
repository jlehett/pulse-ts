import { Node, getComponent } from '@pulse-ts/core';
import { Transform } from '@pulse-ts/core';
import { InterpolationService } from './InterpolationService';

describe('InterpolationService', () => {
    it('moves toward target position with smoothing', () => {
        const svc = new InterpolationService();
        const node = new Node();
        // lambda ~ ln(2) so dt=1 moves ~50%
        svc.register(node, { id: 'E', lambda: Math.log(2), snapDist: 1000 });
        svc.setTarget('E', { p: { x: 10, y: 0, z: 0 } });
        svc.tick(1.0);
        // Node has a Transform attached by register(); read it via core API
        const trans = getComponent(node, Transform)!;
        const x = trans.localPosition.x;
        expect(typeof x).toBe('number');
        expect(x).toBeGreaterThan(4.5);
        expect(x).toBeLessThan(5.5);
    });
});
