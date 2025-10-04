[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputOptions

# Type Alias: InputOptions

> **InputOptions** = `object`

Defined in: [packages/input/src/domain/bindings/types.ts:79](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/types.ts#L79)

Options configuring the InputService.

## Properties

### pointerLock?

> `optional` **pointerLock**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:91](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/types.ts#L91)

Whether to request pointer lock on pointerdown if available. Defaults to true.

***

### preventDefault?

> `optional` **preventDefault**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:87](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/types.ts#L87)

Whether to prevent default behavior of events. Defaults to true.

***

### target?

> `optional` **target**: `EventTarget` \| `null`

Defined in: [packages/input/src/domain/bindings/types.ts:83](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/types.ts#L83)

The target to listen for events on. Defaults to window if present.
