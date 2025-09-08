[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ReliableResult

# Interface: ReliableResult\<T\>

Defined in: [network/src/services/ReliableChannel.ts:24](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReliableChannel.ts#L24)

Result of a reliable send.

## Type Parameters

### T

`T` = `unknown`

## Properties

### reason?

> `optional` **reason**: `string`

Defined in: [network/src/services/ReliableChannel.ts:27](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReliableChannel.ts#L27)

***

### result?

> `optional` **result**: `T`

Defined in: [network/src/services/ReliableChannel.ts:26](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReliableChannel.ts#L26)

***

### serverSeq?

> `optional` **serverSeq**: `number`

Defined in: [network/src/services/ReliableChannel.ts:28](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReliableChannel.ts#L28)

***

### status

> **status**: `"error"` \| `"ok"`

Defined in: [network/src/services/ReliableChannel.ts:25](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReliableChannel.ts#L25)
