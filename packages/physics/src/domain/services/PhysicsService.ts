import { Service, TypedEvent, Vec3, getComponent } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { RigidBody } from '../../public/components/RigidBody';
import type { Vec3Like } from '../../public/components/RigidBody';
import { Collider } from '../../public/components/Collider';
import type { PhysicsOptions, RaycastHit } from '../types';
import { DefaultEngine, type PhysicsEngine } from '../engine/core/engine';
import { refreshAutomaticInertia as utilRefreshInertia } from '../engine/dynamics/inertia';
import { detectManifold } from '../engine/detection/detect';
import {
    correctPositions,
    solveContactsIterative,
    type ContactConstraint,
} from '../engine/solver/solver';

function unpackVec3(
    value: Vec3Like | number,
    y?: number,
    z?: number,
): [number, number, number] {
    if (typeof value === 'number') return [value, y ?? 0, z ?? 0];
    return [value.x, value.y, value.z];
}

/**
 * Information describing a collision contact between two nodes in the scene.
 * Exposed via the PhysicsService events; prefer using the FC hooks unless you
 * need lower-level access.
 */
export type CollisionPair = {
    aNode: Node;
    bNode: Node;
    normal: Vec3; // from a -> b
    depth: number;
};

/**
 * Physics simulation service providing linear and angular integration, collisions, and raycasts.
 *
 * @example
 * ```ts
 * const physics = new PhysicsService({ gravity: { x: 0, y: -9.81, z: 0 } });
 * world.provideService(physics);
 * physics.setGravity(0, -12, 0);
 * ```
 */
export class PhysicsService extends Service {
    readonly options: Readonly<PhysicsOptions>;

    private gravity = new Vec3(0, -9.81, 0);
    private bodies = new Set<RigidBody>();
    private colliders = new Set<Collider>();
    private cellSize: number;

    //#region Events

    /**
     * Fires every step for each pair that remains overlapping.
     * Prefer `useOnCollision` for function components.
     */
    readonly collisions = new TypedEvent<CollisionPair>();
    /**
     * Fires once when an overlap between two colliders begins.
     * Prefer `useOnCollisionStart` for function components.
     */
    readonly collisionStart = new TypedEvent<CollisionPair>();
    /**
     * Fires once when an overlap between two colliders ends.
     * Prefer `useOnCollisionEnd` for function components.
     */
    readonly collisionEnd = new TypedEvent<CollisionPair>();

    //#endregion

    // Persistent collision-pair Maps — reused every step via .clear() + pointer
    // swap to avoid the two `new Map()` allocations that would otherwise occur
    // at 60 Hz. _currentPairs is populated this step; _lastPairs holds the
    // previous step's result for start/end event diffing.
    private _lastPairs = new Map<number, CollisionPair>();
    private _currentPairs = new Map<number, CollisionPair>();
    private engine: PhysicsEngine = DefaultEngine;

    /**
     * Creates a new physics service.
     * @param opts Initial configuration; see {@link PhysicsOptions}.
     */
    constructor(opts: PhysicsOptions = {}) {
        super();
        this.options = Object.freeze({ ...opts });
        const g = opts.gravity as any;
        if (g) this.gravity.set(g.x ?? 0, g.y ?? 0, g.z ?? 0);
        this.cellSize = Math.max(0.0001, opts.cellSize ?? 1);
    }

    /** @internal */
    attach(world: any): void {
        super.attach(world);
        // On attach, sweep existing nodes to auto-register any pre-existing bodies/colliders
        try {
            for (const n of (world as any).nodes as Set<Node>) {
                const rb = getComponent(n, RigidBody);
                if (rb) this.bodies.add(rb);
                const col = getComponent(n, Collider);
                if (col) this.colliders.add(col);
            }
        } catch {}
    }

    //#region Registration API for components

    /** @internal */
    registerRigidBody(rb: RigidBody): void {
        this.bodies.add(rb);
        this.refreshAutomaticInertia(rb);
    }
    /** @internal */
    unregisterRigidBody(rb: RigidBody): void {
        this.bodies.delete(rb);
    }
    /** @internal */
    registerCollider(c: Collider): void {
        this.colliders.add(c);
        const rb = getComponent(c.owner, RigidBody);
        if (rb) this.refreshAutomaticInertia(rb);
    }
    /** @internal */
    unregisterCollider(c: Collider): void {
        this.colliders.delete(c);
        const rb = getComponent(c.owner, RigidBody);
        if (rb) this.refreshAutomaticInertia(rb);
    }

    //#endregion

    private refreshAutomaticInertia(rb: RigidBody): void {
        utilRefreshInertia(rb, (c) => this.colliders.has(c));
    }

    /**
     * Returns the current gravity vector, optionally writing into an output Vec3.
     *
     * @example
     * ```ts
     * const g = physics.getGravity();
     * console.log(g.y);
     * ```
     * @returns Either the provided `out` vector filled with gravity or a cloned Vec3.
     */
    getGravity(out?: Vec3): Vec3 {
        if (out) return out.set(this.gravity.x, this.gravity.y, this.gravity.z);
        return this.gravity.clone();
    }

