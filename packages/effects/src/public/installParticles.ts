import { useWorld, useFrameUpdate, useDestroy } from '@pulse-ts/core';
import { useThreeRoot } from '@pulse-ts/three';
import {
    ParticlesService,
    type ParticlesInstallOptions,
} from '../domain/ParticlesService';

/**
 * Convenience installer that registers a {@link ParticlesService} on the
 * current world and wires up Three.js rendering + per-frame ticking.
 *
 * Must be called from a node context (needs Three.js scene access via
 * `useThreeRoot`). After installation, hooks like {@link useParticleBurst}
 * and {@link useParticleEmitter} can be used in any descendant node.
 *
 * @param options - Optional service configuration (pool size, default particle size).
 * @returns The created {@link ParticlesService}.
 *
 * @example
 * ```ts
 * import { installParticles } from '@pulse-ts/effects';
 *
 * function RootNode() {
 *     installParticles({ maxPerPool: 300, defaultSize: 0.1 });
 * }
 * ```
 */
export function installParticles(
    options: ParticlesInstallOptions = {},
): ParticlesService {
    const world = useWorld();
    const service = new ParticlesService(options);
    world.provideService(service);

    const root = useThreeRoot();
    root.position.set(0, 0, 0);
    service.setRoot(root);

    useFrameUpdate((dt) => service.tick(dt));
    useDestroy(() => service.dispose());

    return service;
}
