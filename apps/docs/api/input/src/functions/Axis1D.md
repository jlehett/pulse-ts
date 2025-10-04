[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Axis1D

# Function: Axis1D()

> **Axis1D**(`opts`): [`Axis1DBinding`](../type-aliases/Axis1DBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:60](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/expr.ts#L60)

Create an Axis1D binding (e.g., horizontal movement or wheel scaling).

## Parameters

### opts

Axis options.

#### neg?

[`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]

Negative key(s).

#### pos?

[`KeyBinding`](../type-aliases/KeyBinding.md) \| [`KeyBinding`](../type-aliases/KeyBinding.md)[]

Positive key(s).

#### scale?

`number`

Optional multiplier (defaults to 1).

## Returns

[`Axis1DBinding`](../type-aliases/Axis1DBinding.md)

The Axis1D binding expression.

## Example

```ts
import { Axis1D, Key } from '@pulse-ts/input';
const moveX = Axis1D({ pos: Key('D'), neg: Key('A') });
```
