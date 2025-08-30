import { Vec3 } from './math/vec3';
import { Quat } from './math/quat';
import type { Node } from './node';
import { __worldAddTransform } from './world';

const SYM = Symbol('pulse:transform');
const internal_owner = Symbol('pulse:transform:owner');
const internal_dirty = Symbol('pulse:transform:dirty');

/**
 * Reusable container for position/rotation/scale triples.
 */
export interface TRS {
    position: Vec3;
    rotation: Quat;
    scale: Vec3;
}

/**
 * Creates a new TRS.
 */
export function createTRS(): TRS {
    return {
        position: new Vec3(),
        rotation: new Quat(),
        scale: new Vec3(1, 1, 1),
    };
}

/**
 * Creates a proxy for a Vec3 that marks the transform as dirty when the vector is modified.
 * @param owner The transform that owns the vector.
 * @param v The vector to proxy.
 * @returns A proxy for the vector.
 */
function makeDirtyVec3(owner: Transform, v: Vec3): Vec3 {
    return new Proxy(v, {
        set(target, prop, value) {
            (target as any)[prop] = value;
            owner[internal_dirty] = true;
            owner._localVersion++;
            return true;
        },
    });
}

/**
 * Creates a proxy for a Quat that marks the transform as dirty when the quaternion is modified.
 * @param owner The transform that owns the quaternion.
 * @param q The quaternion to proxy.
 * @returns A proxy for the quaternion.
 */
function makeDirtyQuat(owner: Transform, q: Quat): Quat {
    return new Proxy(q, {
        set(target, prop, value) {
            (target as any)[prop] = value;
            owner[internal_dirty] = true;
            owner._localVersion++;
            return true;
        },
    });
}

/**
 * A transform.
 */
export class Transform {
    [internal_owner]!: Node;
    [internal_dirty] = true;

    readonly localPosition: Vec3;
    readonly previousLocalPosition: Vec3;
    readonly localRotation: Quat;
    readonly previousLocalRotation: Quat;
    readonly localScale: Vec3;
    readonly previousLocalScale: Vec3;

    // allocation-free scratch
    private _scratchLocal = createTRS();
    private _scratchParentWorld = createTRS();

    // dirty/caching
    _localVersion = 0;
    private _worldVersion = 0;
    private _cacheParentWorldVersion = -1;
    private _cacheLocalVersion = -1;
    private _cachedWorld = createTRS();

    constructor() {
        this.localPosition = makeDirtyVec3(this, new Vec3());
        this.previousLocalPosition = new Vec3();
        this.localRotation = makeDirtyQuat(this, new Quat());
        this.previousLocalRotation = new Quat();
        this.localScale = makeDirtyVec3(this, new Vec3(1, 1, 1));
        this.previousLocalScale = new Vec3(1, 1, 1);
    }

    /**
     * Copies the current local position, rotation, and scale to the previous values.
     */
    snapshotPrevious(): void {
        this.previousLocalPosition.copy(this.localPosition);
        this.previousLocalRotation.copy(this.localRotation);
        this.previousLocalScale.copy(this.localScale);
        // we just committed current->previous; clear dirty
        this[internal_dirty] = false;
    }

    /**
     * Sets the local position, rotation, and scale.
     * @param opts The options to set.
     */
    setLocal(opts: {
        position?: Partial<Vec3>;
        rotationQuat?: Partial<Quat>;
        scale?: Partial<Vec3>;
    }) {
        if (opts.position) Object.assign(this.localPosition, opts.position);
        if (opts.rotationQuat)
            Object.assign(this.localRotation, opts.rotationQuat);
        if (opts.scale) Object.assign(this.localScale, opts.scale);
        this[internal_dirty] = true;
        this._localVersion++;
    }

    /**
     * Edits the local position, rotation, and scale.
     * @param fn The function to edit the transform.
     */
    editLocal(fn: (t: this) => void) {
        fn(this);
        this[internal_dirty] = true;
        this._localVersion++;
    }

    /**
     * Gets the local position, rotation, and scale.
     * @param out The output TRS. If not provided, a new TRS will be created.
     * @param alpha The alpha value.
     * @returns The local position, rotation, and scale.
     */
    getLocalTRS(out?: TRS, alpha?: number) {
        const w = this[internal_owner].world;
        const a = alpha ?? (w ? w.getAmbientAlpha() : 0);
        const o = out ?? createTRS();

        if (a > 0) {
            Vec3.lerpInto(
                this.previousLocalPosition,
                this.localPosition,
                a,
                o.position,
            );
            Quat.slerpInto(
                this.previousLocalRotation,
                this.localRotation,
                a,
                o.rotation,
            );
            Vec3.lerpInto(this.previousLocalScale, this.localScale, a, o.scale);
        } else {
            o.position.copy(this.localPosition);
            o.rotation.copy(this.localRotation);
            o.scale.copy(this.localScale);
        }
        return o;
    }

