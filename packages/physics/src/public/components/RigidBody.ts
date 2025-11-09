import { Component, Vec3 } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { PhysicsService } from '../../domain/services/PhysicsService';
import type { RigidBodyType } from '../../domain/types';

/**
 * Convenience union for APIs that accept either a Vec3 instance or a plain xyz object.
 *
 * @example
 * ```ts
 * body.applyForce({ x: 0, y: 10, z: 0 });
 * body.applyForce(5, 0, 0);
 * ```
 */
export type Vec3Like = Vec3 | { x: number; y: number; z: number };

/**
 * Internal helper that converts mixed vector inputs into a numeric triple.
 */
function unpackVec3(
    value: Vec3Like | number,
    y?: number,
    z?: number,
): [number, number, number] {
    if (typeof value === 'number') return [value, y ?? 0, z ?? 0];
    return [value.x, value.y, value.z];
}

/**
 * Minimal rigid body component backed by the {@link PhysicsService}.
 *
 * @example
 * ```ts
 * const body = useRigidBody({ mass: 5 });
 * body.applyForce({ x: 0, y: 20, z: 0 });
 * body.applyTorque(0, 5, 0);
 * ```
 */
export class RigidBody extends Component {
    //#region Type and mass

    /** Motion mode determining how the body is simulated. */
    type: RigidBodyType = 'dynamic';
    /** Mass in kilograms; used to compute inverse mass and inertia. */
    mass = 1;
    get inverseMass() {
        return this.type === 'dynamic' && this.mass > 0 ? 1 / this.mass : 0;
    }

    //#endregion

    //#region Linear state

    /** Linear velocity in world units per second. */
    linearVelocity = new Vec3(0, 0, 0);
    /** Per-second damping factor; 0 = none. */
    linearDamping = 0.0; // per-second; 0..inf (0 = none)
    /** Multiplier applied to global gravity for this body. */
    gravityScale = 1.0;

    /** Force accumulator cleared each simulation step. */
    readonly force = new Vec3(0, 0, 0);
    /** Impulse accumulator cleared each simulation step. */
    readonly impulse = new Vec3(0, 0, 0);

    //#endregion

    //#region Angular state

    /** Angular velocity in radians per second about each axis. */
    angularVelocity = new Vec3(0, 0, 0);
    /** Per-second angular damping factor; 0 = none. */
    angularDamping = 0.0;
    /** Torque accumulator cleared each simulation step. */
    readonly torque = new Vec3(0, 0, 0);
    /** Angular impulse accumulator cleared each simulation step. */
    readonly angularImpulse = new Vec3(0, 0, 0);

    /** Diagonal inertia tensor (moment of inertia) in local space. */
    readonly inertiaTensor = new Vec3(1, 1, 1);
    /** Cached inverse inertia tensor derived from {@link inertiaTensor}. */
    readonly inverseInertiaTensor = new Vec3(1, 1, 1);
    /** When true, the physics service will recompute inertia from the attached collider each step. */
    autoComputeInertia = true;

    //#endregion

    //#region Material

    /** Bounciness coefficient [0..1] used in contact response. */
    restitution = 0.2; // bounciness 0..1
    /**
     * Coulomb friction coefficient used in contact resolution.
     * Mixed with the other collider/body using the geometric mean of per-object
     * frictions, where each object's value is the max of its RigidBody and Collider coefficients.
     */
    friction = 0.5;

    //#endregion

    applyForce(force: Vec3Like): void;
    applyForce(x: number, y: number, z: number): void;
    /**
     * Accumulates a continuous force that will be applied during the next physics step.
     * @param forceOrX Either a Vec3-like object or the X component of the force to apply.
     * @param y Optional Y component when passing numeric arguments.
     * @param z Optional Z component when passing numeric arguments.
     */
    applyForce(forceOrX: Vec3Like | number, y?: number, z?: number): void {
        const [fx, fy, fz] = unpackVec3(forceOrX, y, z);
        this.force.x += fx;
        this.force.y += fy;
        this.force.z += fz;
    }

    applyImpulse(impulse: Vec3Like): void;
    applyImpulse(x: number, y: number, z: number): void;
    /**
     * Accumulates an instantaneous impulse applied before the next integration step.
     * @param impulseOrX Either a Vec3-like object or the X component of the impulse to apply.
     * @param y Optional Y component when passing numeric arguments.
     * @param z Optional Z component when passing numeric arguments.
     */
    applyImpulse(impulseOrX: Vec3Like | number, y?: number, z?: number): void {
        const [ix, iy, iz] = unpackVec3(impulseOrX, y, z);
        this.impulse.x += ix;
        this.impulse.y += iy;
        this.impulse.z += iz;
    }

