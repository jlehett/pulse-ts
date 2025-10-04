import { __fcCurrent } from '@pulse-ts/core';
import { InputService } from '../domain/services/Input';
import type {
    ActionState,
    PointerSnapshot,
    Vec,
} from '../domain/bindings/types';

/**
 * Get the `InputService` bound to the current world.
 * @returns The `InputService` instance.
 *
 * @example
 * ```ts
 * import { useInput } from '@pulse-ts/input';
 * const input = useInput();
 * // use inside FC hooks to query actions/axes
 * ```
 */
export function useInput(): InputService {
    const world = __fcCurrent().world;
    const svc = world.getService(InputService);
    if (!svc)
        throw new Error(
            'InputService not provided. Call installInput(world) first.',
        );
    return svc;
}

/**
 * Create an accessor for an action's state.
 * @param name Action name.
 * @returns A function that returns the latest `ActionState` when called.
 *
 * @example
 * ```ts
 * import { useAction } from '@pulse-ts/input';
 * const jump = useAction('jump');
 * // inside frame update
 * const { pressed } = jump();
 * ```
 */
export function useAction(name: string): () => ActionState {
    const svc = useInput();
    return () => svc.action(name);
}

/**
 * Create an accessor for a 1D axis value.
 * @param name Axis name.
 * @returns A function that returns the latest numeric axis value.
 *
 * @example
 * ```ts
 * import { useAxis1D } from '@pulse-ts/input';
 * const zoom = useAxis1D('zoom');
 * const value = zoom();
 * ```
 */
export function useAxis1D(name: string): () => number {
    const svc = useInput();
    return () => svc.axis(name);
}

/**
 * Create an accessor for a 2D axis vector.
 * @param name Axis2D name (e.g., `move`).
 * @returns A function that returns a `{[key:string]:number}` vector.
 *
 * @example
 * ```ts
 * import { useAxis2D } from '@pulse-ts/input';
 * const move = useAxis2D('move');
 * const { x, y } = move();
 * ```
 */
export function useAxis2D(name: string): () => Vec {
    const svc = useInput();
    return () => svc.vec2(name);
}

/**
 * Create an accessor for the pointer snapshot for this frame.
 * @returns A function that returns the latest `PointerSnapshot`.
 *
 * @example
 * ```ts
 * import { usePointer } from '@pulse-ts/input';
 * const pointer = usePointer();
 * const { deltaX, deltaY } = pointer();
 * ```
 */
export function usePointer(): () => PointerSnapshot {
    const svc = useInput();
    return () => svc.pointerState();
}
