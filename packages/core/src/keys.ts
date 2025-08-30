/**
 * Central registry for engine-wide symbols and service typing.
 * Keeps internals consistent and avoids ad-hoc Symbol creation across files.
 */

/**
 * The service key type.
 */
export type ServiceKey<T> = symbol & { __service?: T };

/**
 * Creates a new service key.
 * @param desc The description of the service.
 * @returns The new service key.
 */
export function createServiceKey<T>(desc: string): ServiceKey<T> {
    return Symbol(desc) as ServiceKey<T>;
}

// Internal world hooks
export const kWorldAddTransform = Symbol('pulse:world:addTransform');
export const kWorldRemoveTransform = Symbol('pulse:world:removeTransform');
export const kWorldAddBounds = Symbol('pulse:world:addBounds');
export const kWorldRemoveBounds = Symbol('pulse:world:removeBounds');

// Internal node hooks
export const kRegisteredTicks = Symbol('pulse:node:registeredTicks');

// Internal transform hooks
export const kTransform = Symbol('pulse:transform');
export const kTransformOwner = Symbol('pulse:transform:owner');
export const kTransformDirty = Symbol('pulse:transform:dirty');

// Internal bounds hooks
export const kBounds = Symbol('pulse:bounds');
export const kBoundsOwner = Symbol('pulse:bounds:owner');
