import { Component, Vec3 } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { PhysicsService } from '../services/Physics';

export type ColliderKind = 'sphere' | 'box';

/**
 * Base Collider component (MVP: sphere only).
 */
export class Collider extends Component {
    kind: ColliderKind = 'sphere';
    offset = new Vec3(0, 0, 0);
    restitution = 0.2;
    isTrigger = false; // if true, no resolution, events only (not yet exposed)
    // sphere-only params
    radius = 0.5;
    // box-only params (half extents)
    halfX = 0.5;
    halfY = 0.5;
    halfZ = 0.5;

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
 * Helper: configure a sphere collider.
 */
export class SphereCollider extends Collider {
    constructor(radius = 0.5) {
        super();
        this.kind = 'sphere';
        this.radius = radius;
    }
}

export class BoxCollider extends Collider {
    constructor(hx = 0.5, hy = 0.5, hz = 0.5) {
        super();
        this.kind = 'box';
        this.halfX = hx;
        this.halfY = hy;
        this.halfZ = hz;
    }
}
