[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / PointerButton

# Function: PointerButton()

> **PointerButton**(`button`): [`PointerButtonBinding`](../type-aliases/PointerButtonBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:157](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/expr.ts#L157)

Create a pointer button binding (maps a specific pointer/mouse button to a digital action).

## Parameters

### button

`number`

Button index (0 = primary, 1 = middle, 2 = secondary, ...).

## Returns

[`PointerButtonBinding`](../type-aliases/PointerButtonBinding.md)

The pointer button binding expression.

## Example

```ts
import { PointerButton } from '@pulse-ts/input';
const fire = PointerButton(0);
```
