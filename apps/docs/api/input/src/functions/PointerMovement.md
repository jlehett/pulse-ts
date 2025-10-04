[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / PointerMovement

# Function: PointerMovement()

> **PointerMovement**(`opts`): [`PointerMovementBinding`](../type-aliases/PointerMovementBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:118](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/expr.ts#L118)

Create a pointer movement binding (maps mouse/touch delta to a 2D axis).

## Parameters

### opts

Pointer options (invert/scale per-axis).

#### invertX?

`boolean`

#### invertY?

`boolean`

#### scaleX?

`number`

#### scaleY?

`number`

## Returns

[`PointerMovementBinding`](../type-aliases/PointerMovementBinding.md)

The pointer movement binding expression.

## Example

```ts
import { PointerMovement } from '@pulse-ts/input';
const look = PointerMovement({ scaleX: 0.1, scaleY: 0.1 });
```