    /**
     * Gets the world position, rotation, and scale.
     * @param out The output TRS. If not provided, a new TRS will be created.
     * @param alpha The alpha value.
     * @returns The world position, rotation, and scale.
     */
    getWorldTRS(out?: TRS, alpha?: number) {
        const w = this[internal_owner].world;
        const a = alpha ?? (w ? w.getAmbientAlpha() : 0);

        // For a>0, interpolation changes every frame; don't cache
        if (a > 0) {
            const local = this.getLocalTRS(this._scratchLocal, a);
            const o = out ?? createTRS();
            o.position.copy(local.position);
            o.rotation.copy(local.rotation);
            o.scale.copy(local.scale);

            const parent = this[internal_owner].parent;
            if (!parent) return o;
            const pt = maybeGetTransform(parent);
            if (!pt) return o;

            const pw = pt.getWorldTRS(this._scratchParentWorld, a);
            o.scale.multiply(pw.scale);
            Quat.multiply(pw.rotation, o.rotation, o.rotation);
            o.position.multiply(pw.scale);
            Quat.rotateVector(pw.rotation, o.position, o.position);
            o.position.set(
                pw.position.x + o.position.x,
                pw.position.y + o.position.y,
                pw.position.z + o.position.z,
            );
            return o;
        }

        // a === 0: can cache world composition until parent/local changes
        const local = this.getLocalTRS(this._scratchLocal, 0);
        const o = out ?? createTRS();

        const parent = this[internal_owner].parent;
        let parentWorldVersion = 0;
        if (parent) {
            const pt = maybeGetTransform(parent);
            if (pt) {
                pt.getWorldTRS(this._scratchParentWorld, 0); // ensure parent world is up-to-date
                parentWorldVersion = pt._worldVersion;
            }
        }

        if (
            this._cacheParentWorldVersion === parentWorldVersion &&
            this._cacheLocalVersion === this._localVersion
        ) {
            // copy cached
            o.position.copy(this._cachedWorld.position);
            o.rotation.copy(this._cachedWorld.rotation);
            o.scale.copy(this._cachedWorld.scale);
            return o;
        }

        // recompute and cache
        o.position.copy(local.position);
        o.rotation.copy(local.rotation);
        o.scale.copy(local.scale);

        if (parent) {
            const pt = maybeGetTransform(parent);
            if (pt) {
                const pw = pt.getWorldTRS(this._scratchParentWorld, 0);
                o.scale.multiply(pw.scale);
                Quat.multiply(pw.rotation, o.rotation, o.rotation);
                o.position.multiply(pw.scale);
                Quat.rotateVector(pw.rotation, o.position, o.position);
                o.position.set(
                    pw.position.x + o.position.x,
                    pw.position.y + o.position.y,
                    pw.position.z + o.position.z,
                );
            }
        }

        this._cachedWorld.position.copy(o.position);
        this._cachedWorld.rotation.copy(o.rotation);
        this._cachedWorld.scale.copy(o.scale);
        this._cacheParentWorldVersion = parentWorldVersion;
        this._cacheLocalVersion = this._localVersion;
        this._worldVersion++;
        return o;
    }

    /**
     * Gets the world position.
     */
    get worldPosition() {
        return this.getWorldTRS().position;
    }

    /**
     * Gets the world rotation.
     */
    get worldRotation() {
        return this.getWorldTRS().rotation;
    }

    /**
     * Gets the world scale.
     */
    get worldScale() {
        return this.getWorldTRS().scale;
    }
}

/**
 * Attaches a transform to a node.
 * @param node The node to attach the transform to.
 * @returns The transform.
 */
export function attachTransform(node: Node): Transform {
    if ((node as any)[SYM]) return (node as any)[SYM];
    const t = new Transform();
    Object.defineProperty(node, SYM, { value: t, enumerable: false });
    (t as any)[internal_owner] = node;
    // if already in a world, register this transform for snapshots
    if (node.world && (node.world as any)[__worldAddTransform]) {
        (node.world as any)[__worldAddTransform](t);
    }
    return t;
}

/**
 * Gets the transform attached to a node, if any.
 * @param node The node to get the transform of.
 * @returns The transform, or undefined if no transform is attached.
 */
export function maybeGetTransform(node: Node): Transform | undefined {
    return (node as any)[SYM] as Transform | undefined;
}

/**
 * Gets the transform attached to a node. If no transform is attached, it will be created.
 * @param node The node to get the transform of.
 * @returns The transform.
 */
export function getTransform(node: Node): Transform {
    return attachTransform(node);
}

/**
 * The symbol used to attach the transform to a node.
 */
export const TRANSFORM_SYMBOL = SYM;
