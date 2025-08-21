/**
 * Phase-aware ticking decorators that let a single class opt into:
 * - fixed-step phases:    @fixedEarly / @fixedUpdate / @fixedLate
 * - frame-step phases:    @tickEarly  / @tickUpdate  / @tickLate
 *
 * Each decorated method must be: (deltaSeconds: number) => void
 * Priorities are per phase via { order?: number }.
 */

export enum UpdatePhase {
    Early = 0,
    Update = 1,
    Late = 2,
}
export type UpdateKind = 'frame' | 'fixed';

type TickKey = string | symbol;
export type TickFunction = (deltaSeconds: number) => void;

const SYMBOL_TICK_METADATA = Symbol('engine:tick:metadata');

type PhaseEntry = { key: TickKey; order: number };
export type TickMetadata = {
    frame?: Partial<Record<UpdatePhase, PhaseEntry>>;
    fixed?: Partial<Record<UpdatePhase, PhaseEntry>>;
};

function ensureMetadata(instance: any): TickMetadata {
    let metadata = instance[SYMBOL_TICK_METADATA] as TickMetadata | undefined;
    if (!metadata) {
        metadata = Object.create(null);
        Object.defineProperty(instance, SYMBOL_TICK_METADATA, {
            value: metadata,
            enumerable: false,
            configurable: false,
            writable: false,
        });
    }
    return metadata as TickMetadata;
}

/**
 * Method decorator factory that registers a method as a tick handler
 * for a specific kind (fixed/frame) and phase (early/update/late).
 */
export function tick(
    kind: UpdateKind,
    phase: UpdatePhase,
    options?: { order?: number },
) {
    return function <T>(
        value: TickFunction,
        context: ClassMethodDecoratorContext<T, TickFunction>,
    ) {
        if (context.static)
            throw new Error('@tick cannot be applied to static methods');
        const methodKey = context.name as TickKey;
        const order = options?.order ?? 0;

        // Compile-time type safety via the decorator's function signature (TickFunction)
        context.addInitializer(function (this: any) {
            const metadata = ensureMetadata(this);
            const bucket = (metadata[kind] ??= {});
            // Last writer wins; subclasses can override the same phase
            (bucket as any)[phase] = { key: methodKey, order };
        });

        return value;
    };
}

// Ergonomic wrappers for frame-step phases
export const tickEarly = (o?: { order?: number }) =>
    tick('frame', UpdatePhase.Early, o);
export const tickUpdate = (o?: { order?: number }) =>
    tick('frame', UpdatePhase.Update, o);
export const tickLate = (o?: { order?: number }) =>
    tick('frame', UpdatePhase.Late, o);

// Ergonomic wrappers for fixed-step phases
export const fixedEarly = (o?: { order?: number }) =>
    tick('fixed', UpdatePhase.Early, o);
export const fixedUpdate = (o?: { order?: number }) =>
    tick('fixed', UpdatePhase.Update, o);
export const fixedLate = (o?: { order?: number }) =>
    tick('fixed', UpdatePhase.Late, o);

// #region Helpers used by World

/** Returns instance metadata (if any). */
export function getTickMetadata(object: unknown): TickMetadata | null {
    return object && typeof object === 'object'
        ? ((object as any)[SYMBOL_TICK_METADATA] ?? null)
        : null;
}

export function hasTick(
    object: unknown,
    kind: UpdateKind,
    phase: UpdatePhase,
): boolean {
    return !!getTickMetadata(object)?.[kind]?.[phase];
}

export function getTickOrder(
    object: unknown,
    kind: UpdateKind,
    phase: UpdatePhase,
): number {
    return getTickMetadata(object)?.[kind]?.[phase]?.order ?? 0;
}

/** Invokes the method registered for the given kind/phase on the instance, if present. */
export function callTick(
    object: unknown,
    kind: UpdateKind,
    phase: UpdatePhase,
    deltaSeconds: number,
): void {
    const entry = getTickMetadata(object)?.[kind]?.[phase];
    if (!entry) return;
    (object as any)[entry.key](deltaSeconds);
}

// #endregion
