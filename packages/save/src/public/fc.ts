import { __fcCurrent, type FC } from '@pulse-ts/core';
import { attachComponent } from '@pulse-ts/core';
import { SaveFC } from '../domain/components/SaveFC';
import { registerFC } from '../domain/registries/fcRegistry';

/**
 * Marks the current FC for persistence with a stable id and serializable props.
 * Call at the top of your FC.
 * @param id Stable id string written into the save file.
 * @param props Serializable props to persist for rebuild.
 * @example
 * import { useSaveFC } from '@pulse-ts/save';
 * export const Player = () => {
 *   useSaveFC('game:player', { speed: 2 });
 * };
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
 * @param id Stable id for save files.
 * @param fc The function component to wrap.
 * @param opts Optional config (autoRegister, mapProps).
 * @example
 * import { defineFC } from '@pulse-ts/save';
 * export const MyThing = defineFC('game:my-thing', (props) => { void props; });
 * @example
 * // Persist only specific props to keep save files lean
 * const Player = defineFC('game:player', (p: { x: number; y: number; z: number }) => void p, {
 *   mapProps: ({ x, z }) => ({ x, z }),
 * });
 */
export function defineFC<P>(
    id: string,
    fc: FC<P>,
    opts: { autoRegister?: boolean; mapProps?: (p: P) => unknown } = {},
): FC<P> {
    const autoRegister = opts.autoRegister !== false;
    const map = opts.mapProps ?? ((p: P) => p as unknown);

    const wrapped: FC<P> = (props: Readonly<P>) => {
        try {
            useSaveFC(id, map(props as P));
        } catch {
            // If called outside of FC mount context, ignore; mount will call again.
        }
        fc(props);
    };

    (wrapped as any).__save = { id };

    if (autoRegister) {
        registerFC(id, wrapped);
    }

    return wrapped;
}

/**
 * Curried variant of {@link defineFC} for ergonomic composition.
 * @param id Stable id for save files.
 * @param opts Optional config (autoRegister, mapProps).
 * @example
 * import { withSave } from '@pulse-ts/save';
 * const Saved = withSave('game:thing')((props) => void props);
 */
export function withSave<P>(
    id: string,
    opts: { autoRegister?: boolean; mapProps?: (p: P) => unknown } = {},
) {
    return (fc: FC<P>) => defineFC<P>(id, fc, opts);
}
