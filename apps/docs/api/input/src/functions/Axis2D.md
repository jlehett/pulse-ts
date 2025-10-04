[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Axis2D

# Function: Axis2D()

> **Axis2D**(`axes`): [`Axis2DBinding`](../type-aliases/Axis2DBinding.md)

Defined in: packages/input/src/domain/bindings/expr.ts:86

Create an Axis2D binding.

## Parameters

### axes

`Record`\<`string`, \{ `neg?`: [`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]; `pos?`: [`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]; `scale?`: `number`; \}\>

The axes to bind. Each key is the name of the axis, and the value is the axis definition.

## Returns

[`Axis2DBinding`](../type-aliases/Axis2DBinding.md)

The Axis2D binding.

Example
```ts
import { Axis2D, Key } from '@pulse-ts/input';
const move = Axis2D({ x: { pos: Key('D'), neg: Key('A') }, y: { pos: Key('W'), neg: Key('S') } });
```
