[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Sequence

# Function: Sequence()

> **Sequence**(`steps`, `opts`): [`SequenceBinding`](../type-aliases/SequenceBinding.md)

Defined in: packages/input/src/domain/bindings/expr.ts:176

Create a Sequence binding (ordered key presses within a frame window).

Example
```ts
import { Sequence, Key } from '@pulse-ts/input';
const dash = Sequence([Key('KeyD'), Key('KeyS')], { maxGapFrames: 10 });
```

## Parameters

### steps

(`string` \| [`KeyBinding`](../type-aliases/KeyBinding.md))[]

### opts

#### maxGapFrames?

`number`

#### resetOnWrong?

`boolean`

## Returns

[`SequenceBinding`](../type-aliases/SequenceBinding.md)
