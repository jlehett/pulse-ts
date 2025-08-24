/**
 * Phase-aware ticking decorators that let a single class opt into:
 * - fixed-step phases:    @fixedEarly / @fixedUpdate / @fixedLate
 * - frame-step phases:    @tickEarly  / @tickUpdate  / @tickLate
 *
 * Each decorated method must be: (deltaSeconds: number) => void
 * Priorities are per phase via { order?: number }.
 */

/**
 * Enum of phases in which an update can occur. By default, each 'frame' or
 * 'fixed' update cycle performs the following phases, in order:
 * 1. `Early`
 * 2. `Update`
 * 3. `Late`
 */
export enum UpdatePhase {
    Early = 0,
    Update = 1,
    Late = 2,
}

/**
 * The kind of update being performed.
 * - `'frame'`: Update running once for every rendered frame.
 * - `'fixed'`: Update running on a fixed interval, regardless of frame rate; helpful
 *              for physics logic.
 */
export type UpdateKind = 'frame' | 'fixed';

/**
 * A key under which a tick method is being stored in TickMetadata.
 */
type TickKey = string | symbol;

/**
 * A function that takes in a delta in seconds (since last tick) and does something.
 */
export type TickFunction = (deltaSeconds: number) => void;

/**
 * The private symbol under which tick metadata is stored on object instances.
 */
const SYMBOL_TICK_METADATA = Symbol('engine:tick:metadata');

/**
 * A specific tick-based functionality definition.
 */
type PhaseEntry = { key: TickKey; order: number };

/**
 * Metadata tracking all tick-based functionality for an object instance.
 */
export type TickMetadata = {
    /**
     * All `'frame'` tick-based functionality for the object instance. Runs once per frame.
     */
    frame?: Partial<Record<UpdatePhase, PhaseEntry>>;
    /**
     * All `'fixed'` tick-based functionality for the object instance. Runs on a fixed time interval.
     */
    fixed?: Partial<Record<UpdatePhase, PhaseEntry>>;
};

/**
 * Ensure tick metadata is defined on the given object instance. If it isn't already
 * defined, it will then be defined w/ a value of an empty object.
 * @param instance The object instance to ensure tick metadata is defined on.
 * @returns
 */
function ensureMetadata(instance: any): TickMetadata {
    let metadata = instance[SYMBOL_TICK_METADATA] as TickMetadata | undefined;
    if (!metadata) {
        metadata = Object.create(null);
        Object.defineProperty(instance, SYMBOL_TICK_METADATA, {
            value: metadata,
            // We don't want the tick metadata to be interacted w/ directly outside
            // of internal library usage
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
 * @param kind
 * @param phase
 * @param [options.order] Optional fine-grained control over order in which tick-based
 *  functionality runs within a phase.
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

/**
 * Ergonomic wrapper for defining a frame-based tick method in the early phase.
 */
export const tickEarly = (o?: { order?: number }) =>
    tick('frame', UpdatePhase.Early, o);

/**
 * Ergonomic wrapper for defining a frame-based tick method in the update phase.
 */
export const tickUpdate = (o?: { order?: number }) =>
    tick('frame', UpdatePhase.Update, o);

/**
 * Ergonomic wrapper for defining a frame-based tick method in the late phase.
 */
export const tickLate = (o?: { order?: number }) =>
    tick('frame', UpdatePhase.Late, o);

/**
 * Ergonomic wrapper for defining a fixed-based tick method in the early phase.
 */
export const fixedEarly = (o?: { order?: number }) =>
    tick('fixed', UpdatePhase.Early, o);

/**
 * Ergonomic wrapper for defining a fixed-based tick method in the update phase.
 */
export const fixedUpdate = (o?: { order?: number }) =>
    tick('fixed', UpdatePhase.Update, o);

/**
 * Ergonomic wrapper for defining a fixed-based tick method in the late phase.
 */
export const fixedLate = (o?: { order?: number }) =>
    tick('fixed', UpdatePhase.Late, o);

// #region Helpers used by World

/**
 * Returns tick metadata on the object (if any).
 * @param object The object for which to get tick metadata.
 * @returns The tick metadata, if it exists; otherwise, null.
 */
export function getTickMetadata(object: unknown): TickMetadata | null {
    return object && typeof object === 'object'
        ? ((object as any)[SYMBOL_TICK_METADATA] ?? null)
        : null;
}

/**
 * Returns a boolean flag indicating whether the given object has any tick-based functionality
 * for the given `UpdateKind` and `UpdatePhase`, based on the tick metadata on the object.
 * @param object The object for which to check if tick-based functionality exists.
 * @param kind The kind of update to check for (e.g., frame or fixed).
 * @param phase The phase to check for (e.g., early, update, or late).
 * @returns True if a tick method of the given kind and phase is defined on the given object; otherwise, false.
 */
export function hasTick(
    object: unknown,
    kind: UpdateKind,
    phase: UpdatePhase,
): boolean {
    return !!getTickMetadata(object)?.[kind]?.[phase];
}

/**
 * Get the manual execution order that has been specified for the tick method of the given kind and phase
 * on the given object.
 * @param object The object to check.
 * @param kind The kind of update to check (e.g., frame or fixed).
 * @param phase The phase to check (e.g., early, update, or late).
 * @returns The manual execution order that has been specified for the tick method of the given kind and
 *  phase on the given object, if it is defined; otherwise, a default execution order of `0` is assumed.
 */
export function getTickOrder(
    object: unknown,
    kind: UpdateKind,
    phase: UpdatePhase,
): number {
    return getTickMetadata(object)?.[kind]?.[phase]?.order ?? 0;
}

/** Invokes the method registered for the given kind/phase on the instance, if present. */

/**
 * Invokes the method registered for the given kind/phase on the instance, if present. Otherwise
 * a no-op.
 * @param object The object for which to call the tick method.
 * @param kind The kind of tick method to call (e.g., frame or fixed).
 * @param phase The phase of tick method to call (e.g., early, update, or late).
 * @param deltaSeconds The time delta in seconds from the last relevant tick to now.
 */
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
