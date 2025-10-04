[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ReliableResult

# Interface: ReliableResult\<T\>

Defined in: [packages/network/src/services/ReliableChannel.ts:25](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReliableChannel.ts#L25)

Result of a reliable send.

## Type Parameters

### T

`T` = `unknown`

## Properties

### reason?

> `optional` **reason**: `string`

Defined in: [packages/network/src/services/ReliableChannel.ts:28](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReliableChannel.ts#L28)

***

### result?

> `optional` **result**: `T`

Defined in: [packages/network/src/services/ReliableChannel.ts:27](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReliableChannel.ts#L27)

***

### serverSeq?

> `optional` **serverSeq**: `number`

Defined in: [packages/network/src/services/ReliableChannel.ts:29](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReliableChannel.ts#L29)

***

### status

> **status**: `"error"` \| `"ok"`

Defined in: [packages/network/src/services/ReliableChannel.ts:26](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReliableChannel.ts#L26)
