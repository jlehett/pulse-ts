/**
 * Central registry for engine-wide symbols and service typing.
 * Keeps internals consistent and avoids ad-hoc Symbol creation across files.
 */

// Internal component hooks
export const kSetComponentOwner = Symbol('pulse:setComponentOwner');

// Internal node hooks
export const kRegisteredTicks = Symbol('pulse:node:registeredTicks');

// Internal transform hooks
export const kTransformDirty = Symbol('pulse:transform:dirty');
