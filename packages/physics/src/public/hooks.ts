import {
    __fcCurrent,
    useComponent,
    useInit,
    getComponent,
} from '@pulse-ts/core';
import type { Node, ComponentCtor } from '@pulse-ts/core';
import { PhysicsService } from '../domain/services/PhysicsService';
import { RigidBody } from './components/RigidBody';
import { Collider } from './components/Collider';

/**
 * A collision filter that determines whether a collision callback should fire.
 *
 * - **Component constructor**: callback fires only if the other node has the given component.
 * - **Predicate function**: callback fires only if the predicate returns `true` for the other node.
 *
 * @example
 * ```ts
 * // Component shorthand — only collide with nodes that have PlayerTag
 * const filter: CollisionFilter = PlayerTag;
 *
 * // Predicate — collide with players that don't have a shield
 * const filter: CollisionFilter = (other) =>
 *     !!getComponent(other, PlayerTag) && !getComponent(other, Shield);
 * ```
 */
export type CollisionFilter = ComponentCtor | ((other: Node) => boolean);

/**
 * Options for collision event hooks.
 *
 * @example
 * ```ts
 * useOnCollisionStart(({ other }) => {
 *     applyDamage(other);
 * }, { filter: PlayerTag });
 * ```
 */
export interface CollisionOptions {
    /** Optional filter to restrict which collisions trigger the callback. */
    filter?: CollisionFilter;
}

/**
 * Resolves a {@link CollisionFilter} into a predicate function.
 * If the filter is a component constructor, wraps it in a `getComponent` check.
 *
 * @param filter - The filter to resolve.
 * @returns A predicate that accepts a node and returns whether the collision should fire.
 */
