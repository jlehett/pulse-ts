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
    kind: ColliderKind = 'sphere';
    /** Local-space offset applied to the owning transform. */
    offset = new Vec3(0, 0, 0);
    restitution = 0.2;
    /** Surface friction coefficient combined with contacting bodies. */
    friction = 0.5;
    /** When true, collisions are reported but not resolved. */
    isTrigger = false;
    // sphere-only params
    radius = 0.5;
    // box-only params (half extents)
    halfX = 0.5;
    halfY = 0.5;
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
 * Axis-aligned box collider expressed via half extents.
 *
 * @example
 * ```ts
 * const box = useBoxCollider(0.5, 1, 0.5);
 * box.restitution = 0.1;
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
