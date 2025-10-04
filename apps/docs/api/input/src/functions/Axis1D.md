[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Axis1D

# Function: Axis1D()

> **Axis1D**(`opts`): [`Axis1DBinding`](../type-aliases/Axis1DBinding.md)

Defined in: packages/input/src/domain/bindings/expr.ts:57

Create an Axis1D binding.

## Parameters

### opts

The options for the axis.

#### neg?

[`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]

The negative binding.

#### pos?

[`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]

The positive binding.

#### scale?

`number`

The scale of the axis.

## Returns

[`Axis1DBinding`](../type-aliases/Axis1DBinding.md)

The Axis1D binding.

Example
```ts
import { Axis1D, Key } from '@pulse-ts/input';
const moveX = Axis1D({ pos: Key('D'), neg: Key('A') });
```