function resolveFilter(
    filter?: CollisionFilter,
): ((other: Node) => boolean) | undefined {
    if (!filter) return undefined;
    if (typeof filter === 'function' && filter.prototype !== undefined) {
        // Component constructor — check if other node has the component
        const Ctor = filter as ComponentCtor;
        return (other: Node) => !!getComponent(other, Ctor);
    }
    return filter as (other: Node) => boolean;
}

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
        throw new Error(
            'PhysicsService not provided. Call installPhysics(world) first.',
        );
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
export function useSphereCollider(
    radius = 0.5,
    init?: Partial<Collider>,
): Collider {
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
export function useBoxCollider(
    hx = 0.5,
    hy = 0.5,
    hz = 0.5,
    init?: Partial<Collider>,
): Collider {
    const col = useComponent(Collider);
    col.kind = 'box';
    col.halfX = hx;
    col.halfY = hy;
    col.halfZ = hz;
    if (init) Object.assign(col, init);
    return col;
}

/**
 * Ensures a plane collider is present on the current node.
 * The plane point is the node position plus rotated offset; the normal is the node rotation applied to `planeNormal`.
 */
export function usePlaneCollider(init?: Partial<Collider>): Collider {
    const col = useComponent(Collider);
    col.kind = 'plane';
    if (init) Object.assign(col, init);
    return col;
}

/**
 * Ensures a capsule collider is present on the current node, oriented along local Y.
 */
export function useCapsuleCollider(
    radius = 0.5,
    halfHeight = 0.5,
    init?: Partial<Collider>,
): Collider {
    const col = useComponent(Collider);
    col.kind = 'capsule';
    col.capRadius = radius;
    col.capHalfHeight = halfHeight;
    if (init) Object.assign(col, init);
    return col;
}

/**
 * Ensures a cylinder collider is present on the current node, oriented along local Y
 * with flat disc end-caps.
 *
 * @example
 * ```ts
 * useCylinderCollider(14, 0.25, { friction: 0.6 });
 * ```
 * @param radius Cylinder radius in world units.
 * @param halfHeight Half the height along the local Y axis.
 * @param init Optional overrides applied once to the collider.
 */
export function useCylinderCollider(
    radius = 0.5,
    halfHeight = 0.5,
    init?: Partial<Collider>,
): Collider {
    const col = useComponent(Collider);
    col.kind = 'cylinder';
    col.cylRadius = radius;
    col.cylHalfHeight = halfHeight;
    if (init) Object.assign(col, init);
    return col;
}

/**
 * Registers a callback for the start of collisions involving the current node.
 *
 * @example
 * ```ts
 * // Unfiltered — fires for every collision start
 * useOnCollisionStart(({ self, other }) => {
 *     console.log('collided with', other.id);
 * });
 *
 * // Component shorthand — only fires when the other node has PlayerTag
 * useOnCollisionStart(({ other }) => {
 *     applyKnockback(other);
 * }, { filter: PlayerTag });
 *
 * // Predicate — only fires for players without a shield
 * useOnCollisionStart(({ other }) => {
 *     applyDamage(other);
 * }, { filter: (other) => !!getComponent(other, PlayerTag) && !getComponent(other, Shield) });
 * ```
 * @param fn Handler invoked with the local (`self`) and other (`other`) nodes.
 * @param options Optional configuration including a {@link CollisionFilter}.
 */
export function useOnCollisionStart(
    fn: (e: { self: Node; other: Node }) => void,
    options?: CollisionOptions,
) {
    const world = __fcCurrent().world;
    const node = __fcCurrent().node;
    const svc = world.getService(PhysicsService);
    if (!svc)
        throw new Error(
            'PhysicsService not provided. Call installPhysics(world) first.',
        );
    const predicate = resolveFilter(options?.filter);
    useInit(() => {
        const off = svc.collisionStart.on((p) => {
            if (p.aNode === node) {
                if (!predicate || predicate(p.bNode))
                    fn({ self: p.aNode, other: p.bNode });
            } else if (p.bNode === node) {
                if (!predicate || predicate(p.aNode))
                    fn({ self: p.bNode, other: p.aNode });
            }
        });
        return () => off();
    });
}

/**
 * Registers a callback for the end of collisions involving the current node.
 *
 * @example
 * ```ts
 * // Unfiltered
 * useOnCollisionEnd(() => console.log('separated!'));
 *
 * // Only fires when separating from a node with PlayerTag
 * useOnCollisionEnd(({ other }) => {
 *     removeHighlight(other);
 * }, { filter: PlayerTag });
 * ```
 * @param fn Handler invoked with the local (`self`) and other (`other`) nodes.
 * @param options Optional configuration including a {@link CollisionFilter}.
 */
export function useOnCollisionEnd(
    fn: (e: { self: Node; other: Node }) => void,
    options?: CollisionOptions,
) {
    const world = __fcCurrent().world;
    const node = __fcCurrent().node;
    const svc = world.getService(PhysicsService);
    if (!svc)
        throw new Error(
            'PhysicsService not provided. Call installPhysics(world) first.',
        );
    const predicate = resolveFilter(options?.filter);
    useInit(() => {
        const off = svc.collisionEnd.on((p) => {
            if (p.aNode === node) {
                if (!predicate || predicate(p.bNode))
                    fn({ self: p.aNode, other: p.bNode });
            } else if (p.bNode === node) {
                if (!predicate || predicate(p.aNode))
                    fn({ self: p.bNode, other: p.aNode });
            }
        });
        return () => off();
    });
}

/**
 * Registers a callback that fires every step while the current node remains in contact with another collider.
 *
 * @example
 * ```ts
 * // Unfiltered
 * useOnCollision(({ other }) => applyDamage(other));
 *
 * // Only fires while in contact with a node that has EnemyTag
 * useOnCollision(({ other }) => {
 *     drainHealth(other);
 * }, { filter: EnemyTag });
 * ```
 * @param fn Handler invoked with the local (`self`) and other (`other`) nodes.
 * @param options Optional configuration including a {@link CollisionFilter}.
 */
export function useOnCollision(
    fn: (e: { self: Node; other: Node }) => void,
    options?: CollisionOptions,
) {
    const world = __fcCurrent().world;
    const node = __fcCurrent().node;
    const svc = world.getService(PhysicsService);
    if (!svc)
        throw new Error(
            'PhysicsService not provided. Call installPhysics(world) first.',
        );
    const predicate = resolveFilter(options?.filter);
    useInit(() => {
        const off = svc.collisions.on((p) => {
            if (p.aNode === node) {
                if (!predicate || predicate(p.bNode))
                    fn({ self: p.aNode, other: p.bNode });
            } else if (p.bNode === node) {
                if (!predicate || predicate(p.aNode))
                    fn({ self: p.bNode, other: p.aNode });
            }
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
 * @returns A function equivalent to `physics.raycast(...)` bound to the current service.
 */
export function usePhysicsRaycast() {
    const svc = usePhysics();
    return svc.raycast.bind(svc);
}
