import type { FC } from '@pulse-ts/core';

const idToFC = new Map<string, FC<any>>();

/**
 * Register a Function Component so rebuild loads can remount by id.
 * @param id Stable id used in save files (e.g., 'game:player').
 * @param fc The function component reference.
 * @example
 * import { registerFC } from '@pulse-ts/save';
 * registerFC('game:thing', (props) => void props);
 */
export function registerFC<P = any>(id: string, fc: FC<P>): void {
    idToFC.set(id, fc as FC<any>);
}

/** Lookup a previously registered FC by id. */
export function getFC(id: string): FC<any> | undefined {
    return idToFC.get(id);
}

/** Internal: test-only reset helper. */
export function __resetFCRegistryForTests() {
    idToFC.clear();
}
