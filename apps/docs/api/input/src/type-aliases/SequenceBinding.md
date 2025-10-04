[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / SequenceBinding

# Type Alias: SequenceBinding

> **SequenceBinding** = `object`

Defined in: [packages/input/src/domain/bindings/types.ts:220](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L220)

A sequence (ordered key presses) binding expression.

## Properties

### maxGapFrames?

> `optional` **maxGapFrames**: `number`

Defined in: [packages/input/src/domain/bindings/types.ts:225](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L225)

Max frames allowed between successive steps. Default 15.

***

### resetOnWrong?

> `optional` **resetOnWrong**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:227](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L227)

Reset to start when a wrong key is pressed. Default true.

***

### steps

> **steps**: [`KeyBinding`](KeyBinding.md)[]

Defined in: [packages/input/src/domain/bindings/types.ts:223](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L223)

Keys to press in order.

***

### type

> **type**: `"sequence"`

Defined in: [packages/input/src/domain/bindings/types.ts:221](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L221)
