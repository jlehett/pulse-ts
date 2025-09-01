import type { FC } from '@pulse-ts/core';

/**
 * Map of FC type id -> FC constructor
 */
const idToFC = new Map<string, FC<any>>();

/**
 * Register a function component for save/load.
 * @param id Stable id used in save files (e.g., 'game:rts-camera')
 * @param fc The function component constructor
 */
export function registerFC<P = any>(id: string, fc: FC<P>): void {
    idToFC.set(id, fc as FC<any>);
}

/**
 * Lookup a registered FC by id.
 * @param id The id to lookup the FC for.
 * @returns The FC for the given id, or undefined if no FC is registered.
 */
export function getFC(id: string): FC<any> | undefined {
    return idToFC.get(id);
}
