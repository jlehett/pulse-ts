[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / TransportService

# Class: TransportService

Defined in: [packages/network/src/services/TransportService.ts:17](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L17)

A service for transporting messages between nodes.

## Extends

- `Service`

## Constructors

### Constructor

> **new TransportService**(`opts`): `TransportService`

Defined in: [packages/network/src/services/TransportService.ts:41](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L41)

#### Parameters

##### opts

###### codec?

[`Codec`](../interfaces/Codec.md)

###### selfId?

`string`

#### Returns

`TransportService`

#### Overrides

`Service.constructor`

## Properties

### onPacketIn

> `readonly` **onPacketIn**: `TypedEvent`\<[`Packet`](../interfaces/Packet.md)\<`unknown`\>\>

Defined in: [packages/network/src/services/TransportService.ts:30](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L30)

***

### onPacketOut

> `readonly` **onPacketOut**: `TypedEvent`\<[`Packet`](../interfaces/Packet.md)\<`unknown`\>\>

Defined in: [packages/network/src/services/TransportService.ts:31](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L31)

***

### onPeerJoin

> `readonly` **onPeerJoin**: `TypedEvent`\<`string`\>

Defined in: [packages/network/src/services/TransportService.ts:32](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L32)

***

### onPeerLeave

> `readonly` **onPeerLeave**: `TypedEvent`\<`string`\>

Defined in: [packages/network/src/services/TransportService.ts:33](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L33)

***

### onStatus

> `readonly` **onStatus**: `TypedEvent`\<[`TransportStatus`](../type-aliases/TransportStatus.md)\>

Defined in: [packages/network/src/services/TransportService.ts:29](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L29)

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: packages/core/dist/index.d.ts:250

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

### channel()

> **channel**\<`T`\>(`name`): `object`

Defined in: [packages/network/src/services/TransportService.ts:252](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L252)

Fluent typed channel helper.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### name

`ChannelName`

#### Returns

`object`

##### once()

> `readonly` **once**: (`fn`) => [`Unsubscribe`](../type-aliases/Unsubscribe.md)

###### Parameters

###### fn

[`ChannelHandler`](../type-aliases/ChannelHandler.md)\<`T`\>

###### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

##### publish()

> `readonly` **publish**: (`data`) => `void`

###### Parameters

###### data

`T`

###### Returns

`void`

##### publishTo()

> `readonly` **publishTo**: (`to`, `data`) => `void`

###### Parameters

###### to

`string` | `string`[]

###### data

`T`

###### Returns

`void`

##### subscribe()

> `readonly` **subscribe**: (`fn`) => [`Unsubscribe`](../type-aliases/Unsubscribe.md)

###### Parameters

###### fn

[`ChannelHandler`](../type-aliases/ChannelHandler.md)\<`T`\>

###### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [packages/network/src/services/TransportService.ts:123](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L123)

Connect to the transport.

#### Returns

`Promise`\<`void`\>

***

### detach()

> **detach**(): `void`

Defined in: packages/core/dist/index.d.ts:254

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [packages/network/src/services/TransportService.ts:134](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L134)

Disconnect from the transport.

#### Returns

`Promise`\<`void`\>

***

### dispatchIncoming()

> **dispatchIncoming**(`max`): `void`

Defined in: [packages/network/src/services/TransportService.ts:196](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L196)

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

Defined in: [packages/network/src/services/TransportService.ts:180](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L180)

Flush the outgoing messages.

#### Returns

`void`

***

### getPeers()

> **getPeers**(): `string`[]

Defined in: [packages/network/src/services/TransportService.ts:243](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L243)

Current peer ids if supported by transport.

#### Returns

`string`[]

***

### getSelfId()

> **getSelfId**(): `undefined` \| `string`

Defined in: [packages/network/src/services/TransportService.ts:60](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L60)

Returns the configured peer id, if any.

#### Returns

`undefined` \| `string`

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/network/src/services/TransportService.ts:232](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L232)

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

Defined in: [packages/network/src/services/TransportService.ts:143](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L143)

Get the status of the transport.

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)

The status.

***

### publish()

> **publish**\<`T`\>(`name`, `data`): `void`

Defined in: [packages/network/src/services/TransportService.ts:166](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L166)

Publish a message to a channel.

#### Type Parameters

##### T

`T`

#### Parameters

##### name

`ChannelName`

The name of the channel.

##### data

`T`

The data.

#### Returns

`void`

***

### publishTo()

> **publishTo**\<`T`\>(`name`, `to`, `data`): `void`

Defined in: [packages/network/src/services/TransportService.ts:173](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L173)

Publish a message addressed to a specific peer or peers.

#### Type Parameters

##### T

`T`

#### Parameters

##### name

`ChannelName`

##### to

`string` | `string`[]

##### data

`T`

#### Returns

`void`

***

### setCodec()

> **setCodec**(`codec`): `void`

Defined in: [packages/network/src/services/TransportService.ts:50](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L50)

Replaces the packet codec used for encode/decode.

#### Parameters

##### codec

[`Codec`](../interfaces/Codec.md)

#### Returns

`void`

***

### setSelfId()

> **setSelfId**(`id`): `void`

Defined in: [packages/network/src/services/TransportService.ts:55](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L55)

Sets this client's peer id for addressed packet filtering.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### setTransport()

> **setTransport**(`t`): `void`

Defined in: [packages/network/src/services/TransportService.ts:68](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L68)

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

Defined in: [packages/network/src/services/TransportService.ts:153](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/TransportService.ts#L153)

Subscribe to a channel.

#### Type Parameters

##### T

`T`

#### Parameters

##### name

`ChannelName`

The name of the channel.

##### handler

[`ChannelHandler`](../type-aliases/ChannelHandler.md)\<`T`\>

The handler.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

The unsubscribe function.
