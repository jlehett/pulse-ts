[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / ComponentSerializer

# Type Alias: ComponentSerializer\<T\>

> **ComponentSerializer**\<`T`\> = `object`

Defined in: [save/src/types.ts:33](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/types.ts#L33)

A serializer for a component.

## Type Parameters

### T

`T` *extends* `Component`

## Properties

### id

> **id**: `string`

Defined in: [save/src/types.ts:35](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/types.ts#L35)

Stable identifier for this component type in save files.

## Methods

### deserialize()

> **deserialize**(`owner`, `data`): `void`

Defined in: [save/src/types.ts:42](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/types.ts#L42)

Apply the serialized data back onto the component.

#### Parameters

##### owner

`Node`

##### data

`unknown`

#### Returns

`void`

***

### serialize()

> **serialize**(`owner`, `comp`): `unknown`

Defined in: [save/src/types.ts:40](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/types.ts#L40)

Serialize the component into JSON-safe data.
Return undefined to skip writing this component.

#### Parameters

##### owner

`Node`

##### comp

`T`

#### Returns

`unknown`
