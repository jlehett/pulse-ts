[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / PointerWheelScroll

# Function: PointerWheelScroll()

> **PointerWheelScroll**(`opts`): [`PointerWheelBinding`](../type-aliases/PointerWheelBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:139](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/expr.ts#L139)

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
