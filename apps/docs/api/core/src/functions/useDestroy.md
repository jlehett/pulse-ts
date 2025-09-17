[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useDestroy

# Function: useDestroy()

> **useDestroy**(`fn`): `void`

Defined in: [core/src/fc/hooks.ts:54](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L54)

Registers a destroy/cleanup hook for the current component.

- Destroy hooks run when the `Node` is destroyed (explicitly or via parent destruction) or when the component is unmounted.
- Hooks are executed in reverse registration order after any registered disposers.

## Parameters

### fn

() => `void`

The function to run on destruction.

## Returns

`void`
