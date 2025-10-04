[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerComponentSerializer

# Function: registerComponentSerializer()

> **registerComponentSerializer**\<`T`\>(`ctor`, `serializer`): `void`

Defined in: [packages/save/src/registries/componentRegistry.ts:22](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/save/src/registries/componentRegistry.ts#L22)

Register a component serializer.

## Type Parameters

### T

`T` *extends* `Component`

## Parameters

### ctor

`Ctor`\<`T`\>

The constructor of the component to register.

### serializer

[`ComponentSerializer`](../type-aliases/ComponentSerializer.md)\<`T`\>

The serializer to register.

## Returns

`void`
