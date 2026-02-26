import { World, Node, attachComponent, Transform, Vec3 } from '@pulse-ts/core';
import { RigidBody } from '../../../public/components/RigidBody';
import { Collider } from '../../../public/components/Collider';
import { integrateVelocities, integrateTransforms } from './integration';
import {
    solveContactsIterative,
    type ContactConstraint,
} from '../solver/solver';

function makeBody(type: 'dynamic' | 'kinematic' | 'static' = 'dynamic') {
    const world = new World();
    const node = new Node();
    world.add(node);
    const t = attachComponent(node, Transform);
    const rb = attachComponent(node, RigidBody);
    rb.type = type;
    rb.mass = 1;
    return { world, node, t, rb };
}

const gravity = new Vec3(0, -10, 0);
const dt = 1 / 60;

describe('kinematic body — integrateTransforms', () => {
    // Kinematic bodies set their own velocity externally; integrateTransforms
    // drives position/rotation from that velocity the same as for dynamic bodies.
    // The contact solver reads the velocity but never modifies it (invMass = 0).

    it('moves by linearVelocity each step', () => {
        const { t, rb } = makeBody('kinematic');
        rb.linearVelocity.set(2, 0, 0);
        integrateTransforms([rb], dt);
        expect(t.localPosition.x).toBeCloseTo(2 * dt, 6);
        expect(t.localPosition.y).toBeCloseTo(0, 6);
    });

    it('rotates by angularVelocity each step', () => {
        const { t, rb } = makeBody('kinematic');
        rb.angularVelocity.set(0, Math.PI, 0); // 180 deg/s around Y
        integrateTransforms([rb], dt);
        // Some rotation must have been applied
        const rot = t.localRotation;
        expect(rot.w).toBeLessThan(1);
        expect(rot.y).not.toBeCloseTo(0, 3);
    });

    it('does not move when linearVelocity is zero', () => {
        const { t, rb } = makeBody('kinematic');
        integrateTransforms([rb], dt);
        expect(t.localPosition.x).toBeCloseTo(0, 6);
        expect(t.localPosition.y).toBeCloseTo(0, 6);
    });
});

describe('kinematic body — integrateVelocities', () => {
    it('does not accumulate gravity', () => {
        const { rb } = makeBody('kinematic');
        integrateVelocities([rb], gravity, dt, () => false);
        expect(rb.linearVelocity.y).toBeCloseTo(0, 6);
    });

    it('ignores applied impulses (clears without applying)', () => {
        const { rb } = makeBody('kinematic');
        rb.applyImpulse(0, 100, 0);
        integrateVelocities([rb], gravity, dt, () => false);
        expect(rb.linearVelocity.y).toBeCloseTo(0, 6);
        expect(rb.impulse.y).toBeCloseTo(0, 6); // accumulator cleared
    });

    it('ignores applied forces (clears without applying)', () => {
        const { rb } = makeBody('kinematic');
        rb.applyForce(0, 200, 0);
        integrateVelocities([rb], gravity, dt, () => false);
        expect(rb.linearVelocity.y).toBeCloseTo(0, 6);
        expect(rb.force.y).toBeCloseTo(0, 6); // accumulator cleared
    });

    it('preserves externally set velocity unchanged', () => {
        const { rb } = makeBody('kinematic');
        rb.linearVelocity.set(3, 5, -2);
        integrateVelocities([rb], gravity, dt, () => false);
        expect(rb.linearVelocity.x).toBeCloseTo(3, 6);
        expect(rb.linearVelocity.y).toBeCloseTo(5, 6);
        expect(rb.linearVelocity.z).toBeCloseTo(-2, 6);
    });
});

describe('kinematic body — solver interaction', () => {
    it('inverseMass is 0 (infinite mass from solver perspective)', () => {
        const { rb } = makeBody('kinematic');
        expect(rb.inverseMass).toBe(0);
    });

    it('moving kinematic body pushes dynamic body via velocity-based contact', () => {
        // Kinematic wall moving +X at 5 m/s, dynamic box overlapping it on the right.
        // After one round of solveContactsIterative the dynamic box gains +X velocity;
        // the kinematic body's velocity must remain unchanged (infinite mass).
        const world = new World();

        const kNode = new Node();
        world.add(kNode);
        const kT = attachComponent(kNode, Transform);
        const kRb = attachComponent(kNode, RigidBody);
        kRb.type = 'kinematic';
        kRb.mass = 1;
        kRb.linearVelocity.set(5, 0, 0);
        const kCol = attachComponent(kNode, Collider);
        kCol.kind = 'box';
        kCol.halfX = kCol.halfY = kCol.halfZ = 0.5;
        kT.localPosition.set(0, 0, 0);

        const dNode = new Node();
        world.add(dNode);
        const dT = attachComponent(dNode, Transform);
        const dRb = attachComponent(dNode, RigidBody);
        dRb.type = 'dynamic';
        dRb.mass = 1;
        dRb.linearVelocity.set(0, 0, 0);
        const dCol = attachComponent(dNode, Collider);
        dCol.kind = 'box';
        dCol.halfX = dCol.halfY = dCol.halfZ = 0.5;
        dT.localPosition.set(0.9, 0, 0); // overlapping from the right

        const constraint: ContactConstraint = {
            a: kCol,
            b: dCol,
            nx: 1, ny: 0, nz: 0,
            depth: 0.1,
            px: 0.45, py: 0, pz: 0,
        };
        solveContactsIterative([constraint], 4, dt);

        // Dynamic body gains positive X velocity (pushed right by the kinematic wall)
        expect(dRb.linearVelocity.x).toBeGreaterThan(0);
        // Kinematic body's velocity is untouched (invMass = 0, solver skips it)
        expect(kRb.linearVelocity.x).toBeCloseTo(5, 6);
    });
});
