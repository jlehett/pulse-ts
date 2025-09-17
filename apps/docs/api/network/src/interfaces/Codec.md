[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / Codec

# Interface: Codec

Defined in: [network/src/types.ts:80](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/types.ts#L80)

A codec for encoding and decoding packets.

## Methods

### decode()

> **decode**(`bytes`): [`Packet`](Packet.md)

Defined in: [network/src/types.ts:92](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/types.ts#L92)

Decode a packet.

#### Parameters

##### bytes

`Uint8Array`

The encoded packet.

#### Returns

[`Packet`](Packet.md)

The decoded packet.

***

### encode()

> **encode**(`packet`): `Uint8Array`

Defined in: [network/src/types.ts:86](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/types.ts#L86)

Encode a packet.

#### Parameters

##### packet

[`Packet`](Packet.md)

The packet.

#### Returns

`Uint8Array`

The encoded packet.
