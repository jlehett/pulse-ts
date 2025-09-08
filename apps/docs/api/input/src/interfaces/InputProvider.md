[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputProvider

# Interface: InputProvider

Defined in: [input/src/bindings/types.ts:97](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L97)

A provider for the input service.

## Methods

### start()

> **start**(`target`): `void`

Defined in: [input/src/bindings/types.ts:102](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L102)

Start the provider.

#### Parameters

##### target

`EventTarget`

The target to listen for events on.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [input/src/bindings/types.ts:106](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L106)

Stop the provider.

#### Returns

`void`

***

### update()?

> `optional` **update**(): `void`

Defined in: [input/src/bindings/types.ts:110](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L110)

Update the provider.

#### Returns

`void`
