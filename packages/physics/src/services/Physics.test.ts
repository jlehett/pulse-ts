import { World, Node, attachComponent, Transform, Vec3 } from '@pulse-ts/core';
import { installPhysics, RigidBody } from '..';
import { Collider } from '../components/Collider';

describe('PhysicsService integration', () => {
    function createBody(opts: { mass?: number; collider?: 'sphere' | 'box' } = {}) {
        const world = new World();
        const physics = installPhysics(world);
        const node = new Node();
        world.add(node);
        const transform = attachComponent(node, Transform);
        const body = attachComponent(node, RigidBody);
        body.mass = opts.mass ?? body.mass;
        body.gravityScale = 0;
        body.linearDamping = 0;
        body.angularDamping = 0;
        body.setLinearVelocity(0, 0, 0);
        body.setAngularVelocity(0, 0, 0);
        if (opts.collider) {
            const collider = attachComponent(node, Collider);
            collider.kind = opts.collider;
            if (opts.collider === 'sphere') collider.radius = 0.5;
        }
        return { world, physics, body, transform, node };
    }

    it('integrates accumulated forces', () => {
        const { physics, body } = createBody({ mass: 2 });
        body.applyForce(2, 0, 0);
        physics.step(0.5);
        expect(body.linearVelocity.x).toBeCloseTo(0.5);
        expect(body.force.x).toBe(0);
        expect(body.force.y).toBe(0);
        expect(body.force.z).toBe(0);
    });

    it('applies impulses instantaneously and clears them', () => {
        const { physics, body } = createBody({ mass: 2 });
        body.applyImpulse(4, 0, 0);
        physics.step(0);
        expect(body.linearVelocity.x).toBeCloseTo(2);
        physics.step(0);
        expect(body.linearVelocity.x).toBeCloseTo(2);
        expect(body.impulse.x).toBe(0);
        expect(body.impulse.y).toBe(0);
        expect(body.impulse.z).toBe(0);
    });

    it('allows updating gravity at runtime', () => {
        const { physics, body } = createBody({ mass: 1 });
        body.gravityScale = 1;
        physics.setGravity(0, -4, 0);
        physics.step(0.5);
        expect(body.linearVelocity.y).toBeCloseTo(-2);
        const stored = new Vec3();
        physics.getGravity(stored);
        expect(stored.y).toBeCloseTo(-4);
        const clone = physics.getGravity();
        clone.y = 10;
        expect(physics.getGravity().y).toBeCloseTo(-4);
    });

    it('integrates torques and angular impulses', () => {
        const { physics, body, transform } = createBody({ mass: 2, collider: 'sphere' });
        body.applyAngularImpulse(1, 0, 0);
        expect(body.angularImpulse.x).toBeCloseTo(1);
        physics.step(0);
        expect(body.inverseInertiaTensor.x).toBeGreaterThan(0);
        expect(body.angularVelocity.x).toBeCloseTo(5); // inv inertia of solid sphere radius 0.5, mass 2
        body.applyTorque(0, 2, 0);
        physics.step(0.5);
        expect(body.angularVelocity.y).toBeCloseTo(5);
        expect(body.torque.y).toBe(0);
        expect(body.angularImpulse.x).toBe(0);
        const q = transform.localRotation;
        expect(Math.hypot(q.x, q.y, q.z)).toBeGreaterThan(0);
    });
});
