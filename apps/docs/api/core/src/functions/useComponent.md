[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useComponent

# Function: useComponent()

> **useComponent**\<`T`\>(`Component`): `T`

Defined in: [core/src/fc/hooks.ts:66](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L66)

Ensures the current `Node` has a `Transform` attached and returns it.

- Subsequent calls return the same `Transform` instance.
- The transform provides interpolated local and world TRS queries.

## Type Parameters

### T

`T` *extends* [`Component`](../classes/Component.md)

## Parameters

### Component

() => `T`

## Returns

`T`

The `Transform` attached to the current `Node`.
