import { Vec3 } from './math/vec3';
import { Quat } from './math/quat';
import type { Node } from './node';
import {
    kWorldAddTransform,
    kTransformOwner,
    kTransformDirty,
    kTransform,
} from './keys';

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
            owner[kTransformDirty] = true;
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
            owner[kTransformDirty] = true;
            owner._localVersion++;
            return true;
        },
    });
}

/**
 * A transform.
 */
export class Transform {
    [kTransformOwner]!: Node;
    [kTransformDirty] = true;

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
    private _cachedAncestryVersion = 0;
    private _treeQueryFrame = -1;
    private _cachedWorldTreeVersion = -1;
    private _cachedWorld = createTRS();

    get owner(): Node {
        return this[kTransformOwner];
    }

    constructor() {
        this.localPosition = makeDirtyVec3(this, new Vec3());
        this.previousLocalPosition = new Vec3();
        this.localRotation = makeDirtyQuat(this, new Quat());
        this.previousLocalRotation = new Quat();
        this.localScale = makeDirtyVec3(this, new Vec3(1, 1, 1));
        this.previousLocalScale = new Vec3(1, 1, 1);
    }

    /**
     * Gets the ancestry version.
     * @param frameId The frame id.
     * @returns The ancestry version.
     */
    getAncestryVersion(frameId: number): number {
        if (this._treeQueryFrame === frameId)
            return this._cachedAncestryVersion;
        let v = this._localVersion;
        const parent = this[kTransformOwner].parent;
        if (parent) {
            const pt = maybeGetTransform(parent);
            if (pt) v = Math.max(v, pt.getAncestryVersion(frameId));
        }
        this._treeQueryFrame = frameId;
        this._cachedAncestryVersion = v;
        return v;
    }

    /**
     * Copies the current local position, rotation, and scale to the previous values.
     */
    snapshotPrevious(): void {
        this.previousLocalPosition.copy(this.localPosition);
        this.previousLocalRotation.copy(this.localRotation);
        this.previousLocalScale.copy(this.localScale);
        // we just committed current->previous; clear dirty
        this[kTransformDirty] = false;
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
        this[kTransformDirty] = true;
        this._localVersion++;
    }

    /**
     * Edits the local position, rotation, and scale.
     * @param fn The function to edit the transform.
     */
    editLocal(fn: (t: this) => void) {
        fn(this);
        this[kTransformDirty] = true;
        this._localVersion++;
    }

    /**
     * Gets the local position, rotation, and scale.
     * @param out The output TRS. If not provided, a new TRS will be created.
     * @param alpha The alpha value.
     * @returns The local position, rotation, and scale.
     */
    getLocalTRS(out?: TRS, alpha?: number) {
        const w = this[kTransformOwner].world;
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
        const w = this[kTransformOwner].world;
        const a = alpha ?? (w ? w.getAmbientAlpha() : 0);

        // For a>0, interpolation changes every frame; don't cache
        if (a > 0) {
            const local = this.getLocalTRS(this._scratchLocal, a);
            const o = out ?? createTRS();
            o.position.copy(local.position);
            o.rotation.copy(local.rotation);
            o.scale.copy(local.scale);

            const parent = this[kTransformOwner].parent;
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

        // a === 0: use ancestry version to avoid composing parent unless needed
        const local = this.getLocalTRS(this._scratchLocal, 0);
        const o = out ?? createTRS();

        const parent = this[kTransformOwner].parent;
        let treeVersion = this._localVersion;
        if (parent) {
            const pt = maybeGetTransform(parent);
            if (pt) {
                const frameId = w ? w.getFrameId() : 0;
                treeVersion = Math.max(
                    treeVersion,
                    pt.getAncestryVersion(frameId),
                );
            }
        }

        if (this._cachedWorldTreeVersion === treeVersion) {
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
        this._cachedWorldTreeVersion = treeVersion;
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

    /**
     * A monotonically increasing version that changes whenever the cached world TRS updates.
     * Useful for external sync systems to detect whether a recomposition occurred for alpha=0.
     */
    getWorldVersion(): number {
        return this._worldVersion;
    }

    //#endregion
}

/**
 * Attaches a transform to a node.
 * @param node The node to attach the transform to.
 * @returns The transform.
 */
export function attachTransform(node: Node): Transform {
    if ((node as any)[kTransform]) return (node as any)[kTransform];
    const t = new Transform();
    Object.defineProperty(node, kTransform, { value: t, enumerable: false });
    (t as any)[kTransformOwner] = node;
    // if already in a world, register this transform for snapshots
    if (node.world && (node.world as any)[kWorldAddTransform]) {
        (node.world as any)[kWorldAddTransform](t);
    }
    return t;
}

/**
 * Gets the transform attached to a node, if any.
 * @param node The node to get the transform of.
 * @returns The transform, or undefined if no transform is attached.
 */
export function maybeGetTransform(node: Node): Transform | undefined {
    return (node as any)[kTransform] as Transform | undefined;
}

/**
 * Gets the transform attached to a node. If no transform is attached, it will be created.
 * @param node The node to get the transform of.
 * @returns The transform.
 */
export function getTransform(node: Node): Transform {
    return attachTransform(node);
}
