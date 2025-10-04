import type { World } from '@pulse-ts/core';
import type { SaveFile, SaveOptions, LoadOptions } from './types';
import * as impl from '../domain/world';

/**
 * Saves the world to a JSON-safe object.
 * @param world The world to serialize.
 * @param opts Optional save options (e.g., includeTime).
 * @returns A JSON-safe save file object.
 * @example
 * import { World } from '@pulse-ts/core';
 * import { installSave, saveWorld } from '@pulse-ts/save';
 * const world = new World();
 * installSave(world);
 * const save = saveWorld(world, { includeTime: true });
 * const json = JSON.stringify(save);
 */
export function saveWorld(world: World, opts: SaveOptions = {}): SaveFile {
    return impl.saveWorld(world, opts);
}

/**
 * Loads a save object into an existing world in-place.
 * Matches nodes by StableId when present, else by numeric id.
 * @param world The target world to mutate.
 * @param save The save file previously produced by {@link saveWorld}.
 * @param opts Load options (strict, resetPrevious, applyTime).
 * @example
 * import { loadWorld } from '@pulse-ts/save';
 * // ... obtain `save` via saveWorld or from storage
 * loadWorld(world, save, { applyTime: true, resetPrevious: true });
 */
export function loadWorld(
    world: World,
    save: SaveFile,
    opts: LoadOptions = {},
): void {
    return impl.loadWorld(world, save, opts);
}

/**
 * Rebuilds the world from a save object by remounting saved Functional Nodes
 * and reapplying serialized components.
 * @param world The world to clear and rebuild.
 * @param save The save file to rebuild from.
 * @param opts Load options (resetPrevious, applyTime).
 * @example
 * import { loadWorldRebuild } from '@pulse-ts/save';
 * loadWorldRebuild(world, save, { applyTime: true });
 */
export function loadWorldRebuild(
    world: World,
    save: SaveFile,
    opts: LoadOptions = {},
): void {
    return impl.loadWorldRebuild(world, save, opts);
}
