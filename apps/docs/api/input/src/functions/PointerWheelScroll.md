[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / PointerWheelScroll

# Function: PointerWheelScroll()

> **PointerWheelScroll**(`opts`): [`PointerWheelBinding`](../type-aliases/PointerWheelBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:140](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/expr.ts#L140)

Create a mouse wheel binding (Y-axis). Produces per-frame deltas.

## Parameters

### opts

Optional scale multiplier (default 1).

#### scale?

`number`

## Returns

[`PointerWheelBinding`](../type-aliases/PointerWheelBinding.md)

The wheel binding expression.

## Example

```ts
import { PointerWheelScroll } from '@pulse-ts/input';
const zoom = PointerWheelScroll({ scale: 1.0 });
```
