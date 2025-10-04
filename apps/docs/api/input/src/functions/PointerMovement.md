[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / PointerMovement

# Function: PointerMovement()

> **PointerMovement**(`opts`): [`PointerMovementBinding`](../type-aliases/PointerMovementBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:118](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/expr.ts#L118)

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
