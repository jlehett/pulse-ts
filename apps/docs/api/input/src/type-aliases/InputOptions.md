[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputOptions

# Type Alias: InputOptions

> **InputOptions** = `object`

Defined in: [packages/input/src/domain/bindings/types.ts:94](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L94)

Options configuring the InputService.

## Properties

### pointerLock?

> `optional` **pointerLock**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:106](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L106)

Whether to request pointer lock on pointerdown if available. Defaults to false.

***

### preventDefault?

> `optional` **preventDefault**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:102](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L102)

Whether to prevent default behavior of events. Defaults to false.

***

### target?

> `optional` **target**: `EventTarget` \| `null`

Defined in: [packages/input/src/domain/bindings/types.ts:98](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L98)

The target to listen for events on. Defaults to window if present.
