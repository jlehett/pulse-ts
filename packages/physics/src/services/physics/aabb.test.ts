import { World, Node, attachComponent, Transform, Vec3 } from '@pulse-ts/core';
import { Collider } from '../../components/Collider';
import { computeAABB } from './aabb';

describe('computeAABB', () => {
    function setup(kind: 'sphere' | 'box' | 'capsule' | 'plane') {
        const world = new World();
        const n = new Node();
        world.add(n);
        const t = attachComponent(n, Transform);
        const c = attachComponent(n, Collider);
        c.kind = kind as any;
        return { world, n, t, c };
    }

    it('sphere produces centered AABB', () => {
        const { t, c } = setup('sphere');
        c.radius = 0.5;
        t.localPosition.set(1, 2, 3);
        const bb = computeAABB(c)!;
        expect(bb.min.x).toBeCloseTo(0.5);
        expect(bb.max.y).toBeCloseTo(2.5);
    });

    it('box respects rotation via oriented extents', () => {
        const { t, c } = setup('box');
        c.halfX = 1;
        c.halfY = 0.5;
        c.halfZ = 0.25;
        t.localPosition.set(0, 0, 0);
        // rotate 45 degrees around Z
        const s = Math.sin(Math.PI / 4 / 2),
            cw = Math.cos(Math.PI / 4 / 2);
        t.localRotation.set(0, 0, s, cw).normalize();
        const bb = computeAABB(c)!;
        // Bounds should be symmetric and larger than raw half-extents along rotated axes
        expect(bb.max.x).toBeGreaterThan(1);
        expect(bb.max.y).toBeGreaterThan(0.5);
    });

    it('capsule returns an AABB that encloses the segment + radius', () => {
        const { t, c } = setup('capsule');
        c.capRadius = 0.5;
        c.capHalfHeight = 0.5;
        t.localPosition.set(0, 1, 0);
        const bb = computeAABB(c)!;
        expect(bb.min.y).toBeCloseTo(1 - (0.5 + 0.5), 5);
        expect(bb.max.y).toBeCloseTo(1 + (0.5 + 0.5), 5);
    });

    it('plane returns null for AABB (infinite)', () => {
        const { c } = setup('plane');
        expect(computeAABB(c)).toBeNull();
    });
});
