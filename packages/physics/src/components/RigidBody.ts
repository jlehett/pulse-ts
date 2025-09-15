import { Component, Vec3 } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { PhysicsService } from '../services/Physics';
import type { RigidBodyType } from '../types';

/**
 * Minimal rigid body component. Registered with PhysicsService on attach.
 */
export class RigidBody extends Component {
    // Type and mass
    type: RigidBodyType = 'dynamic';
    mass = 1;
    get inverseMass() {
        return this.type === 'dynamic' && this.mass > 0 ? 1 / this.mass : 0;
    }

    // Linear state
    linearVelocity = new Vec3(0, 0, 0);
    linearDamping = 0.0; // per-second; 0..inf (0 = none)
    gravityScale = 1.0;

    // Angular state (reserved; not used in MVP)
    angularVelocity = new Vec3(0, 0, 0);
    angularDamping = 0.0;

    // Material
    restitution = 0.2; // bounciness 0..1

    /**
     * Register with PhysicsService (if installed). Also hooks node destroy for unregister.
     */
    static attach<T extends Component>(this: new () => T, owner: Node): T {
        const c = (super.attach as any)(owner) as T;
        const w = owner.world;
        const svc = w?.getService(PhysicsService);
        svc?.registerRigidBody(c as any as RigidBody);

        // Chain node destroy to unregister
        const prev = owner.onDestroy;
        owner.onDestroy = () => {
            try {
                svc?.unregisterRigidBody(c as any as RigidBody);
            } catch {}
            prev?.();
        };
        return c;
    }
}
