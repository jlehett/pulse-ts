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
export const kWorldRegisterTick = Symbol('pulse:world:registerTick');
export const kWorldAddTransform = Symbol('pulse:world:addTransform');
export const kWorldRemoveTransform = Symbol('pulse:world:removeTransform');
export const kWorldEmitNodeParentChanged = Symbol(
    'pulse:world:emitNodeParentChanged',
);

// Internal node hooks
export const kRegisteredTicks = Symbol('pulse:node:registeredTicks');
export const kRegisterTick = Symbol('pulse:node:registerTick');

// Internal transform hooks
export const kTransform = Symbol('pulse:transform');
export const kTransformOwner = Symbol('pulse:transform:owner');
export const kTransformDirty = Symbol('pulse:transform:dirty');
