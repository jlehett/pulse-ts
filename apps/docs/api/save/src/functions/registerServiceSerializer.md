[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerServiceSerializer

# Function: registerServiceSerializer()

> **registerServiceSerializer**\<`T`\>(`ctor`, `serializer`): `void`

Defined in: [save/src/registries/serviceRegistry.ts:19](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/registries/serviceRegistry.ts#L19)

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
