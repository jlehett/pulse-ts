import { World, Node, attachComponent, Transform, Vec3 } from '@pulse-ts/core';
import { Collider } from '../../../public/components/Collider';
import { raycast } from './raycast';

describe('raycast normals', () => {
    it('returns axis normal for axis-aligned box hit', () => {
        const world = new World();
        const n = new Node();
        world.add(n);
        const t = attachComponent(n, Transform);
        t.localPosition.set(0, 0, 0);
        const c = attachComponent(n, Collider);
        c.kind = 'box';
        c.halfX = c.halfY = c.halfZ = 0.5;
        const origin = new Vec3(-2, 0, 0);
        const dir = new Vec3(1, 0, 0);
        const hit = raycast([c], origin, dir, 10)!;
        expect(hit).not.toBeNull();
        expect(hit.normal.x).toBeCloseTo(1);
        expect(Math.abs(hit.normal.y)).toBeLessThan(1e-6);
    });

    it('returns plane normal for plane hit', () => {
        const world = new World();
        const n = new Node();
        world.add(n);
        attachComponent(n, Transform);
        const c = attachComponent(n, Collider);
        c.kind = 'plane';
        c.planeNormal.set(0, 1, 0);
        const origin = new Vec3(0, 2, 0);
        const dir = new Vec3(0, -1, 0);
        const hit = raycast([c], origin, dir, 10)!;
        expect(hit).not.toBeNull();
        expect(hit.normal.y).toBeCloseTo(1);
    });
});
