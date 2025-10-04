[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / PointerWheelScroll

# Function: PointerWheelScroll()

> **PointerWheelScroll**(`opts`): [`PointerWheelBinding`](../type-aliases/PointerWheelBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:140](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/expr.ts#L140)

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
