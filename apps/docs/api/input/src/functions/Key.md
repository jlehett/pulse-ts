[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Key

# Function: Key()

> **Key**(`code`): [`KeyBinding`](../type-aliases/KeyBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:42](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/expr.ts#L42)

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
