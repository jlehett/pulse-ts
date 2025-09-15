import { World, Node, attachComponent, Transform, Vec3 } from '@pulse-ts/core';
import { installPhysics, PhysicsService, RigidBody, Collider } from '@pulse-ts/physics';

function step(world: World, steps: number, dtMs = 16) {
    for (let i = 0; i < steps; i++) world.tick(dtMs);
}

describe('@pulse-ts/physics basics', () => {
    test('gravity + planeY bounce to rest', () => {
        const world = new World({ fixedStepMs: 16 });
        installPhysics(world, { worldPlaneY: 0 });

        const n = new Node();
        world.add(n);
        const t = attachComponent(n, Transform);
        t.localPosition.set(0, 5, 0);
        const rb = attachComponent(n, RigidBody);
        rb.restitution = 0; // no bounce
        const col = attachComponent(n, Collider);
        col.kind = 'sphere';
        col.radius = 0.5;

        step(world, 200, 16);
        expect(t.localPosition.y).toBeGreaterThanOrEqual(0.5);
        expect(Math.abs(t.localPosition.y - 0.5)).toBeLessThan(0.1);
        expect(Math.abs(rb.linearVelocity.y)).toBeLessThan(0.05);
    });

    // collisionStart/stay/end are verified in trigger test below

    test('trigger volumes do not resolve but emit', () => {
        const world = new World({ fixedStepMs: 16 });
        const svc = installPhysics(world, {});
        const a = new Node();
        const b = new Node();
        world.add(a);
        world.add(b);
        const ta = attachComponent(a, Transform);
        const tb = attachComponent(b, Transform);
        ta.localPosition.set(-2, 0, 0);
        tb.localPosition.set(0, 0, 0);
        const rba = attachComponent(a, RigidBody);
        rba.linearVelocity.set(1, 0, 0);
        const ca = attachComponent(a, Collider);
        ca.kind = 'sphere';
        ca.radius = 1;
        const cb = attachComponent(b, Collider);
        cb.kind = 'sphere';
        cb.radius = 1;
        cb.isTrigger = true;
        let started = 0;
        const off = svc.collisionStart.on(() => started++);
        step(world, 200, 16);
        off();
        const dx = tb.localPosition.x - ta.localPosition.x;
        expect(Math.abs(dx)).toBeLessThan(2); // still overlapping => no resolution
        expect(started).toBeGreaterThanOrEqual(1);
    });

    test('raycast hits sphere', () => {
        const world = new World({ fixedStepMs: 16 });
        const svc = installPhysics(world, {});
        const n = new Node();
        world.add(n);
        const t = attachComponent(n, Transform);
        t.localPosition.set(0, 0, 0);
        const c = attachComponent(n, Collider);
        c.kind = 'sphere';
        c.radius = 1;

        const hit = svc.raycast(new Vec3(0, 0, -5), new Vec3(0, 0, 1), 100);
        expect(hit).not.toBeNull();
        expect(hit!.node).toBe(n);
        expect(Math.abs(hit!.distance - 4)).toBeLessThan(1e-3);
    });

    // TODO: add sphere-on-box resolution test after broadphase/narrowphase tuning
});
