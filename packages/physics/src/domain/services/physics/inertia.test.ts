import { World, Node, attachComponent, Transform } from '@pulse-ts/core';
import { RigidBody } from '../../../public/components/RigidBody';
import { Collider } from '../../../public/components/Collider';
import { refreshAutomaticInertia } from './inertia';

describe('inertia auto-compute', () => {
    function setup() {
        const world = new World();
        const n = new Node();
        world.add(n);
        const t = attachComponent(n, Transform);
        const rb = attachComponent(n, RigidBody);
        rb.mass = 2;
        const col = attachComponent(n, Collider);
        return { world, n, t, rb, col };
    }

    it('computes sphere inertia', () => {
        const { rb, col } = setup();
        col.kind = 'sphere';
        col.radius = 0.5;
        refreshAutomaticInertia(rb, () => true);
        // I = 2/5 m r^2 = 0.4 * 2 * 0.25 = 0.2
        expect(rb.inertiaTensor.x).toBeCloseTo(0.2, 5);
        expect(rb.inverseInertiaTensor.x).toBeCloseTo(5, 4);
    });

    it('computes box inertia', () => {
        const { rb, col } = setup();
        rb.mass = 3;
        col.kind = 'box';
        col.halfX = 0.5;
        col.halfY = 1;
        col.halfZ = 0.25;
        refreshAutomaticInertia(rb, () => true);
        const ix =
            (rb.mass / 3) * (col.halfY * col.halfY + col.halfZ * col.halfZ);
        expect(rb.inertiaTensor.x).toBeCloseTo(ix, 6);
    });

    it('computes capsule inertia (iy smaller than ix/iz typically)', () => {
        const { rb, col } = setup();
        rb.mass = 4;
        col.kind = 'capsule';
        col.capRadius = 0.4;
        col.capHalfHeight = 0.6;
        refreshAutomaticInertia(rb, () => true);
        expect(rb.inertiaTensor.x).toBeGreaterThan(0);
        expect(rb.inertiaTensor.y).toBeGreaterThan(0);
        expect(rb.inertiaTensor.z).toBeGreaterThan(0);
        // For a typical capsule aligned to Y, Iy (long axis) should be lower than Ix, Iz
        expect(rb.inertiaTensor.y).toBeLessThan(rb.inertiaTensor.x);
        expect(rb.inertiaTensor.y).toBeLessThan(rb.inertiaTensor.z);
    });

    it('sets plane inertia to zero', () => {
        const { rb, col } = setup();
        rb.mass = 2;
        col.kind = 'plane';
        refreshAutomaticInertia(rb, () => true);
        expect(rb.inertiaTensor.x).toBe(0);
        expect(rb.inverseInertiaTensor.y).toBe(0);
    });
});
