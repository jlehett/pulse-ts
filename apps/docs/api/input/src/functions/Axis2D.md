[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Axis2D

# Function: Axis2D()

> **Axis2D**(`axes`): [`Axis2DBinding`](../type-aliases/Axis2DBinding.md)

Defined in: [input/src/bindings/expr.ts:68](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/expr.ts#L68)

Create an Axis2D binding.

## Parameters

### axes

`Record`\<`string`, \{ `neg?`: [`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]; `pos?`: [`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]; `scale?`: `number`; \}\>

The axes to bind. Each key is the name of the axis, and the value is the axis definition.

## Returns

[`Axis2DBinding`](../type-aliases/Axis2DBinding.md)

The Axis2D binding.
