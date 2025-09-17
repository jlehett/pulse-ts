import type { World } from '@pulse-ts/core';
import { registerCoreSerializers } from './serializers/coreSerializers';
import { registerThreeSerializers } from './serializers/threeSerializers';

export interface InstallSaveOptions {
    /** Optional plugins to enable during installation. */
    plugins?: string[];
}

/**
 * Convenience installer for @pulse-ts/save.
 */
export function installSave(_world?: World, opts: InstallSaveOptions = {}) {
    // No world-specific hooks yet; reserved for future extensions
    registerCoreSerializers();

    // Handle optional plugins
    const plugins = opts.plugins ?? [];
    if (plugins.includes('@pulse-ts/three')) {
        // Register serializers for @pulse-ts/three components (if any)
        registerThreeSerializers();
    }
}