    applyTorque(torque: Vec3Like): void;
    applyTorque(x: number, y: number, z: number): void;
    /**
     * Accumulates a torque that influences angular acceleration on the next step.
     * @param torqueOrX Either a Vec3-like object or the X component of the torque.
     * @param y Optional Y component when passing numeric arguments.
     * @param z Optional Z component when passing numeric arguments.
     */
    applyTorque(torqueOrX: Vec3Like | number, y?: number, z?: number): void {
        const [tx, ty, tz] = unpackVec3(torqueOrX, y, z);
        this.torque.x += tx;
        this.torque.y += ty;
        this.torque.z += tz;
    }

    applyAngularImpulse(impulse: Vec3Like): void;
    applyAngularImpulse(x: number, y: number, z: number): void;
    /**
     * Accumulates an angular impulse applied before the next integration step.
     * @param impulseOrX Either a Vec3-like object or the X component of the angular impulse.
     * @param y Optional Y component when passing numeric arguments.
     * @param z Optional Z component when passing numeric arguments.
     */
    applyAngularImpulse(
        impulseOrX: Vec3Like | number,
        y?: number,
        z?: number,
    ): void {
        const [ix, iy, iz] = unpackVec3(impulseOrX, y, z);
        this.angularImpulse.x += ix;
        this.angularImpulse.y += iy;
        this.angularImpulse.z += iz;
    }

    setLinearVelocity(velocity: Vec3Like): void;
    setLinearVelocity(x: number, y: number, z: number): void;
    /**
     * Replaces the current linear velocity with the provided value.
     * @param velocityOrX Either a Vec3-like object or the X component of the velocity.
     * @param y Optional Y component when passing numeric arguments.
     * @param z Optional Z component when passing numeric arguments.
     */
    setLinearVelocity(
        velocityOrX: Vec3Like | number,
        y?: number,
        z?: number,
    ): void {
        const [vx, vy, vz] = unpackVec3(velocityOrX, y, z);
        this.linearVelocity.set(vx, vy, vz);
    }

    addLinearVelocity(delta: Vec3Like): void;
    addLinearVelocity(x: number, y: number, z: number): void;
    /**
     * Adds a delta to the current linear velocity.
     * @param deltaOrX Either a Vec3-like object or the X component of the velocity delta.
     * @param y Optional Y component when passing numeric arguments.
     * @param z Optional Z component when passing numeric arguments.
     */
    addLinearVelocity(
        deltaOrX: Vec3Like | number,
        y?: number,
        z?: number,
    ): void {
        const [dx, dy, dz] = unpackVec3(deltaOrX, y, z);
        this.linearVelocity.x += dx;
        this.linearVelocity.y += dy;
        this.linearVelocity.z += dz;
    }

    setAngularVelocity(velocity: Vec3Like): void;
    setAngularVelocity(x: number, y: number, z: number): void;
    /**
     * Replaces the current angular velocity vector.
     */
    setAngularVelocity(
        velocityOrX: Vec3Like | number,
        y?: number,
        z?: number,
    ): void {
        const [vx, vy, vz] = unpackVec3(velocityOrX, y, z);
        this.angularVelocity.set(vx, vy, vz);
    }

    addAngularVelocity(delta: Vec3Like): void;
    addAngularVelocity(x: number, y: number, z: number): void;
    /**
     * Adds a delta to the current angular velocity vector.
     */
    addAngularVelocity(
        deltaOrX: Vec3Like | number,
        y?: number,
        z?: number,
    ): void {
        const [dx, dy, dz] = unpackVec3(deltaOrX, y, z);
        this.angularVelocity.x += dx;
        this.angularVelocity.y += dy;
        this.angularVelocity.z += dz;
    }

    /**
     * Allows manually providing a diagonal inertia tensor and locks out automatic recomputation.
     *
     * @example
     * ```ts
     * body.setInertiaTensor(2, 2, 1);
     * ```
     */
    setInertiaTensor(x: number, y: number, z: number): void {
        this.inertiaTensor.set(x, y, z);
        this.inverseInertiaTensor.set(
            x > 0 ? 1 / x : 0,
            y > 0 ? 1 / y : 0,
            z > 0 ? 1 / z : 0,
        );
        this.autoComputeInertia = false;
    }

    /**
     * Re-enables automatic inertia computation from the attached collider.
     *
     * @example
     * ```ts
     * body.useAutomaticInertia();
     * ```
     */
    useAutomaticInertia(): void {
        this.autoComputeInertia = true;
    }
    /** Clears the accumulated force without applying it. */
    clearForce(): void {
        this.force.set(0, 0, 0);
    }

    /** Clears the accumulated impulse without applying it. */
    clearImpulse(): void {
        this.impulse.set(0, 0, 0);
    }

    /** Clears the accumulated torque without applying it. */
    clearTorque(): void {
        this.torque.set(0, 0, 0);
    }

    /** Clears the accumulated angular impulse without applying it. */
    clearAngularImpulse(): void {
        this.angularImpulse.set(0, 0, 0);
    }

    /** Clears all linear accumulators. */
    clearForces(): void {
        this.clearForce();
        this.clearImpulse();
    }

    /** Clears all angular accumulators. */
    clearAngularForces(): void {
        this.clearTorque();
        this.clearAngularImpulse();
    }

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
