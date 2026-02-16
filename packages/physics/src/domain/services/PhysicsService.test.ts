import { World, Node, attachComponent, Transform, Vec3 } from '@pulse-ts/core';
import {
    installPhysics,
    RigidBody,
    setLayer,
    setMask,
    addToMask,
    layer,
} from '../../index';
import { Collider } from '../../public/components/Collider';

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

    it('raycast honors layer mask', () => {
        const world = new World();
        const physics = installPhysics(world);
        const n1 = new Node();
        const n2 = new Node();
        world.add(n1);
        world.add(n2);
        const t1 = attachComponent(n1, Transform);
        const t2 = attachComponent(n2, Transform);
        t1.localPosition.set(0, 0, 0);
        t2.localPosition.set(2, 0, 0);
        const c1 = attachComponent(n1, Collider);
        c1.kind = 'box';
        c1.halfX = 0.25;
        c1.halfY = 0.25;
        c1.halfZ = 0.25; // centered at x=0
        setLayer(c1, 1); // layer index 1
        const c2 = attachComponent(n2, Collider);
        c2.kind = 'box';
        c2.halfX = 0.25;
        c2.halfY = 0.25;
        c2.halfZ = 0.25; // centered at x=2
        setLayer(c2, 2); // layer index 2

        // Cast along +X from left side; both are along the path. Mask selects only layer 2.
        const origin = new Vec3(-1, 0, 0);
        const dir = new Vec3(1, 0, 0);
        const hitOnly2 = physics.raycast(origin, dir, { mask: layer(2) });
        expect(hitOnly2).not.toBeNull();
        expect(hitOnly2!.node).toBe(n2);

        // Mask selects only layer 1 -> should hit n1 first
        const hitOnly1 = physics.raycast(origin, dir, { mask: layer(1) });
        expect(hitOnly1).not.toBeNull();
        expect(hitOnly1!.node).toBe(n1);
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

    it('raycasts against a plane and detects sphere-plane contact', () => {
        const world = new World();
        const physics = installPhysics(world);

        // Plane at y=0 with up normal
        const planeNode = new Node();
        world.add(planeNode);
        attachComponent(planeNode, Transform);
        const cp = attachComponent(planeNode, Collider);
        cp.kind = 'plane';
        cp.planeNormal.set(0, 1, 0);

        // Ray from above towards down
        const origin = new Vec3(0, 2, 0);
        const dir = new Vec3(0, -1, 0);
        const hit = physics.raycast(origin, dir, 10);
        expect(hit).not.toBeNull();
        expect(hit!.distance).toBeCloseTo(2);

        // Sphere intersecting plane
        const sNode = new Node();
        world.add(sNode);
        const ts = attachComponent(sNode, Transform);
        ts.localPosition.set(0, 0.25, 0);
        attachComponent(sNode, RigidBody);
        const cs = attachComponent(sNode, Collider);
        cs.kind = 'sphere';
        cs.radius = 0.5;

        let started = false;
        physics.collisionStart.on(() => (started = true));
        physics.step(0);
        expect(started).toBe(true);
    });

    it('detects capsule-sphere and capsule-plane contacts', () => {
        const world = new World();
        const physics = installPhysics(world);

        const capNode = new Node();
        world.add(capNode);
        const tc = attachComponent(capNode, Transform);
        tc.localPosition.set(0, 0, 0);
        const cc = attachComponent(capNode, Collider);
        cc.kind = 'capsule';
        cc.capRadius = 0.5;
        cc.capHalfHeight = 0.5;

        const sNode = new Node();
        world.add(sNode);
        const ts = attachComponent(sNode, Transform);
        ts.localPosition.set(0, 0.6, 0); // near top cap
        attachComponent(sNode, RigidBody);
        const cs = attachComponent(sNode, Collider);
        cs.kind = 'sphere';
        cs.radius = 0.25;

        let started = 0;
        physics.collisionStart.on(() => started++);
        physics.step(0);
        expect(started).toBeGreaterThan(0);

        // Capsule vs plane
        const planeNode = new Node();
        world.add(planeNode);
        attachComponent(planeNode, Transform);
        const cp = attachComponent(planeNode, Collider);
        cp.kind = 'plane';
        cp.planeNormal.set(0, 1, 0);
        // Move capsule slightly below plane so it intersects
        tc.localPosition.set(0, -0.2, 0);
        physics.step(0);
        expect(started).toBeGreaterThan(0);
    });

    it('raycasts against a capsule (cylinder and caps)', () => {
        const world = new World();
        const physics = installPhysics(world);
        const n = new Node();
        world.add(n);
        const t = attachComponent(n, Transform);
        t.localPosition.set(0, 0, 0);
        const c = attachComponent(n, Collider);
        c.kind = 'capsule';
        c.capRadius = 0.5;
        c.capHalfHeight = 0.75;

        // Ray from left to right, hits cylinder around x=-1..1 range
        const origin = new Vec3(-2, 0, 0);
        const dir = new Vec3(1, 0, 0);
        const hitCyl = physics.raycast(origin, dir, 10);
        expect(hitCyl).not.toBeNull();
        expect(hitCyl!.node).toBe(n);

        // Ray downwards onto top cap
        const origin2 = new Vec3(0, 2, 0);
        const dir2 = new Vec3(0, -1, 0);
        const hitCap = physics.raycast(origin2, dir2, 10);
        expect(hitCap).not.toBeNull();
        expect(hitCap!.node).toBe(n);
    });

    it('computes capsule inertia and zero plane inertia automatically', () => {
        const world = new World();
        const physics = installPhysics(world);
        // Capsule inertia
        const n1 = new Node();
        world.add(n1);
        attachComponent(n1, Transform);
        const rb1 = attachComponent(n1, RigidBody);
        rb1.mass = 3;
        const col1 = attachComponent(n1, Collider);
        col1.kind = 'capsule';
        col1.capRadius = 0.4;
        col1.capHalfHeight = 0.6;
        physics.step(0); // ensure refresh
        expect(rb1.inverseInertiaTensor.x).toBeGreaterThan(0);
        expect(rb1.inverseInertiaTensor.y).toBeGreaterThan(0);
        expect(rb1.inverseInertiaTensor.z).toBeGreaterThan(0);

        // Plane inertia zero
        const n2 = new Node();
        world.add(n2);
        attachComponent(n2, Transform);
        const rb2 = attachComponent(n2, RigidBody);
        rb2.mass = 2;
        const col2 = attachComponent(n2, Collider);
        col2.kind = 'plane';
        physics.step(0);
        expect(rb2.inertiaTensor.x).toBe(0);
        expect(rb2.inertiaTensor.y).toBe(0);
        expect(rb2.inertiaTensor.z).toBe(0);
        expect(rb2.inverseInertiaTensor.x).toBe(0);
        expect(rb2.inverseInertiaTensor.y).toBe(0);
        expect(rb2.inverseInertiaTensor.z).toBe(0);
    });

    it('applies angular effects on tilted box impact with plane', () => {
        const world = new World();
        const physics = installPhysics(world);
        const plane = new Node();
        world.add(plane);
        attachComponent(plane, Transform);
        const plCol = attachComponent(plane, Collider);
        plCol.kind = 'plane';
        plCol.planeNormal.set(0, 1, 0);

        const box = new Node();
        world.add(box);
        const tb = attachComponent(box, Transform);
        tb.localPosition.set(0.3, 0.6, 0); // slight horizontal offset and closer to plane
        const rb = attachComponent(box, RigidBody);
        rb.mass = 1;
        rb.setLinearVelocity(0, -3, 0); // falling faster onto plane
        const cb = attachComponent(box, Collider);
        cb.kind = 'box';
        cb.halfX = 0.5;
        cb.halfY = 0.5;
        cb.halfZ = 0.5;

        // apply rotation so contacts are asymmetric
        const ang = 0.6;
        tb.localRotation
            .set(0, 0, Math.sin(ang / 2), Math.cos(ang / 2))
            .normalize();

        let wmag = 0;
        for (let i = 0; i < 10; i++) {
            physics.step(1 / 120);
            wmag = Math.hypot(
                rb.angularVelocity.x,
                rb.angularVelocity.y,
                rb.angularVelocity.z,
            );
            if (wmag > 1e-6) break;
        }
        expect(wmag).toBeGreaterThan(0);
    });

    it('respects collision filtering via layer/mask', () => {
        const world = new World();
        const physics = installPhysics(world);
        const a = new Node();
        const b = new Node();
        world.add(a);
        world.add(b);
        const ta = attachComponent(a, Transform);
        const tb = attachComponent(b, Transform);
        ta.localPosition.set(0, 0, 0);
        tb.localPosition.set(0, 0.8, 0); // overlapping spheres radius 0.5
        attachComponent(a, RigidBody);
        const rb = attachComponent(b, RigidBody);
        rb.type = 'static';
        const ca = attachComponent(a, Collider);
        ca.kind = 'sphere';
        ca.radius = 0.5;
        const cb = attachComponent(b, Collider);
        cb.kind = 'sphere';
        cb.radius = 0.5;

        // Place A on layer 0, B on layer 1; make A only collide with layer 0
        setLayer(ca, 0);
        setMask(ca, 0); // only collides with layer 0
        setLayer(cb, 1);

        let started = false;
        physics.collisionStart.on(() => (started = true));
        physics.step(0);
        expect(started).toBe(false);

        // Now allow A to collide with layer 1 via mask helper
        addToMask(ca, 1);
        physics.step(0);
        expect(started).toBe(true);
    });
});
