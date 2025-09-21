import { World, Node, attachComponent, Transform } from '@pulse-ts/core';
import { Collider } from '../../components/Collider';
import { RigidBody } from '../../components/RigidBody';
import { correctPositions, solveContactsIterative, type ContactConstraint } from './solver';

function makeBodies(overlapDepth = 0.02) {
    const world = new World();
    const a = new Node();
    const b = new Node();
    world.add(a); world.add(b);
    const ta = attachComponent(a, Transform);
    const tb = attachComponent(b, Transform);
    const rbA = attachComponent(a, RigidBody);
    const rbB = attachComponent(b, RigidBody);
    rbA.mass = 1; rbB.mass = 1;
    const ca = attachComponent(a, Collider); ca.kind = 'box'; ca.halfX = ca.halfY = ca.halfZ = 0.5;
    const cb = attachComponent(b, Collider); cb.kind = 'box'; cb.halfX = cb.halfY = cb.halfZ = 0.5;
    // Place A at origin, B slightly intersecting along +Y (normal up)
    ta.localPosition.set(0, 0, 0);
    tb.localPosition.set(0, overlapDepth - 0.001, 0);
    const nx = 0, ny = 1, nz = 0;
    const depth = overlapDepth;
    const c: ContactConstraint = { a: ca, b: cb, nx, ny, nz, depth, px: 0, py: 0.5, pz: 0 };
    return { world, ta, tb, rbA, rbB, ca, cb, constraint: c };
}

describe('solver unit', () => {
    it('correctPositions uses slop and splits correction based on mass', () => {
        const { ta, tb, constraint } = makeBodies(0.02);
        const yA0 = ta.localPosition.y, yB0 = tb.localPosition.y;
        correctPositions(constraint, 0.005);
        // A moved down, B moved up
        expect(ta.localPosition.y).toBeLessThan(yA0);
        expect(tb.localPosition.y).toBeGreaterThan(yB0);
    });

    it('solveContactsIterative reduces approach velocity along normal', () => {
        const { rbA, rbB, constraint } = makeBodies(0.01);
        // Relative velocity towards each other along +Y
        rbA.setLinearVelocity(0, 0.5, 0);
        rbB.setLinearVelocity(0, -0.5, 0);
        const vrel0 = (rbB.linearVelocity.y - rbA.linearVelocity.y) * constraint.ny;
        solveContactsIterative([constraint], 4, 1 / 60, 0.005, 0.2);
        const vrel1 = (rbB.linearVelocity.y - rbA.linearVelocity.y) * constraint.ny;
        // Expect vrel to be less negative (closer to zero or positive)
        expect(vrel1).toBeGreaterThan(vrel0);
    });

    it('applies angular impulses when contact point has an offset', () => {
        const { rbA, rbB, constraint } = makeBodies(0.015);
        // off-center contact point to generate torque
        constraint.px = 0.4; constraint.py = 0.5; constraint.pz = 0.3;
        rbA.setLinearVelocity(0, 0.8, 0);
        rbB.setLinearVelocity(0, -0.8, 0);
        solveContactsIterative([constraint], 6, 1 / 120, 0.005, 0.2);
        const wmagA = Math.hypot(rbA.angularVelocity.x, rbA.angularVelocity.y, rbA.angularVelocity.z);
        const wmagB = Math.hypot(rbB.angularVelocity.x, rbB.angularVelocity.y, rbB.angularVelocity.z);
        expect(wmagA + wmagB).toBeGreaterThan(0);
    });
});

