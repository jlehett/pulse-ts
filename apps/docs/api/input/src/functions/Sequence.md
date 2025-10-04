[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Sequence

# Function: Sequence()

> **Sequence**(`steps`, `opts`): [`SequenceBinding`](../type-aliases/SequenceBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:175](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/expr.ts#L175)

Create a sequence binding (ordered key presses within a frame window).

## Parameters

### steps

(`string` \| [`KeyBinding`](../type-aliases/KeyBinding.md))[]

Keys in order. Use `Key(...)` or shorthand strings (normalized).

### opts

Optional `{ maxGapFrames, resetOnWrong }`.

#### maxGapFrames?

`number`

#### resetOnWrong?

`boolean`

## Returns

[`SequenceBinding`](../type-aliases/SequenceBinding.md)

The sequence binding expression.

## Example

```ts
import { Sequence, Key } from '@pulse-ts/input';
const dash = Sequence([Key('KeyD'), Key('KeyS')], { maxGapFrames: 10 });
```
