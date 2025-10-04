[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useService

# Function: useService()

> **useService**\<`T`\>(`Service`): `undefined` \| `T`

Defined in: [packages/core/src/domain/fc/hooks.ts:42](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/fc/hooks.ts#L42)

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
