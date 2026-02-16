[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / SequenceBinding

# Type Alias: SequenceBinding

> **SequenceBinding** = `object`

Defined in: [packages/input/src/domain/bindings/types.ts:220](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L220)

A sequence (ordered key presses) binding expression.

## Properties

### maxGapFrames?

> `optional` **maxGapFrames**: `number`

Defined in: [packages/input/src/domain/bindings/types.ts:225](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L225)

Max frames allowed between successive steps. Default 15.

***

### resetOnWrong?

> `optional` **resetOnWrong**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:227](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L227)

Reset to start when a wrong key is pressed. Default true.

***

### steps

> **steps**: [`KeyBinding`](KeyBinding.md)[]

Defined in: [packages/input/src/domain/bindings/types.ts:223](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L223)

Keys to press in order.

***

### type

> **type**: `"sequence"`

Defined in: [packages/input/src/domain/bindings/types.ts:221](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L221)
