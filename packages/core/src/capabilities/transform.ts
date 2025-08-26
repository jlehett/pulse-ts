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

export class Transform {
    //#region Fields

    /* Local position (relative to parent). */
    readonly localPosition = new Vec3();
    /* Local rotation (relative to parent). */
    readonly localRotation = new Quat();
    /* Local scale (relative to parent). */
    readonly localScale = new Vec3(1, 1, 1);

    /* Previous local position (relative to parent); for interpolation. */
    readonly previousLocalPosition = new Vec3();
    /* Previous local rotation (relative to parent); for interpolation. */
    readonly previousLocalRotation = new Quat();
    /* Previous local scale (relative to parent); for interpolation. */
    readonly previousLocalScale = new Vec3(1, 1, 1);

    /**
     * Flag indicating whether the transform data has been modified.
     */
    private dirty = false;

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

    /* Interpolate local TRS at alpha in [0,1]. */
    interpolateLocal(
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
    context.addInitializer(function (this: any) {
        if (!(SYMBOL_TRANSFORM in this)) {
            Object.defineProperty(this, SYMBOL_TRANSFORM, {
                value: new Transform(),
                // We don't want the transform data to be interacted w/ directly outside
                // of internal library usage
                enumerable: false,
                configurable: false,
                writable: false,
            });
        }
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
