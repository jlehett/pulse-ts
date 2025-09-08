[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputOptions

# Type Alias: InputOptions

> **InputOptions** = `object`

Defined in: [input/src/bindings/types.ts:79](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L79)

The options for the input service.

## Properties

### pointerLock?

> `optional` **pointerLock**: `boolean`

Defined in: [input/src/bindings/types.ts:91](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L91)

Whether to request pointer lock on pointerdown if available. Defaults to true.

***

### preventDefault?

> `optional` **preventDefault**: `boolean`

Defined in: [input/src/bindings/types.ts:87](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L87)

Whether to prevent default behavior of events. Defaults to true.

***

### target?

> `optional` **target**: `EventTarget` \| `null`

Defined in: [input/src/bindings/types.ts:83](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L83)

The target to listen for events on. Defaults to window if present.
