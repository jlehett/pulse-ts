[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ZodLikeSchema

# Type Alias: ZodLikeSchema\<T\>

> **ZodLikeSchema**\<`T`\> = `object`

Defined in: [packages/network/src/server/validate.ts:2](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/validate.ts#L2)

Minimal helper to adapt a Zod-like schema for NetworkServer.registerChannel validate.

## Type Parameters

### T

`T` = `any`

## Properties

### safeParse()

> **safeParse**: (`data`) => `object`

Defined in: [packages/network/src/server/validate.ts:3](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/validate.ts#L3)

#### Parameters

##### data

`unknown`

#### Returns

`object`

##### success

> **success**: `boolean`
