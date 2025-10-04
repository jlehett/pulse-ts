[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / SequenceBinding

# Type Alias: SequenceBinding

> **SequenceBinding** = `object`

Defined in: packages/input/src/domain/bindings/types.ts:194

A sequence (ordered key presses) binding.

## Properties

### maxGapFrames?

> `optional` **maxGapFrames**: `number`

Defined in: packages/input/src/domain/bindings/types.ts:199

Max frames allowed between successive steps. Default 15.

***

### resetOnWrong?

> `optional` **resetOnWrong**: `boolean`

Defined in: packages/input/src/domain/bindings/types.ts:201

Reset to start when a wrong key is pressed. Default true.

***

### steps

> **steps**: [`KeyBinding`](KeyBinding.md)[]

Defined in: packages/input/src/domain/bindings/types.ts:197

Keys to press in order.

***

### type

> **type**: `"sequence"`

Defined in: packages/input/src/domain/bindings/types.ts:195
