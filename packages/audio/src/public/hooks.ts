import { __fcCurrent } from '@pulse-ts/core';
import { AudioService } from '../domain/services/Audio';

/**
 * Returns the {@link AudioService} registered on the current world.
 *
 * This is the primary hook for accessing audio functionality inside a
 * functional component. It throws if no `AudioService` has been provided
 * (i.e. {@link installAudio} was not called).
 *
 * @returns The `AudioService` instance.
 * @throws If `AudioService` has not been installed on the world.
 *
 * @example
 * ```ts
 * import { useAudio } from '@pulse-ts/audio';
 *
 * function SoundEmitter() {
 *     const audio = useAudio();
 *     const ctx = audio.ensureContext();
 *     // … create oscillators, buffers, etc.
 * }
 * ```
 */
export function useAudio(): AudioService {
    const world = __fcCurrent().world;
    const service = world.getService(AudioService);
    if (!service) {
        throw new Error(
            'AudioService not provided to world. Call installAudio(world) first.',
        );
    }
    return service;
}
