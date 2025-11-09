import { World, Node, attachComponent, Transform, Vec3 } from '@pulse-ts/core';
import { Collider } from '../../../public/components/Collider';
import { detectManifold } from './detect';

describe('detectManifold box-box', () => {
    function makeBox(
        world: World,
        pos: Vec3,
        hx: number,
        hy: number,
        hz: number,
        rotZ = 0,
    ) {
        const n = new Node();
        world.add(n);
        const t = attachComponent(n, Transform);
        t.localPosition.set(pos.x, pos.y, pos.z);
        if (rotZ !== 0) {
            const s = Math.sin(rotZ / 2),
                c = Math.cos(rotZ / 2);
            t.localRotation.set(0, 0, s, c).normalize();
        }
        const c = attachComponent(n, Collider);
        c.kind = 'box';
        c.halfX = hx;
        c.halfY = hy;
        c.halfZ = hz;
        return { node: n, t, c };
    }

    it('returns up to 4 contact points with correct normal orientation', () => {
        const world = new World();
        const A = makeBox(world, new Vec3(0, 0, 0), 0.5, 0.5, 0.5, 0.2);
        const B = makeBox(world, new Vec3(0.2, 0.3, 0.1), 0.5, 0.5, 0.5, -0.15);
        const pts = detectManifold(A.c, B.c);
        expect(pts.length).toBeGreaterThan(0);
        expect(pts.length).toBeLessThanOrEqual(4);
        // normal should point from A->B
        const centerA = A.t.getWorldTRS().position;
        const centerB = B.t.getWorldTRS().position;
        const dir = new Vec3(
            centerB.x - centerA.x,
            centerB.y - centerA.y,
            centerB.z - centerA.z,
        );
        const n = pts[0]!;
        const dot = dir.x * n.nx + dir.y * n.ny + dir.z * n.nz;
        expect(dot).toBeGreaterThan(0);
        expect(pts[0]!.depth).toBeGreaterThan(0);
    });
});
