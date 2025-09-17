[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / MemoryHub

# Interface: MemoryHub

Defined in: [network/src/transports/memory/hub.ts:28](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/hub.ts#L28)

In-memory message hub for tests and local simulation.
Broadcasts to all peers except sender.

## Properties

### id

> `readonly` **id**: `string`

Defined in: [network/src/transports/memory/hub.ts:32](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/hub.ts#L32)

The ID of the hub.

## Methods

### addPeer()

> **addPeer**(`peerId`, `cb`): `void`

Defined in: [network/src/transports/memory/hub.ts:38](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/hub.ts#L38)

Add a peer to the hub.

#### Parameters

##### peerId

`string`

The ID of the peer.

##### cb

`Peer`

The peer.

#### Returns

`void`

***

### peers()

> **peers**(): `string`[]

Defined in: [network/src/transports/memory/hub.ts:54](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/hub.ts#L54)

Get the peers in the hub.

#### Returns

`string`[]

The peers.

***

### removePeer()

> **removePeer**(`peerId`): `void`

Defined in: [network/src/transports/memory/hub.ts:43](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/hub.ts#L43)

Remove a peer from the hub.

#### Parameters

##### peerId

`string`

The ID of the peer.

#### Returns

`void`

***

### send()

> **send**(`from`, `data`): `void`

Defined in: [network/src/transports/memory/hub.ts:49](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/hub.ts#L49)

Send a message to a peer.

#### Parameters

##### from

`string`

The ID of the sender.

##### data

`Uint8Array`

The data.

#### Returns

`void`
