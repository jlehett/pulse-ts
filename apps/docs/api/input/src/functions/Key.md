[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Key

# Function: Key()

> **Key**(`code`): [`KeyBinding`](../type-aliases/KeyBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:41](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/expr.ts#L41)

Create a key binding expression.

## Parameters

### code

`string`

Keyboard code or shorthand; letters or digits are normalized (e.g., `w` → `KeyW`).

## Returns

[`KeyBinding`](../type-aliases/KeyBinding.md)

The key binding expression.

## Example

```ts
import { Key } from '@pulse-ts/input';
const jump = Key('Space');
```
