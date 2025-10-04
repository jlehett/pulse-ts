[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / PointerMovement

# Function: PointerMovement()

> **PointerMovement**(`opts`): [`PointerMovementBinding`](../type-aliases/PointerMovementBinding.md)

Defined in: packages/input/src/domain/bindings/expr.ts:122

Create a PointerMovement binding.

## Parameters

### opts

The options for the pointer movement.

#### invertX?

`boolean`

Whether to invert the x axis.

#### invertY?

`boolean`

Whether to invert the y axis.

#### scaleX?

`number`

The scale of the x axis.

#### scaleY?

`number`

The scale of the y axis.

## Returns

[`PointerMovementBinding`](../type-aliases/PointerMovementBinding.md)

The PointerMovement binding.

Example
```ts
import { PointerMovement } from '@pulse-ts/input';
const look = PointerMovement({ scaleX: 0.1, scaleY: 0.1 });
```
