import { __fcCurrent, useComponent, useInit } from '@pulse-ts/core';
import { PhysicsService } from '../services/Physics';
import { RigidBody } from '../components/RigidBody';
import { Collider } from '../components/Collider';

/**
 * Returns the PhysicsService for the currently executing function component.
 *
 * @example
 * ```ts
 * const physics = usePhysics();
 * physics.setGravity(0, -15, 0);
 * ```
 * @throws When the physics service has not been installed in the world.
 */
export function usePhysics(): PhysicsService {
    const world = __fcCurrent().world;
    const svc = world.getService(PhysicsService);
    if (!svc)
        throw new Error('PhysicsService not provided. Call installPhysics(world) first.');
    return svc;
}

/**
 * Ensures a RigidBody component exists on the current node and applies optional initial values.
 *
 * @example
 * ```ts
 * const body = useRigidBody({ mass: 3 });
 * body.applyForce(0, 30, 0);
 * body.applyTorque({ x: 0, y: 1, z: 0 });
 * ```
 * @param init Optional overrides applied once to the component.
 */
export function useRigidBody(init?: Partial<RigidBody>): RigidBody {
    const rb = useComponent(RigidBody);
    if (init) Object.assign(rb, init);
    return rb;
}

/**
 * Ensures a sphere collider is present on the current node, optionally configuring defaults.
 *
 * @example
 * ```ts
 * const collider = useSphereCollider(0.75, { restitution: 0.5 });
 * collider.isTrigger = true;
 * ```
 * @param radius Sphere radius to apply.
 * @param init Optional overrides applied once to the collider.
 */
export function useSphereCollider(radius = 0.5, init?: Partial<Collider>): Collider {
    const col = useComponent(Collider);
    col.kind = 'sphere';
    col.radius = radius;
    if (init) Object.assign(col, init);
    return col;
}

/**
 * Ensures an axis-aligned box collider is present on the current node.
 *
 * @example
 * ```ts
 * useBoxCollider(0.5, 1, 0.5, { restitution: 0.1 });
 * ```
 * @param hx Half extent along the X axis.
 * @param hy Half extent along the Y axis.
 * @param hz Half extent along the Z axis.
 * @param init Optional overrides applied once to the collider.
 */
export function useBoxCollider(hx = 0.5, hy = 0.5, hz = 0.5, init?: Partial<Collider>): Collider {
    const col = useComponent(Collider);
    col.kind = 'box';
    col.halfX = hx;
    col.halfY = hy;
    col.halfZ = hz;
    if (init) Object.assign(col, init);
    return col;
}

/**
 * Registers a callback for the start of collisions involving the current node.
 *
 * @example
 * ```ts
 * useOnCollisionStart(({ self, other }) => {
 *     console.log('collided with', other.id);
 * });
 * ```
 * @param fn Handler invoked with the local and other nodes.
 */
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

/**
 * Registers a callback for the end of collisions involving the current node.
 *
 * @example
 * ```ts
 * useOnCollisionEnd(() => console.log('separated!'));
 * ```
 * @param fn Handler invoked with the local and other nodes.
 */
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

/**
 * Registers a callback that fires every step while the current node remains in contact with another collider.
 *
 * @example
 * ```ts
 * useOnCollision(({ other }) => applyDamage(other));
 * ```
 * @param fn Handler invoked with the local and other nodes.
 */
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

/**
 * Provides a convenient raycast function bound to the current PhysicsService instance.
 *
 * @example
 * ```ts
 * const raycast = usePhysicsRaycast();
 * const hit = raycast(new Vec3(0, 1, -5), new Vec3(0, 0, 1), 20);
 * if (hit) console.log(hit.distance);
 * ```
 */
export function usePhysicsRaycast() {
    const svc = usePhysics();
    return svc.raycast.bind(svc);
}
