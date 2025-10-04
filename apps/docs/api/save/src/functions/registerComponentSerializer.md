[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerComponentSerializer

# Function: registerComponentSerializer()

> **registerComponentSerializer**\<`T`\>(`ctor`, `serializer`): `void`

Defined in: [packages/save/src/registries/componentRegistry.ts:22](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/registries/componentRegistry.ts#L22)

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
