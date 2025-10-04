[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputProvider

# Interface: InputProvider

Defined in: [packages/input/src/domain/bindings/types.ts:97](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/types.ts#L97)

Provider interface for feeding device input into the InputService.

## Methods

### start()

> **start**(`target`): `void`

Defined in: [packages/input/src/domain/bindings/types.ts:102](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/types.ts#L102)

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

Defined in: [packages/input/src/domain/bindings/types.ts:106](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/types.ts#L106)

Stop the provider.

#### Returns

`void`

***

### update()?

> `optional` **update**(): `void`

Defined in: [packages/input/src/domain/bindings/types.ts:110](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/bindings/types.ts#L110)

Update the provider.

#### Returns

`void`
