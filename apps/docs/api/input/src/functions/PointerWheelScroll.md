[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / PointerWheelScroll

# Function: PointerWheelScroll()

> **PointerWheelScroll**(`opts`): [`PointerWheelBinding`](../type-aliases/PointerWheelBinding.md)

Defined in: packages/input/src/domain/bindings/expr.ts:145

Create a PointerWheelScroll binding.

## Parameters

### opts

The options for the pointer wheel scroll.

#### scale?

`number`

The scale of the wheel scroll.

## Returns

[`PointerWheelBinding`](../type-aliases/PointerWheelBinding.md)

The PointerWheelScroll binding.

Example
```ts
import { PointerWheelScroll } from '@pulse-ts/input';
const zoom = PointerWheelScroll({ scale: 1.0 });
```
