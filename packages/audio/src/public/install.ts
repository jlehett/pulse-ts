import type { World } from '@pulse-ts/core';
import { AudioService, type AudioOptions } from '../domain/services/Audio';

/**
 * Convenience installer for `@pulse-ts/audio`. Registers an
 * {@link AudioService} on the given world with the specified options.
 *
 * @param world - The world to install into.
 * @param options - Optional audio configuration (e.g. master volume).
 * @returns The created and registered `AudioService`.
 *
 * @example
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { installAudio } from '@pulse-ts/audio';
 *
 * const world = new World();
 * const audio = installAudio(world, { masterVolume: 0.8 });
 * ```
 */
export function installAudio(
    world: World,
    options: AudioOptions = {},
): AudioService {
    return world.provideService(new AudioService(options));
}
