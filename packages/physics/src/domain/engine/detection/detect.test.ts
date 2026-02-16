import { World, Node, attachComponent, Transform } from '@pulse-ts/core';
import { Collider } from '../../../public/components/Collider';
import { RigidBody } from '../../../public/components/RigidBody';
import { detectCollision, detectManifold } from './detect';

describe('detect and manifolds', () => {
    function setupPair() {
        const world = new World();
        const a = new Node();
        const b = new Node();
        world.add(a);
        world.add(b);
        const ta = attachComponent(a, Transform);
        const tb = attachComponent(b, Transform);
        const ca = attachComponent(a, Collider);
        const cb = attachComponent(b, Collider);
        // add rigid bodies for completeness (manifold solver expects them generally)
        attachComponent(a, RigidBody);
        attachComponent(b, RigidBody);
        return { world, a, b, ta, tb, ca, cb };
    }

    it('detects sphere-sphere overlap', () => {
        const { ta, tb, ca, cb } = setupPair();
        ca.kind = 'sphere';
        ca.radius = 0.5;
        cb.kind = 'sphere';
        cb.radius = 0.6;
        ta.localPosition.set(0, 0, 0);
        tb.localPosition.set(0.9, 0, 0); // overlap 0.2
        const c = detectCollision(ca, cb)!;
        expect(c).not.toBeNull();
        expect(c!.depth).toBeGreaterThan(0);
    });

    it('builds a manifold for box-plane with multiple points (<=4)', () => {
        const { ta, tb, ca, cb } = setupPair();
        ca.kind = 'box';
        ca.halfX = 0.5;
        ca.halfY = 0.5;
        ca.halfZ = 0.5;
        cb.kind = 'plane';
        tb.localPosition.set(0, 0, 0);
        // place box slightly intersecting plane (y negative penetration)
        ta.localPosition.set(0.2, 0.25, 0.1);
        const pts = detectManifold(ca, cb);
        expect(pts.length).toBeGreaterThan(0);
        expect(pts.length).toBeLessThanOrEqual(4);
        // Normals should point from A->B (box->plane) which is downward for a ground plane
        expect(pts[0]!.ny).toBeLessThan(0);
    });

    it('builds a manifold for box-capsule via sampling', () => {
        const { ta, tb, ca, cb } = setupPair();
        ca.kind = 'box';
        ca.halfX = 0.6;
        ca.halfY = 0.3;
        ca.halfZ = 0.4;
        cb.kind = 'capsule';
        cb.capRadius = 0.25;
        cb.capHalfHeight = 0.4;
        ta.localPosition.set(0, 0, 0);
        tb.localPosition.set(0.7, 0.2, 0.1);
        const pts = detectManifold(ca, cb);
        expect(pts.length).toBeGreaterThan(0);
        expect(pts.length).toBeLessThanOrEqual(4);
    });
});
