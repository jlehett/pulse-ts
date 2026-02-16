[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputProvider

# Interface: InputProvider

Defined in: [packages/input/src/domain/bindings/types.ts:112](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L112)

Provider interface for feeding device input into the InputService.

## Methods

### start()

> **start**(`target`): `void`

Defined in: [packages/input/src/domain/bindings/types.ts:117](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L117)

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

Defined in: [packages/input/src/domain/bindings/types.ts:121](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L121)

Stop the provider.

#### Returns

`void`

***

### update()?

> `optional` **update**(): `void`

Defined in: [packages/input/src/domain/bindings/types.ts:125](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L125)

Update the provider.

#### Returns

`void`
