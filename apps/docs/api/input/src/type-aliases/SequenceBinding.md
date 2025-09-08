[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / SequenceBinding

# Type Alias: SequenceBinding

> **SequenceBinding** = `object`

Defined in: [input/src/bindings/types.ts:194](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L194)

A sequence (ordered key presses) binding.

## Properties

### maxGapFrames?

> `optional` **maxGapFrames**: `number`

Defined in: [input/src/bindings/types.ts:199](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L199)

Max frames allowed between successive steps. Default 15.

***

### resetOnWrong?

> `optional` **resetOnWrong**: `boolean`

Defined in: [input/src/bindings/types.ts:201](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L201)

Reset to start when a wrong key is pressed. Default true.

***

### steps

> **steps**: [`KeyBinding`](KeyBinding.md)[]

Defined in: [input/src/bindings/types.ts:197](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L197)

Keys to press in order.

***

### type

> **type**: `"sequence"`

Defined in: [input/src/bindings/types.ts:195](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L195)
