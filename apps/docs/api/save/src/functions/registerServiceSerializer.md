[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerServiceSerializer

# Function: registerServiceSerializer()

> **registerServiceSerializer**\<`T`\>(`ctor`, `serializer`): `void`

Defined in: [packages/save/src/registries/serviceRegistry.ts:19](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/save/src/registries/serviceRegistry.ts#L19)

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
