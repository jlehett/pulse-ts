import { __fcCurrent, useComponent } from '@pulse-ts/core';
import { PhysicsService } from '../services/Physics';
import { RigidBody } from '../components/RigidBody';
import { Collider, BoxCollider } from '../components/Collider';
import { useDestroy, useInit } from '@pulse-ts/core';

/**
 * Get the PhysicsService.
 */
export function usePhysics(): PhysicsService {
    const world = __fcCurrent().world;
    const svc = world.getService(PhysicsService);
    if (!svc)
        throw new Error('PhysicsService not provided. Call installPhysics(world) first.');
    return svc;
}

/**
 * Ensure a RigidBody component on the current node.
 */
export function useRigidBody(init?: Partial<RigidBody>): RigidBody {
    const rb = useComponent(RigidBody);
    if (init) Object.assign(rb, init);
    return rb;
}

/**
 * Ensure a sphere Collider on the current node.
 */
export function useSphereCollider(radius = 0.5, init?: Partial<Collider>): Collider {
    const col = useComponent(Collider);
    col.kind = 'sphere';
    col.radius = radius;
    if (init) Object.assign(col, init);
    return col;
}

/** Ensure a box Collider on the current node. */
export function useBoxCollider(hx = 0.5, hy = 0.5, hz = 0.5, init?: Partial<Collider>): Collider {
    const col = useComponent(Collider);
    col.kind = 'box';
    col.halfX = hx;
    col.halfY = hy;
    col.halfZ = hz;
    if (init) Object.assign(col, init);
    return col;
}

// Collision event hooks filtered to current node
export function useOnCollisionStart(fn: (e: { self: any; other: any }) => void) {
    const world = __fcCurrent().world;
    const node = __fcCurrent().node;
    const svc = world.getService(PhysicsService);
    if (!svc) throw new Error('PhysicsService not provided. Call installPhysics(world) first.');
    useInit(() => {
        const off = svc.collisionStart.on((p) => {
            if (p.aNode === node) fn({ self: p.aNode, other: p.bNode });
            else if (p.bNode === node) fn({ self: p.bNode, other: p.aNode });
        });
        return () => off();
    });
}

export function useOnCollisionEnd(fn: (e: { self: any; other: any }) => void) {
    const world = __fcCurrent().world;
    const node = __fcCurrent().node;
    const svc = world.getService(PhysicsService);
    if (!svc) throw new Error('PhysicsService not provided. Call installPhysics(world) first.');
    useInit(() => {
        const off = svc.collisionEnd.on((p) => {
            if (p.aNode === node) fn({ self: p.aNode, other: p.bNode });
            else if (p.bNode === node) fn({ self: p.bNode, other: p.aNode });
        });
        return () => off();
    });
}

export function useOnCollision(fn: (e: { self: any; other: any }) => void) {
    const world = __fcCurrent().world;
    const node = __fcCurrent().node;
    const svc = world.getService(PhysicsService);
    if (!svc) throw new Error('PhysicsService not provided. Call installPhysics(world) first.');
    useInit(() => {
        const off = svc.collisions.on((p) => {
            if (p.aNode === node) fn({ self: p.aNode, other: p.bNode });
            else if (p.bNode === node) fn({ self: p.bNode, other: p.aNode });
        });
        return () => off();
    });
}

// Raycast helper
export function usePhysicsRaycast() {
    const svc = usePhysics();
    return svc.raycast.bind(svc);
}
