[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useComponent

# Function: useComponent()

> **useComponent**\<`T`\>(`Component`): `T`

Defined in: [packages/core/src/domain/fc/hooks.ts:102](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/fc/hooks.ts#L102)

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
