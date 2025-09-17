import type { World } from '@pulse-ts/core';
import { InputCommitSystem } from './systems/commit';
import { InputService } from './services/Input';
import { DOMKeyboardProvider } from './providers/domKeyboard';
import { DOMPointerProvider } from './providers/domPointer';
import type { InputOptions, ExprBindings } from './bindings/types';

/**
 * Options for the installInput function.
 */
export type InstallInputOptions = InputOptions & {
    /**
     * Default bindings to use for the input service.
     */
    bindings?: ExprBindings;
};

/**
 * Convenience installer for @pulse-ts/input.
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
