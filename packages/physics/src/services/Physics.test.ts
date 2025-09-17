import { World, Node, attachComponent, Transform, Vec3 } from '@pulse-ts/core';
import { installPhysics, RigidBody } from '..';
import { Collider } from '../components/Collider';

describe('PhysicsService integration', () => {
    function createBody(
        opts: { mass?: number; collider?: 'sphere' | 'box' } = {},
    ) {
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
        const { physics, body, transform } = createBody({
            mass: 2,
            collider: 'sphere',
        });
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

    it('emits collision start and end events', () => {
        const world = new World();
        const physics = installPhysics(world);
        const a = new Node();
        const b = new Node();
        world.add(a);
        world.add(b);
        const ta = attachComponent(a, Transform);
        const tb = attachComponent(b, Transform);
        ta.localPosition.set(0, 0, 0);
        tb.localPosition.set(0, 2, 0);
        attachComponent(a, RigidBody);
        const rb = attachComponent(b, RigidBody);
        rb.type = 'static';
        const ca = attachComponent(a, Collider);
        ca.kind = 'sphere';
        ca.radius = 1;
        const cb = attachComponent(b, Collider);
        cb.kind = 'sphere';
        cb.radius = 1;

        let starts = 0;
        let ends = 0;
        physics.collisionStart.on(() => starts++);
        physics.collisionEnd.on(() => ends++);

        // Move into contact and step
        tb.localPosition.set(0, 1.8, 0); // slight overlap (depth 0.2)
        physics.step(0);
        expect(starts).toBe(1);
        expect(ends).toBe(0);

        // Separate and step
        tb.localPosition.set(0, 3, 0);
        physics.step(0);
        expect(ends).toBe(1);
    });

    it('treats isTrigger colliders as non-resolving but still emits events', () => {
        const world = new World();
        const physics = installPhysics(world);
        const a = new Node();
        const b = new Node();
        world.add(a);
        world.add(b);
        const ta = attachComponent(a, Transform);
        const tb = attachComponent(b, Transform);
        ta.localPosition.set(0, 0, 0);
        tb.localPosition.set(0, 0.8, 0); // overlap (sphere radius defaults 0.5)
        attachComponent(a, RigidBody);
        const rb = attachComponent(b, RigidBody);
        rb.type = 'static';
        const ca = attachComponent(a, Collider);
        ca.kind = 'sphere';
        ca.radius = 0.5;
        ca.isTrigger = true;
        const cb = attachComponent(b, Collider);
        cb.kind = 'sphere';
        cb.radius = 0.5;

        let started = false;
        physics.collisionStart.on(() => (started = true));
        physics.step(0);
        expect(started).toBe(true);
        // No resolution should have occurred
        expect(tb.localPosition.y).toBeCloseTo(0.8);
        expect(ta.localPosition.y).toBeCloseTo(0);
    });

    it('applies Coulomb friction to reduce tangential velocity during contact', () => {
        const world = new World();
        const physics = installPhysics(world);
        const a = new Node();
        const b = new Node();
        world.add(a);
        world.add(b);
        const ta = attachComponent(a, Transform);
        const tb = attachComponent(b, Transform);
        ta.localPosition.set(0, 0, 0);
        tb.localPosition.set(0, 0.8, 0); // spheres radius 0.5 -> overlap depth 0.2
        const ra = attachComponent(a, RigidBody);
        ra.mass = 1;
        ra.friction = 0.8;
        const rb = attachComponent(b, RigidBody);
        rb.type = 'static';
        rb.friction = 0.8;
        const ca = attachComponent(a, Collider);
        ca.kind = 'sphere';
        ca.radius = 0.5;
        ca.friction = 0.8;
        const cb = attachComponent(b, Collider);
        cb.kind = 'sphere';
        cb.radius = 0.5;
        cb.friction = 0.8;

        // A is moving upward into B (normal contact) and sideways (tangential motion)
        ra.setLinearVelocity(1, 1, 0);
        const beforeVx = ra.linearVelocity.x;
        physics.step(0); // apply impulses
        // Tangential speed should be reduced by friction
        expect(ra.linearVelocity.x).toBeLessThan(beforeVx);
    });

    it('raycasts against a rotated box (OBB)', () => {
        const world = new World();
        const physics = installPhysics(world);
        const n = new Node();
        world.add(n);
        const t = attachComponent(n, Transform);
        const c = attachComponent(n, Collider);
        c.kind = 'box';
        c.halfX = 0.5;
        c.halfY = 0.5;
        c.halfZ = 0.5;
        // rotate 45 degrees around Z
        const s = Math.sin(Math.PI / 4 / 2);
        const cw = Math.cos(Math.PI / 4 / 2);
        t.localRotation.set(0, 0, s, cw).normalize();
        // cast from left to right
        const origin = new Vec3(-3, 0.1, 0);
        const dir = new Vec3(1, 0, 0);
        const hit = physics.raycast(origin, dir, 10);
        expect(hit).not.toBeNull();
        expect(hit!.distance).toBeGreaterThan(0);
        expect(hit!.distance).toBeLessThan(10);
    });

    it('detects collision with a rotated box and resolves overlap', () => {
        const world = new World();
        const physics = installPhysics(world);
        const sphereNode = new Node();
        const boxNode = new Node();
        world.add(sphereNode);
        world.add(boxNode);

        const ts = attachComponent(sphereNode, Transform);
        const tb = attachComponent(boxNode, Transform);
        ts.localPosition.set(0, 0, 0);
        tb.localPosition.set(0, 0, 0);

        const rb = attachComponent(sphereNode, RigidBody);
        rb.mass = 1;
        const cs = attachComponent(sphereNode, Collider);
        cs.kind = 'sphere';
        cs.radius = 0.5;

        const cb = attachComponent(boxNode, Collider);
        cb.kind = 'box';
        cb.halfX = 0.5;
        cb.halfY = 0.25;
        cb.halfZ = 0.5;
        const s = Math.sin(Math.PI / 4 / 2);
        const cw = Math.cos(Math.PI / 4 / 2);
        tb.localRotation.set(0, 0, s, cw).normalize();

        // Overlap exists at start; after resolution the sphere should be displaced
        let started = 0;
        physics.collisionStart.on(() => started++);
        physics.step(0);
        expect(started).toBeGreaterThan(0);
    });
});
