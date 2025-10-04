[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useService

# Function: useService()

> **useService**\<`T`\>(`Service`): `undefined` \| `T`

Defined in: [packages/core/src/domain/fc/hooks.ts:42](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/fc/hooks.ts#L42)

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
