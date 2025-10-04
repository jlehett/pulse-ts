[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useDestroy

# Function: useDestroy()

> **useDestroy**(`fn`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:90](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/fc/hooks.ts#L90)

Registers a destroy/cleanup hook for the current component.

- Destroy hooks run when the `Node` is destroyed (explicitly or via parent destruction) or when the component is unmounted.
- Hooks are executed in reverse registration order after any registered disposers.

## Parameters

### fn

() => `void`

The function to run on destruction.

## Returns

`void`
