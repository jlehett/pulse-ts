[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ReliableResult

# Interface: ReliableResult\<T\>

Defined in: [packages/network/src/services/ReliableChannel.ts:25](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L25)

Result of a reliable send.

## Type Parameters

### T

`T` = `unknown`

## Properties

### reason?

> `optional` **reason**: `string`

Defined in: [packages/network/src/services/ReliableChannel.ts:28](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L28)

***

### result?

> `optional` **result**: `T`

Defined in: [packages/network/src/services/ReliableChannel.ts:27](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L27)

***

### serverSeq?

> `optional` **serverSeq**: `number`

Defined in: [packages/network/src/services/ReliableChannel.ts:29](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L29)

***

### status

> **status**: `"error"` \| `"ok"`

Defined in: [packages/network/src/services/ReliableChannel.ts:26](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L26)
