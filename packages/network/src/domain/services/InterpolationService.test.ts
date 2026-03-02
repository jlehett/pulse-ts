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

    it('snaps to extrapolated position when velocity is present', () => {
        const svc = new InterpolationService();
        const node = new Node();
        // Lambda doesn't matter for the velocity path — position snaps.
        svc.register(node, { id: 'V', lambda: 1, snapDist: 1000 });
        svc.setTarget('V', {
            p: { x: 0, y: 0, z: 0 },
            v: { x: 10, y: 0, z: 0 },
        });

        // After 1 second at v=10, position should be exactly 10 (no smoothing lag).
        svc.tick(1.0);
        const trans = getComponent(node, Transform)!;
        expect(trans.localPosition.x).toBeCloseTo(10);
    });

    it('velocity extrapolation accumulates across ticks', () => {
        const svc = new InterpolationService();
        const node = new Node();
        svc.register(node, { id: 'V2', lambda: 1, snapDist: 1000 });
        svc.setTarget('V2', {
            p: { x: 0, y: 0, z: 0 },
            v: { x: 5, y: 0, z: 0 },
        });

        // 4 ticks of 0.25s each = 1s total, velocity 5 → position = 5
        for (let i = 0; i < 4; i++) svc.tick(0.25);
        const trans = getComponent(node, Transform)!;
        expect(trans.localPosition.x).toBeCloseTo(5);
    });

    it('new snapshot corrects extrapolation overshoot immediately', () => {
        const svc = new InterpolationService();
        const node = new Node();
        svc.register(node, { id: 'C', lambda: 1, snapDist: 1000 });
        svc.setTarget('C', {
            p: { x: 0, y: 0, z: 0 },
            v: { x: 10, y: 0, z: 0 },
        });
        svc.tick(1.0); // extrapolates to 10

        // New snapshot says entity actually stopped at x=5
        svc.setTarget('C', {
            p: { x: 5, y: 0, z: 0 },
            v: { x: 0, y: 0, z: 0 },
        });
        // Snaps directly to corrected position (v=0, so target stays at 5)
        svc.tick(0.016);
        const trans = getComponent(node, Transform)!;
        expect(trans.localPosition.x).toBeCloseTo(5);
    });

    it('falls back to exponential smoothing without velocity', () => {
        const svc = new InterpolationService();
        const node = new Node();
        // lambda ~ ln(2) so dt=1 moves ~50% — should NOT snap
        svc.register(node, {
            id: 'noV',
            lambda: Math.log(2),
            snapDist: 1000,
        });
        svc.setTarget('noV', { p: { x: 10, y: 0, z: 0 } });
        svc.tick(1.0);
        const trans = getComponent(node, Transform)!;
        // ~50% of 10 = ~5, NOT 10 (smoothing, not snapping)
        expect(trans.localPosition.x).toBeGreaterThan(4.5);
        expect(trans.localPosition.x).toBeLessThan(5.5);
    });
});
