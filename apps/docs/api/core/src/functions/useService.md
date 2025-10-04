[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useService

# Function: useService()

> **useService**\<`T`\>(`Service`): `undefined` \| `T`

Defined in: [packages/core/src/domain/fc/hooks.ts:42](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/fc/hooks.ts#L42)

Returns the `Service` associated with the current `World`.

## Type Parameters

### T

`T` *extends* [`Service`](../classes/Service.md)

## Parameters

### Service

[`Ctor`](../type-aliases/Ctor.md)\<`T`\>

The constructor of the service to get.

## Returns

`undefined` \| `T`

The service instance.
