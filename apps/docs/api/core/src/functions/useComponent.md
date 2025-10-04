[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useComponent

# Function: useComponent()

> **useComponent**\<`T`\>(`Component`): `T`

Defined in: [packages/core/src/domain/fc/hooks.ts:102](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/domain/fc/hooks.ts#L102)

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
