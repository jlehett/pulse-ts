[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Sequence

# Function: Sequence()

> **Sequence**(`steps`, `opts`): [`SequenceBinding`](../type-aliases/SequenceBinding.md)

Defined in: [input/src/bindings/expr.ts:134](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/expr.ts#L134)

Create a Sequence binding (ordered key presses within a frame window).

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
