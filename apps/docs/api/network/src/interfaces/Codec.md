[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / Codec

# Interface: Codec

Defined in: [packages/network/src/types.ts:89](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L89)

A codec for encoding and decoding packets.

## Methods

### decode()

> **decode**(`bytes`): [`Packet`](Packet.md)

Defined in: [packages/network/src/types.ts:101](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L101)

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

Defined in: [packages/network/src/types.ts:95](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L95)

Encode a packet.

#### Parameters

##### packet

[`Packet`](Packet.md)

The packet.

#### Returns

`Uint8Array`

The encoded packet.
