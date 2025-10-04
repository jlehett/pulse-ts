[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / WebRtcMeshTransport

# Class: WebRtcMeshTransport

Defined in: [packages/network/src/transports/webrtc/transport.ts:42](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L42)

Experimental WebRTC mesh transport (skeleton). Broadcasts to all connected peers.

Notes:
- Requires an out-of-band signaling adapter.
- Emits meta.from per message.

## Implements

- [`Transport`](../interfaces/Transport.md)

## Constructors

### Constructor

> **new WebRtcMeshTransport**(`opts`): `WebRtcMeshTransport`

Defined in: [packages/network/src/transports/webrtc/transport.ts:60](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L60)

#### Parameters

##### opts

[`WebRtcMeshOptions`](../type-aliases/WebRtcMeshOptions.md)

#### Returns

`WebRtcMeshTransport`

## Properties

### kind

> `readonly` **kind**: `"webrtc-mesh"` = `'webrtc-mesh'`

Defined in: [packages/network/src/transports/webrtc/transport.ts:43](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L43)

The kind of transport.

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`kind`](../interfaces/Transport.md#kind)

***

### supportsBinary

> `readonly` **supportsBinary**: `true` = `true`

Defined in: [packages/network/src/transports/webrtc/transport.ts:44](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L44)

Whether the transport supports binary.

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`supportsBinary`](../interfaces/Transport.md#supportsbinary)

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [packages/network/src/transports/webrtc/transport.ts:75](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L75)

Connect to the transport.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`connect`](../interfaces/Transport.md#connect)

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [packages/network/src/transports/webrtc/transport.ts:92](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L92)

Disconnect from the transport.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`disconnect`](../interfaces/Transport.md#disconnect)

***

### getStatus()

> **getStatus**(): [`TransportStatus`](../type-aliases/TransportStatus.md)

Defined in: [packages/network/src/transports/webrtc/transport.ts:71](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L71)

Get the status of the transport.

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)

The status.

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`getStatus`](../interfaces/Transport.md#getstatus)

***

### onMessage()

> **onMessage**(`fn`): () => `boolean`

Defined in: [packages/network/src/transports/webrtc/transport.ts:119](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L119)

On message handler.

#### Parameters

##### fn

(`data`, `meta?`) => `void`

The handler.

#### Returns

The unsubscribe function.

> (): `boolean`

##### Returns

`boolean`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`onMessage`](../interfaces/Transport.md#onmessage)

***

### onPeerJoin()

> **onPeerJoin**(`fn`): () => `boolean`

Defined in: [packages/network/src/transports/webrtc/transport.ts:129](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L129)

Optional peer lifecycle (for P2P transports).

#### Parameters

##### fn

(`peerId`) => `void`

#### Returns

> (): `boolean`

##### Returns

`boolean`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`onPeerJoin`](../interfaces/Transport.md#onpeerjoin)

***

### onPeerLeave()

> **onPeerLeave**(`fn`): () => `boolean`

Defined in: [packages/network/src/transports/webrtc/transport.ts:134](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L134)

#### Parameters

##### fn

(`peerId`) => `void`

#### Returns

> (): `boolean`

##### Returns

`boolean`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`onPeerLeave`](../interfaces/Transport.md#onpeerleave)

***

### onStatus()

> **onStatus**(`fn`): () => `boolean`

Defined in: [packages/network/src/transports/webrtc/transport.ts:124](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L124)

On status handler.

#### Parameters

##### fn

(`status`) => `void`

The handler.

#### Returns

The unsubscribe function.

> (): `boolean`

##### Returns

`boolean`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`onStatus`](../interfaces/Transport.md#onstatus)

***

### peers()

> **peers**(): `string`[]

Defined in: [packages/network/src/transports/webrtc/transport.ts:139](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L139)

#### Returns

`string`[]

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`peers`](../interfaces/Transport.md#peers)

***

### send()

> **send**(`data`): `void`

Defined in: [packages/network/src/transports/webrtc/transport.ts:103](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/transports/webrtc/transport.ts#L103)

Send a message.

#### Parameters

##### data

`Uint8Array`

The data.

#### Returns

`void`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`send`](../interfaces/Transport.md#send)
