[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputOptions

# Type Alias: InputOptions

> **InputOptions** = `object`

Defined in: packages/input/src/domain/bindings/types.ts:79

The options for the input service.

## Properties

### pointerLock?

> `optional` **pointerLock**: `boolean`

Defined in: packages/input/src/domain/bindings/types.ts:91

Whether to request pointer lock on pointerdown if available. Defaults to true.

***

### preventDefault?

> `optional` **preventDefault**: `boolean`

Defined in: packages/input/src/domain/bindings/types.ts:87

Whether to prevent default behavior of events. Defaults to true.

***

### target?

> `optional` **target**: `EventTarget` \| `null`

Defined in: packages/input/src/domain/bindings/types.ts:83

The target to listen for events on. Defaults to window if present.
