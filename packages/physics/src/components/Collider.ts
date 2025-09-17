import { Component, Vec3 } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { PhysicsService } from '../services/Physics';

/**
 * Supported collider primitive types.
 */
export type ColliderKind = 'sphere' | 'box';

/**
 * Base Collider component responsible for describing collision geometry.
 *
 * @example
 * ```ts
 * const collider = useSphereCollider(0.75);
 * collider.offset.y = 0.25;
 * collider.restitution = 0.5;
 * ```
 */
export class Collider extends Component {
    /** Collider primitive kind. Prefer using `SphereCollider` or `BoxCollider` helpers. */
    kind: ColliderKind = 'sphere';
    /** Local-space offset applied to the owning transform. */
    offset = new Vec3(0, 0, 0);
    restitution = 0.2;
    /**
     * Surface friction coefficient combined with contacting bodies.
     * Mixed using geometric mean across objects; per-object value is the max of
     * this collider's friction and the owning body's friction.
     */
    friction = 0.5;
    /** When true, collisions are reported but not resolved. */
    isTrigger = false;
    // sphere-only params
    /** Sphere radius in world units (applies when `kind === 'sphere'`). */
    radius = 0.5;
    // box-only params (half extents)
    /** Half-extent along X in world units (applies when `kind === 'box'`). */
    halfX = 0.5;
    /** Half-extent along Y in world units (applies when `kind === 'box'`). */
    halfY = 0.5;
    /** Half-extent along Z in world units (applies when `kind === 'box'`). */
    halfZ = 0.5;

    /**
     * Registers the collider with the physics service when attached to a node.
     */
    static attach<T extends Component>(this: new () => T, owner: Node): T {
        const c = (super.attach as any)(owner) as T;
        const w = owner.world;
        const svc = w?.getService(PhysicsService);
        svc?.registerCollider(c as any as Collider);
        const prev = owner.onDestroy;
        owner.onDestroy = () => {
            try {
                svc?.unregisterCollider(c as any as Collider);
            } catch {}
            prev?.();
        };
        return c;
    }
}

/**
 * Collider preconfigured as a centered sphere.
 *
 * @example
 * ```ts
 * const sphere = useSphereCollider(1.2);
 * sphere.isTrigger = true;
 * ```
 */
export class SphereCollider extends Collider {
    /**
     * @param radius Sphere radius in world units.
     */
    constructor(radius = 0.5) {
        super();
        this.kind = 'sphere';
        this.radius = radius;
    }
}

/**
 * Oriented box collider expressed via half extents.
 * The collider orientation follows the owning node's world rotation.
 *
 * @example
 * ```ts
 * const box = useBoxCollider(0.5, 1, 0.5);
 * box.restitution = 0.1;
 * // rotate the node to rotate the box collider
 * node.get(Transform).localRotation.set(0, 0, Math.sin(theta/2), Math.cos(theta/2)).normalize();
 * ```
 */
export class BoxCollider extends Collider {
    /**
     * @param hx Half extent along the X axis.
     * @param hy Half extent along the Y axis.
     * @param hz Half extent along the Z axis.
     */
    constructor(hx = 0.5, hy = 0.5, hz = 0.5) {
        super();
        this.kind = 'box';
        this.halfX = hx;
        this.halfY = hy;
        this.halfZ = hz;
    }
}
