import { Vec3 } from './math/vec3';
import { Quat } from './math/quat';
import type { Node } from './node';

const SYM = Symbol('pulse:transform');

const internal_owner = Symbol('pulse:transform:owner');
const internal_dirty = Symbol('pulse:transform:dirty');

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
    }

    /**
     * Edits the local position, rotation, and scale.
     * @param fn The function to edit the transform.
     */
    editLocal(fn: (t: this) => void) {
        fn(this);
        this[internal_dirty] = true;
    }

    /**
     * Gets the local position, rotation, and scale.
     * @param alpha The alpha value.
     * @returns The local position, rotation, and scale.
     */
    getLocalTRS(alpha?: number) {
        const w = this[internal_owner].world;
        const a = alpha ?? (w ? w.getAmbientAlpha() : 0);
        const local = this.interpolateLocal(a);

        let pos = local.position.clone();
        let rot = local.rotation.clone();
        let scale = local.scale.clone();

        return { position: pos, rotation: rot, scale };
    }

    /**
     * Gets the world position, rotation, and scale.
     * @param alpha The alpha value.
     * @returns The world position, rotation, and scale.
     */
    getWorldTRS(alpha?: number) {
        const w = this[internal_owner].world;
        const a = alpha ?? (w ? w.getAmbientAlpha() : 0);
        const local = this.interpolateLocal(a);

        let pos = local.position.clone();
        let rot = local.rotation.clone();
        let scale = local.scale.clone();

        const parent = this[internal_owner].parent;
        if (!parent) return { position: pos, rotation: rot, scale };

        const pt = maybeGetTransform(parent);
        if (!pt) return { position: pos, rotation: rot, scale };

        const pw = pt.getWorldTRS(a);
        // worldScale = parentScale * localScale
        scale.multiply(pw.scale);
        // worldRotation = parentRot * localRot
        rot = Quat.multiply(pw.rotation, rot);
        // worldPosition = parentPos + (parentRot * (localPos * parentScale))
        const scaled = local.position.clone().multiply(pw.scale);
        const r = Quat.rotateVector(pw.rotation, scaled);
        pos.set(pw.position.x + r.x, pw.position.y + r.y, pw.position.z + r.z);
        return { position: pos, rotation: rot, scale };
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
     * Interpolates the local position, rotation, and scale.
     * @param alpha The alpha value.
     * @returns The interpolated position, rotation, and scale.
     */
    private interpolateLocal(alpha: number) {
        return {
            position:
                alpha > 0
                    ? Vec3.lerp(
                          this.previousLocalPosition,
                          this.localPosition,
                          alpha,
                      )
                    : this.localPosition,
            rotation:
                alpha > 0
                    ? Quat.slerp(
                          this.previousLocalRotation,
                          this.localRotation,
                          alpha,
                      )
                    : this.localRotation,
            scale:
                alpha > 0
                    ? Vec3.lerp(this.previousLocalScale, this.localScale, alpha)
                    : this.localScale,
        };
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
    t[internal_owner] = node;
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
