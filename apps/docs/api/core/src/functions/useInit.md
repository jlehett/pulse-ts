[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useInit

# Function: useInit()

> **useInit**(`fn`): `void`

Defined in: [core/src/fc/hooks.ts:42](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L42)

Registers an initialization hook for the current component.

- Each function runs after the component function body has executed and the `Node` was added to the `World`.
- If the function returns another function, that returned function is registered as a destroy/cleanup hook.

## Parameters

### fn

() => `void` \| () => `void`

The function to run on initialization. Optionally returns a cleanup function.

## Returns

`void`
