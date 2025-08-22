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

const SYMBOL_TRANSFORM = Symbol('engine:transform');

export class Transform {
    // Local (relative to parent)
    readonly localPosition = new Vec3();
    readonly localRotation = new Quat();
    readonly localScale = new Vec3(1, 1, 1);

    // Previous local (for interpolation)
    readonly previousLocalPosition = new Vec3();
    readonly previousLocalRotation = new Quat();
    readonly previousLocalScale = new Vec3(1, 1, 1);

    private dirty = false;

    markDirty(): void {
        this.dirty = true;
    }
    isDirty(): boolean {
        return this.dirty;
    }

    commit(): void {
        this.previousLocalPosition.copy(this.localPosition);
        this.previousLocalRotation.copy(this.localRotation);
        this.previousLocalScale.copy(this.localScale);
        this.dirty = false;
    }

    // Convenience setters
    setLocalPosition(x: number, y: number, z: number): this {
        this.localPosition.set(x, y, z);
        this.dirty = true;
        return this;
    }
    setLocalScale(x: number, y: number, z: number): this {
        this.localScale.set(x, y, z);
        this.dirty = true;
        return this;
    }
    setLocalRotationQuat(x: number, y: number, z: number, w: number): this {
        this.localRotation.set(x, y, z, w).normalize();
        this.dirty = true;
        return this;
    }
    setLocalRotationEuler(yaw: number, pitch: number, roll: number): this {
        this.localRotation.copy(Quat.fromEuler(yaw, pitch, roll));
        this.dirty = true;
        return this;
    }

    /** Interpolate local TRS at alpha in [0,1]. */
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
}

/** Class decorator: attach a Transform to each instance. */
export function withTransform<
    T extends abstract new (...args: any[]) => object,
>(target: T, context: ClassDecoratorContext<T>) {
    context.addInitializer(function (this: any) {
        if (!(SYMBOL_TRANSFORM in this)) {
            Object.defineProperty(this, SYMBOL_TRANSFORM, {
                value: new Transform(),
                enumerable: false,
                configurable: false,
                writable: false,
            });
        }
    });
}

/** Presence / accessors */
export function hasTransform(obj: unknown): boolean {
    return !!obj && typeof obj === 'object' && SYMBOL_TRANSFORM in (obj as any);
}
export function getTransform<T extends object>(obj: T): Transform {
    const t = (obj as any)[SYMBOL_TRANSFORM] as Transform | undefined;
    if (!t)
        throw new Error(
            'Object does not have a Transform. Did you forget @withTransform?',
        );
    return t;
}
export function maybeGetTransform<T extends object>(
    obj: T,
): Transform | undefined {
    return (
        (obj && typeof obj === 'object' && (obj as any)[SYMBOL_TRANSFORM]) ||
        null
    );
}
