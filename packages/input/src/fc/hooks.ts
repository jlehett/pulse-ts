import { __fcCurrent } from '@pulse-ts/core';
import { InputService } from '../services/Input';
import type { ActionState, PointerSnapshot, Vec } from '../bindings/types';

/**
 * Get the InputService.
 * @returns The InputService.
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
 * Get the action state for a given action name.
 * @param name The name of the action.
 * @returns The action state.
 */
export function useAction(name: string): () => ActionState {
    const svc = useInput();
    return () => svc.action(name);
}

/**
 * Get the axis state for a given axis name.
 * @param name The name of the axis.
 * @returns The axis state.
 */
export function useAxis1D(name: string): () => number {
    const svc = useInput();
    return () => svc.axis(name);
}

/**
 * Get the axis 2D state for a given axis name.
 * @param name The name of the axis 2D.
 * @returns The axis 2D state.
 */
export function useAxis2D(name: string): () => Vec {
    const svc = useInput();
    return () => svc.vec2(name);
}

/**
 * Get the pointer state.
 * @returns The pointer state.
 */
export function usePointer(): () => PointerSnapshot {
    const svc = useInput();
    return () => svc.pointerState();
}
