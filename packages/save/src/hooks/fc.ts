import { __fcCurrent, type FC } from '@pulse-ts/core';
import { attachComponent } from '@pulse-ts/core';
import { SaveFC } from '../components/SaveFC';
import { registerFC } from '../registries/fcRegistry';

/**
 * Marks the current FC for persistence with a stable id and serializable props.
 * Call at the top of your FC.
 * @param id The stable string identifier to assign.
 * @param props The props to assign to the FC.
 */
export function useSaveFC<P = any>(id: string, props?: P): void {
    const { node } = __fcCurrent();
    const meta = attachComponent(node, SaveFC);
    meta.type = id;
    meta.props = props as unknown;
}

/**
 * Wraps an FC so it auto-registers for rebuild and auto-attaches save metadata on mount.
 *
 * - Avoids manual `registerFC(id, FC)` and `useSaveFC(id, props)` calls.
 * - The returned FC is what you should export and mount.
 * - Optionally map props before persisting to keep the save file minimal.
 *
 * Usage:
 *   export const MyThing = defineFC('game:my-thing', (props) => { ... });
 *
 * @param id Stable id for save files.
 * @param fc The function component to wrap.
 * @param opts Optional behavior tweaks.
 */
export function defineFC<P>(
    id: string,
    fc: FC<P>,
    opts: { autoRegister?: boolean; mapProps?: (p: P) => unknown } = {},
): FC<P> {
    const autoRegister = opts.autoRegister !== false;
    const map = opts.mapProps ?? ((p: P) => p as unknown);

    const wrapped: FC<P> = (props: Readonly<P>) => {
        // Record FC metadata for save files
        try {
            useSaveFC(id, map(props as P));
        } catch {
            // If called outside of FC mount context, ignore; mount will call again.
        }
        // Run original FC
        fc(props);
    };

    // Attach metadata for optional external tooling/introspection
    (wrapped as any).__save = { id };

    if (autoRegister) {
        // Register the wrapped FC so rebuild loads remount with auto-metadata
        registerFC(id, wrapped);
    }

    return wrapped;
}

/** Curried variant of defineFC for ergonomic composition. */
export function withSave<P>(
    id: string,
    opts: { autoRegister?: boolean; mapProps?: (p: P) => unknown } = {},
) {
    return (fc: FC<P>) => defineFC<P>(id, fc, opts);
}
