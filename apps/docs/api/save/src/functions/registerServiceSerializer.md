[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerServiceSerializer

# Function: registerServiceSerializer()

> **registerServiceSerializer**\<`T`\>(`ctor`, `serializer`): `void`

Defined in: [packages/save/src/registries/serviceRegistry.ts:19](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/registries/serviceRegistry.ts#L19)

Register a service serializer.

## Type Parameters

### T

`T` *extends* `Service`

## Parameters

### ctor

`Ctor`\<`T`\>

The constructor of the service to register.

### serializer

`ServiceSerializer`\<`T`\>

The serializer for the service.

## Returns

`void`
