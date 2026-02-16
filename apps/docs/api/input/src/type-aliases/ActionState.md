[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / ActionState

# Type Alias: ActionState

> **ActionState** = `object`

Defined in: [packages/input/src/domain/bindings/types.ts:6](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L6)

The state of an action.

## Properties

### down

> **down**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:10](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L10)

Whether the input bound to the action is currently held down.

***

### pressed

> **pressed**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:14](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L14)

Whether the input bound to the action was just pressed down this frame.

***

### released

> **released**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:18](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L18)

Whether the input bound to the action was just released this frame.

***

### since

> **since**: `number`

Defined in: [packages/input/src/domain/bindings/types.ts:26](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L26)

The frame id when last state change occurred.

***

### value

> **value**: `number`

Defined in: [packages/input/src/domain/bindings/types.ts:22](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L22)

The value of the action. 0..1 for digital; can be any number for axes
