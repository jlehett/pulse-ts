/**
 * Constructor type for class-based APIs.
 */
export type Ctor<T> = new () => T;

/**
 * The kind of update.
 * - `fixed` is used for fixed time updates, like physics.
 * - `frame` is used for frame-based updates, like animations.
 */
export type UpdateKind = 'fixed' | 'frame';

/**
 * The phase of the update. Phases are run in the following order:
 * 1. `early`
 * 2. `update`
 * 3. `late`
 */
export type UpdatePhase = 'early' | 'update' | 'late';

/**
 * A tick function.
 * @param dt The delta time in seconds.
 */
export type TickFn = (dt: number) => void;

/**
 * A tick registration.
 */
export interface TickRegistration {
    node: import('./node').Node;
    kind: UpdateKind;
    phase: UpdatePhase;
    order: number;
    fn: TickFn;
    active: boolean;

    // O(1) unlink support (assigned by the world)
    prev: TickRegistration | null;
    next: TickRegistration | null;
    dispose(): void;
}

/**
 * A component constructor type, constrained to Pulse components.
 *
 * Use this alias for typed component constructor arrays in queries and helpers.
 *
 * @example
 * ```ts
 * import { type ComponentCtor } from '@pulse-ts/core';
 * import { Transform, Bounds } from '@pulse-ts/core';
 * const has: readonly ComponentCtor[] = [Transform, Bounds];
 * ```
 */
export type ComponentCtor<
    T extends import('./Component').Component = import('./Component').Component,
> = new () => T;
