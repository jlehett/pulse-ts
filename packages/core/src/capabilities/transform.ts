import { Vec3 } from '../math/vec3';
import { Quat } from '../math/quat';

/**
 * Renderer-agnostic Transform:
 * - Unity-like: local TRS relative to parent.
 * - `previous*` snapshots for interpolation between fixed steps.
 * - Mark dirty on change; commit after simulation to lock in previous=current.
 *
 * You generally:
 *   1) mutate localPosition/localRotation/localScale in fixed update
 *   2) call commit() once per fixed step (TransformCommitter can do it for you)
 *   3) renderers may lerp/slerp previous->current with alphas in [0,1]
 */

/**
 * The private symbol under which transform data is stored on object instances.
 */
const SYMBOL_TRANSFORM = Symbol('engine:transform');

export const internal_attachOwner = Symbol('engine:transform:attachOwner');

export class Transform {
    //#region Fields

    /* Local position (relative to parent). */
    private readonly localPosition = new Vec3();
    /* Local rotation (relative to parent). */
    private readonly localRotation = new Quat();
    /* Local scale (relative to parent). */
    private readonly localScale = new Vec3(1, 1, 1);

    /* Previous local position (relative to parent); for interpolation. */
    private readonly previousLocalPosition = new Vec3();
    /* Previous local rotation (relative to parent); for interpolation. */
    private readonly previousLocalRotation = new Quat();
    /* Previous local scale (relative to parent); for interpolation. */
    private readonly previousLocalScale = new Vec3(1, 1, 1);

    /**
     * Flag indicating whether the transform data has been modified.
     */
    private dirty = false;

    /* Backref to owning node (set by @withTransform initializer). */
    private owner: any | null = null;

    //#endregion

    //#region Public Methods

    /**
     * Mark the Transform data as modified.
     */
    markDirty(): void {
        this.dirty = true;
    }

    /**
     * Get the flag indicating whether the Transform data has been modified.
     * @returns Flag indicating whether the Transform data has been modified.
     */
    isDirty(): boolean {
        return this.dirty;
    }

    /**
     * Commit the current TRS data by updating the previous data stores to match.
     * Then set the `dirty` flag to `false.
     */
    commit(): void {
        this.previousLocalPosition.copy(this.localPosition);
        this.previousLocalRotation.copy(this.localRotation);
        this.previousLocalScale.copy(this.localScale);
        this.dirty = false;
    }

    /* Convenience setter for updating local position. */
    setLocalPosition(x: number, y: number, z: number): this {
        this.localPosition.set(x, y, z);
        this.dirty = true;
        return this;
    }
    /* Convenience setter for updating local scale. */
    setLocalScale(x: number, y: number, z: number): this {
        this.localScale.set(x, y, z);
        this.dirty = true;
        return this;
    }
    /* Convenience setter for updating local rotation via a Quaternion. */
    setLocalRotationQuat(x: number, y: number, z: number, w: number): this {
        this.localRotation.set(x, y, z, w).normalize();
        this.dirty = true;
        return this;
    }
    /* Convenience setter for updating local rotation via Euler. */
    setLocalRotationEuler(yaw: number, pitch: number, roll: number): this {
        this.localRotation.copy(Quat.fromEuler(yaw, pitch, roll));
        this.dirty = true;
        return this;
    }

    /**
     * Get the world TRS of the transform.
     * @param alpha The alpha value to use for interpolation; if not provided, the ambient alpha is used.
     * @returns The world TRS of the transform.
     */
    getWorldTRS(alpha?: number): {
        position: Vec3;
        rotation: Quat;
        scale: Vec3;
    } {
        const a = this.resolveAlpha(alpha);

        // Local at this alpha
        const {
            position: lp,
            rotation: lr,
            scale: ls,
        } = a > 0
            ? this.interpolateLocal(a)
            : {
                  position: this.localPosition,
                  rotation: this.localRotation,
                  scale: this.localScale,
              };

        const outP = lp.clone();
        const outR = lr.clone();
        const outS = ls.clone();

        const parent = maybeGetTransform(this.owner?.parent) ?? null;
        if (!parent) return { position: outP, rotation: outR, scale: outS };

        // Compose with parent's world at same alpha
        const pw = parent.getWorldTRS(a);
        // worldScale = parentScale * localScale
        outS.x *= pw.scale.x;
        outS.y *= pw.scale.y;
        outS.z *= pw.scale.z;
        // worldRotation = parentRot * localRot
        Quat.multiply(pw.rotation, outR, outR);
        // worldPosition = parentPos + (parentRot * (localPos * parentScale))
        const scaled = new Vec3(
            lp.x * pw.scale.x,
            lp.y * pw.scale.y,
            lp.z * pw.scale.z,
        );
        const rotated = Quat.rotateVector(pw.rotation, scaled);
        outP.x = pw.position.x + rotated.x;
        outP.y = pw.position.y + rotated.y;
        outP.z = pw.position.z + rotated.z;

        return { position: outP, rotation: outR, scale: outS };
    }

    /**
     * Get the world position of the transform.
     * @param alpha The alpha value to use for interpolation.
     * @returns The world position of the transform.
     */
    getWorldPosition(alpha = 0): Vec3 {
        return this.getWorldTRS(alpha).position;
    }

