[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ReliableResult

# Interface: ReliableResult\<T\>

Defined in: [packages/network/src/services/ReliableChannel.ts:25](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/services/ReliableChannel.ts#L25)

Result of a reliable send.

## Type Parameters

### T

`T` = `unknown`

## Properties

### reason?

> `optional` **reason**: `string`

Defined in: [packages/network/src/services/ReliableChannel.ts:28](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/services/ReliableChannel.ts#L28)

***

### result?

> `optional` **result**: `T`

Defined in: [packages/network/src/services/ReliableChannel.ts:27](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/services/ReliableChannel.ts#L27)

***

### serverSeq?

> `optional` **serverSeq**: `number`

Defined in: [packages/network/src/services/ReliableChannel.ts:29](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/services/ReliableChannel.ts#L29)

***

### status

> **status**: `"error"` \| `"ok"`

Defined in: [packages/network/src/services/ReliableChannel.ts:26](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/services/ReliableChannel.ts#L26)
