[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / Packet

# Interface: Packet\<T\>

Defined in: [packages/network/src/types.ts:67](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/types.ts#L67)

A packet of data.

## Type Parameters

### T

`T` = `unknown`

## Properties

### channel

> **channel**: `string`

Defined in: [packages/network/src/types.ts:71](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/types.ts#L71)

The channel of the packet.

***

### data

> **data**: `T`

Defined in: [packages/network/src/types.ts:75](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/types.ts#L75)

The data of the packet.

***

### from?

> `optional` **from**: `string`

Defined in: [packages/network/src/types.ts:79](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/types.ts#L79)

Optional metadata (populated if transport can provide it)

***

### to?

> `optional` **to**: `string` \| `string`[]

Defined in: [packages/network/src/types.ts:83](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/types.ts#L83)

Optional addressing. If present, only the addressed peer(s) should consume.
