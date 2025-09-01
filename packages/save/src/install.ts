import type { World } from '@pulse-ts/core';
import { registerCoreComponentSerializers } from './coreSerializers';

/**
 * Convenience installer for @pulse-ts/save.
 * Currently registers built-in serializers for core components.
 */
export function installSave(_world?: World) {
    // No world-specific hooks yet; reserved for future extensions
    registerCoreComponentSerializers();
}
