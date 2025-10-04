[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Sequence

# Function: Sequence()

> **Sequence**(`steps`, `opts`): [`SequenceBinding`](../type-aliases/SequenceBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:191](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/expr.ts#L191)

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
