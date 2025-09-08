[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / Packet

# Interface: Packet\<T\>

Defined in: [network/src/types.ts:62](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/types.ts#L62)

A packet of data.

## Type Parameters

### T

`T` = `unknown`

## Properties

### channel

> **channel**: `string`

Defined in: [network/src/types.ts:66](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/types.ts#L66)

The channel of the packet.

***

### data

> **data**: `T`

Defined in: [network/src/types.ts:70](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/types.ts#L70)

The data of the packet.

***

### from?

> `optional` **from**: `string`

Defined in: [network/src/types.ts:74](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/types.ts#L74)

Optional metadata (populated if transport can provide it)
