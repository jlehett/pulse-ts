import type { World } from '@pulse-ts/core';
import { registerCoreSerializers } from '../infra/serializers/core';
import { registerThreeSerializers } from '../infra/serializers/three';

export interface InstallSaveOptions {
    /** Optional plugins to enable during installation. */
    plugins?: string[];
}

/**
 * Convenience installer for @pulse-ts/save.
 * Registers core serializers and optional plugin serializers.
 * @param _world Reserved for future world-specific setup.
 * @param opts Optional plugin list (e.g., ['@pulse-ts/three']).
 * @example
 * import { World } from '@pulse-ts/core';
 * import { installSave } from '@pulse-ts/save';
 * const world = new World();
 * installSave(world, { plugins: ['@pulse-ts/three'] });
 */
export function installSave(_world?: World, opts: InstallSaveOptions = {}) {
    registerCoreSerializers();
    const plugins = opts.plugins ?? [];
    if (plugins.includes('@pulse-ts/three')) {
        registerThreeSerializers();
    }
}