    /**
     * Overrides the global gravity vector used for integration.
     *
     * @example
     * ```ts
     * physics.setGravity(0, -20, 0);
     * ```
     */
    setGravity(value: Vec3Like | number, y?: number, z?: number): void {
        const [gx, gy, gz] = unpackVec3(value, y, z);
        this.gravity.set(gx, gy, gz);
    }

    /**
     * Advances the physics simulation by the supplied time step.
     *
     * Steps performed (simple terms):
     * - Update velocities: apply impulses, forces, gravity, and damping.
     * - Apply movement: integrate velocities to positions and rotations.
     * - Find potential overlaps: fast pass using bounding boxes.
     * - Confirm collisions: accurate shape checks between candidates.
     * - Resolve and notify: separate overlapping bodies, apply bounce/friction, emit events.
     *
     * @param dt Delta time in seconds since the previous step.
     * @example
     * physics.step(1 / 60);
     */
    step(dt: number): void {
        this._currentPairs.clear();

        // 1) Integrate linear/angular impulses and forces
        this.engine.integrator.updateVelocities(
            this.bodies,
            this.gravity,
            dt,
            (c: Collider) => this.colliders.has(c),
        );

        // 2) Integrate velocities -> positions (+ optional world plane)
        this.engine.integrator.applyMovement(
            this.bodies,
            dt,
            this.options.worldPlaneY,
        );

        // 3) Find potential overlaps (fast pass using bounding boxes)
        const pairs = this.engine.pairFinder.findPairs(
            this.colliders,
            this.cellSize,
        );

        // 4) Confirm collisions, build constraints, then solve iteratively
        const constraints: ContactConstraint[] = [];
        for (const [a, b] of pairs) {
            if (!this.engine.filter.shouldCollide(a, b)) continue;
            const pts = detectManifold(a, b);
            if (!pts || pts.length === 0) continue;
            const { nx, ny, nz, depth } = pts[0]!; // representative for event
            const key = this.pairKey(a.owner, b.owner);
            const pair: CollisionPair = {
                aNode: a.owner,
                bNode: b.owner,
                normal: new Vec3(nx, ny, nz),
                depth,
            };
            this._currentPairs.set(key, pair);

            const rbA = getComponent(a.owner, RigidBody);
            const rbB = getComponent(b.owner, RigidBody);
            const invMassA =
                rbA && rbA.type === 'dynamic' ? rbA.inverseMass : 0;
            const invMassB =
                rbB && rbB.type === 'dynamic' ? rbB.inverseMass : 0;
            if (!(a.isTrigger || b.isTrigger) && invMassA + invMassB > 0)
                for (const p of pts)
                    constraints.push({
                        a,
                        b,
                        nx: p.nx,
                        ny: p.ny,
                        nz: p.nz,
                        depth: p.depth,
                    });

            this.collisions.emit(pair);
        }

        // Positional correction (split correction): move bodies out of penetration
        const slop = (this.options as any).contactSlop ?? 0.005;
        const beta = (this.options as any).baumgarte ?? 0.2;
        for (const c of constraints) correctPositions(c, slop);
        // Iterative velocity solve
        const iters = Math.max(1, (this.options as any).iterations ?? 4);
        solveContactsIterative(constraints, iters, dt, slop, beta);

        // 5) Start/End events
        for (const [k, p] of this._currentPairs)
            if (!this._lastPairs.has(k)) this.collisionStart.emit(p);
        for (const [k, p] of this._lastPairs)
            if (!this._currentPairs.has(k)) this.collisionEnd.emit(p);
        // Swap maps: _currentPairs becomes _lastPairs for the next step;
        // _lastPairs is cleared at the top of the next step.
        const _tmp = this._lastPairs;
        this._lastPairs = this._currentPairs;
        this._currentPairs = _tmp;
    }

    private pairKey(a: Node, b: Node): number {
        // Pack two IDs into a single number — order-independent so (a,b) === (b,a).
        // Uses triangular encoding: lo + hi*(hi+1)/2, which is unique for any
        // non-negative integer pair and stays within JS safe-integer range for
        // the node counts typical in a game scene.
        const lo = a.id < b.id ? a.id : b.id;
        const hi = a.id < b.id ? b.id : a.id;
        return lo + (hi * (hi + 1)) / 2;
    }

    //#region Raycast

    /**
     * Casts a ray through the physics scene, returning the closest hit or null.
     * @param origin World-space ray origin.
     * @param dir Normalised ray direction.
     * @param maxDist Maximum distance to search for intersections.
     * @param filter Optional predicate to skip colliders.
     *
     * @example
     * ```ts
     * const hit = physics.raycast(new Vec3(0, 1, -5), new Vec3(0, 0, 1), 10);
     * if (hit) console.log(hit.node.id);
     * ```
     * @returns The closest {@link RaycastHit} or `null` if nothing is intersected.
     */
    raycast(
        origin: Vec3,
        dir: Vec3,
        maxOrOpts:
            | number
            | { mask?: number; filter?: (c: Collider) => boolean } = Infinity,
        filter?: (c: Collider) => boolean,
    ): RaycastHit | null {
        return this.engine.raycaster.cast(
            this.colliders,
            origin,
            dir,
            maxOrOpts as any,
            filter,
        );
    }

    //#endregion
}
