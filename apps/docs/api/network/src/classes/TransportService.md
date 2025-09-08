[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / TransportService

# Class: TransportService

Defined in: [network/src/services/TransportService.ts:17](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L17)

A service for transporting messages between nodes.

## Extends

- `Service`

## Constructors

### Constructor

> **new TransportService**(`opts`): `TransportService`

Defined in: [network/src/services/TransportService.ts:38](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L38)

#### Parameters

##### opts

###### codec?

[`Codec`](../interfaces/Codec.md)

#### Returns

`TransportService`

#### Overrides

`Service.constructor`

## Properties

### onPacketIn

> `readonly` **onPacketIn**: `TypedEvent`\<[`Packet`](../interfaces/Packet.md)\<`unknown`\>\>

Defined in: [network/src/services/TransportService.ts:29](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L29)

***

### onPacketOut

> `readonly` **onPacketOut**: `TypedEvent`\<[`Packet`](../interfaces/Packet.md)\<`unknown`\>\>

Defined in: [network/src/services/TransportService.ts:30](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L30)

***

### onStatus

> `readonly` **onStatus**: `TypedEvent`\<[`TransportStatus`](../type-aliases/TransportStatus.md)\>

Defined in: [network/src/services/TransportService.ts:28](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L28)

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: core/dist/index.d.ts:284

Attaches the service to the world.

#### Parameters

##### world

`World`

The world to attach the service to.

#### Returns

`void`

#### Inherited from

`Service.attach`

***

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [network/src/services/TransportService.ts:93](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L93)

Connect to the transport.

#### Returns

`Promise`\<`void`\>

***

### detach()

> **detach**(): `void`

Defined in: core/dist/index.d.ts:288

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [network/src/services/TransportService.ts:101](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L101)

Disconnect from the transport.

#### Returns

`Promise`\<`void`\>

***

### dispatchIncoming()

> **dispatchIncoming**(`max`): `void`

Defined in: [network/src/services/TransportService.ts:156](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L156)

Dispatch the incoming messages.

#### Parameters

##### max

`number` = `128`

The maximum number of messages to dispatch.

#### Returns

`void`

***

### flushOutgoing()

> **flushOutgoing**(): `void`

Defined in: [network/src/services/TransportService.ts:140](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L140)

Flush the outgoing messages.

#### Returns

`void`

***

### getStats()

> **getStats**(): `object`

Defined in: [network/src/services/TransportService.ts:174](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L174)

Get the stats.

#### Returns

`object`

The stats.

##### bytesIn

> **bytesIn**: `number`

##### bytesOut

> **bytesOut**: `number`

##### packetsIn

> **packetsIn**: `number`

##### packetsOut

> **packetsOut**: `number`

##### status

> **status**: [`TransportStatus`](../type-aliases/TransportStatus.md)

***

### getStatus()

> **getStatus**(): [`TransportStatus`](../type-aliases/TransportStatus.md)

Defined in: [network/src/services/TransportService.ts:110](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L110)

Get the status of the transport.

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)

The status.

***

### publish()

> **publish**\<`T`\>(`name`, `data`): `void`

Defined in: [network/src/services/TransportService.ts:133](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L133)

Publish a message to a channel.

#### Type Parameters

##### T

`T`

#### Parameters

##### name

`string`

The name of the channel.

##### data

`T`

The data.

#### Returns

`void`

***

### setCodec()

> **setCodec**(`codec`): `void`

Defined in: [network/src/services/TransportService.ts:46](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L46)

Replaces the packet codec used for encode/decode.

#### Parameters

##### codec

[`Codec`](../interfaces/Codec.md)

#### Returns

`void`

***

### setTransport()

> **setTransport**(`t`): `void`

Defined in: [network/src/services/TransportService.ts:54](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L54)

Set the transport.

#### Parameters

##### t

[`Transport`](../interfaces/Transport.md)

The transport.

#### Returns

`void`

***

### subscribe()

> **subscribe**\<`T`\>(`name`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [network/src/services/TransportService.ts:120](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/TransportService.ts#L120)

Subscribe to a channel.

#### Type Parameters

##### T

`T`

#### Parameters

##### name

`string`

The name of the channel.

##### handler

[`ChannelHandler`](../type-aliases/ChannelHandler.md)\<`T`\>

The handler.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

The unsubscribe function.
