import type { World } from '@pulse-ts/core';
import { InputCommitSystem } from '../domain/systems/commit';
import { InputService } from '../domain/services/Input';
import { DOMKeyboardProvider } from '../infra/providers/domKeyboard';
import { DOMPointerProvider } from '../infra/providers/domPointer';
import type { InputOptions, ExprBindings } from '../domain/bindings/types';

/**
 * Options for the `installInput` function.
 */
export type InstallInputOptions = InputOptions & {
    /**
     * Default bindings to use for the input service.
     */
    bindings?: ExprBindings;
};

/**
 * Convenience installer for `@pulse-ts/input`.
 * Wires up the `InputService`, registers DOM providers when available, and
 * adds `InputCommitSystem` to snapshot input at frame.early.
 *
 * @param world The world to install into.
 * @param opts Optional install options and default bindings.
 * @returns The created and registered `InputService`.
 *
 * @example
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { installInput, Axis2D, Key } from '@pulse-ts/input';
 *
 * const world = new World();
 * const input = installInput(world, {
 *   preventDefault: true,
 *   bindings: {
 *     move: Axis2D({ x: { pos: Key('D'), neg: Key('A') }, y: { pos: Key('W'), neg: Key('S') } })
 *   }
 * });
 * // later in your FC, read via hooks
 * ```
 */
export function installInput(
    world: World,
    opts: InstallInputOptions = {},
): InputService {
    const svc = world.provideService(new InputService(opts));
    if (opts.bindings) svc.setBindings(opts.bindings);

    // Register DOM providers when in a browser-like environment
    const hasDom =
        typeof window !== 'undefined' && typeof document !== 'undefined';
    const target = opts.target ?? (hasDom ? window : null);

    if (target) {
        svc.registerProvider(
            new DOMKeyboardProvider(svc, {
                preventDefault: !!opts.preventDefault,
            }),
        );
        svc.registerProvider(
            new DOMPointerProvider(svc, {
                preventDefault: !!opts.preventDefault,
                pointerLock: !!opts.pointerLock,
            }),
        );
    }

    world.addSystem(new InputCommitSystem());
    return svc;
}
