[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Axis2D

# Function: Axis2D()

> **Axis2D**(`axes`): [`Axis2DBinding`](../type-aliases/Axis2DBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:86](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/expr.ts#L86)

Create an Axis2D binding (mapping two Axis1D to a vector, e.g., WASD).

## Parameters

### axes

`Record`\<`string`, \{ `neg?`: [`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]; `pos?`: [`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]; `scale?`: `number`; \}\>

Map of component name → axis definition (e.g., `{ x: {...}, y: {...} }`).

## Returns

[`Axis2DBinding`](../type-aliases/Axis2DBinding.md)

The Axis2D binding expression.

## Example

```ts
import { Axis2D, Key } from '@pulse-ts/input';
const move = Axis2D({ x: { pos: Key('D'), neg: Key('A') }, y: { pos: Key('W'), neg: Key('S') } });
```