    /**
     * Get the world rotation of the transform.
     * @param alpha The alpha value to use for interpolation.
     * @returns The world rotation of the transform.
     */
    getWorldRotation(alpha = 0): Quat {
        return this.getWorldTRS(alpha).rotation;
    }

    /**
     * Get the world scale of the transform.
     * @param alpha The alpha value to use for interpolation.
     * @returns The world scale of the transform.
     */
    getWorldScale(alpha = 0): Vec3 {
        return this.getWorldTRS(alpha).scale;
    }

    /**
     * Get the local TRS of the transform.
     * @param alpha The alpha value to use for interpolation; if not provided, the ambient alpha is used.
     * @returns The local TRS of the transform.
     */
    getLocalTRS(alpha?: number): {
        position: Vec3;
        rotation: Quat;
        scale: Vec3;
    } {
        const a = this.resolveAlpha(alpha);

        return a > 0
            ? this.interpolateLocal(a)
            : {
                  position: this.localPosition,
                  rotation: this.localRotation,
                  scale: this.localScale,
              };
    }

    /**
     * Get the local position of the transform.
     * @param alpha The alpha value to use for interpolation; if not provided, the ambient alpha is used.
     * @returns The local position of the transform.
     */
    getLocalPosition(alpha?: number): Vec3 {
        return this.getLocalTRS(alpha).position;
    }

    /**
     * Get the local rotation of the transform.
     * @param alpha The alpha value to use for interpolation; if not provided, the ambient alpha is used.
     * @returns The local rotation of the transform.
     */
    getLocalRotation(alpha?: number): Quat {
        return this.getLocalTRS(alpha).rotation;
    }

    /**
     * Get the local scale of the transform.
     * @param alpha The alpha value to use for interpolation; if not provided, the ambient alpha is used.
     * @returns The local scale of the transform.
     */
    getLocalScale(alpha?: number): Vec3 {
        return this.getLocalTRS(alpha).scale;
    }

    //#endregion

    //#region Internal Library Methods

    [internal_attachOwner](owner: any) {
        this.owner = owner;
    }

    //#endregion

    //#region Private Methods

    /**
     * Resolve the alpha value to use for interpolation.
     * @param alpha The alpha value to use for interpolation.
     * @returns The alpha value to use for interpolation.
     */
    private resolveAlpha(alpha?: number): number {
        if (alpha != null) return alpha;
        const world = this.owner?.world;
        return world ? world.getAmbientAlpha() : 0;
    }

    /* Interpolate local TRS at alpha in [0,1]. */
    private interpolateLocal(
        alpha: number,
        out?: { position?: Vec3; rotation?: Quat; scale?: Vec3 },
    ) {
        const pos = out?.position ?? new Vec3();
        const rot = out?.rotation ?? new Quat();
        const scl = out?.scale ?? new Vec3();

        Vec3.lerp(this.previousLocalPosition, this.localPosition, alpha, pos);
        Quat.slerp(this.previousLocalRotation, this.localRotation, alpha, rot);
        Vec3.lerp(this.previousLocalScale, this.localScale, alpha, scl);

        return { position: pos, rotation: rot, scale: scl };
    }

    //#endregion
}

/* Class decorator: attach a Transform to each instance. */
export function withTransform<
    T extends abstract new (...args: any[]) => object,
>(target: T, context: ClassDecoratorContext<T>) {
    // Add an initializer to the class to attach the transform to the instance
    context.addInitializer(function (this: any) {
        const t = new Transform();
        t[internal_attachOwner](this);
        Object.defineProperty(this, SYMBOL_TRANSFORM, {
            value: t,
            // We don't want the transform data to be interacted w/ directly outside
            // of internal library usage
            enumerable: false,
            configurable: false,
            writable: false,
        });
    });
}

/**
 * Returns a boolean flag indicating whether the given object has a `Transform` defined.
 * @param obj The object for which to check.
 * @returns True if the object has a `Transform` defined; otherwise, false.
 */
export function hasTransform(obj: unknown): boolean {
    return !!obj && typeof obj === 'object' && SYMBOL_TRANSFORM in (obj as any);
}

/**
 * Get the `Transform` for the given object. If the object does not have a `Transform` defined,
 * it will be lazily attached.
 * @param obj The object to check.
 * @returns The object's `Transform`.
 */
export function getTransform<T extends object>(obj: T): Transform {
    let t = (obj as any)[SYMBOL_TRANSFORM] as Transform | undefined;
    if (!t) {
        // Lazily attach if the decorator hasn't run yet (or was omitted)
        t = new Transform();
        t[internal_attachOwner](obj);
        Object.defineProperty(obj, SYMBOL_TRANSFORM, {
            value: t,
            // We don't want the transform data to be interacted w/ directly outside
            // of internal library usage
            enumerable: false,
            configurable: false,
            writable: false,
        });
    }
    return t;
}

/**
 * Get the `Transform` for the given object, if it exists.
 * @param obj The object to check.
 * @returns The object's `Transform`, if it exists; otherwise null.
 */
export function maybeGetTransform<T extends object>(
    obj: T,
): Transform | undefined {
    return (
        (obj && typeof obj === 'object' && (obj as any)[SYMBOL_TRANSFORM]) ||
        null
    );
}
