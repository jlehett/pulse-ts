[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / ActionState

# Type Alias: ActionState

> **ActionState** = `object`

Defined in: packages/input/src/domain/bindings/types.ts:6

The state of an action.

## Properties

### down

> **down**: `boolean`

Defined in: packages/input/src/domain/bindings/types.ts:10

Whether the input bound to the action is currently held down.

***

### pressed

> **pressed**: `boolean`

Defined in: packages/input/src/domain/bindings/types.ts:14

Whether the input bound to the action was just pressed down this frame.

***

### released

> **released**: `boolean`

Defined in: packages/input/src/domain/bindings/types.ts:18

Whether the input bound to the action was just released this frame.

***

### since

> **since**: `number`

Defined in: packages/input/src/domain/bindings/types.ts:26

The frame id when last state change occurred.

***

### value

> **value**: `number`

Defined in: packages/input/src/domain/bindings/types.ts:22

The value of the action. 0..1 for digital; can be any number for axes
