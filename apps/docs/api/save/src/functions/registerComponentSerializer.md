[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerComponentSerializer

# Function: registerComponentSerializer()

> **registerComponentSerializer**\<`T`\>(`ctor`, `serializer`): `void`

Defined in: [packages/save/src/registries/componentRegistry.ts:22](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/save/src/registries/componentRegistry.ts#L22)

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
