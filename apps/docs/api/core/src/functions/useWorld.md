[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useWorld

# Function: useWorld()

> **useWorld**(): [`World`](../classes/World.md)

Defined in: [core/src/fc/hooks.ts:18](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L18)

Returns the `World` that is currently mounting the active function component.

- Only callable during `world.mount(...)` while the component function is executing.
- Throws if used outside of component mount (similar to React hook rules).
- The returned reference is stable for the lifetime of the component.

## Returns

[`World`](../classes/World.md)

The current `World` instance.
