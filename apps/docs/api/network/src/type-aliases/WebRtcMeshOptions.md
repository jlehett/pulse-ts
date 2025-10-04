[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / WebRtcMeshOptions

# Type Alias: WebRtcMeshOptions

> **WebRtcMeshOptions** = `object`

Defined in: [packages/network/src/transports/webrtc/transport.ts:5](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/webrtc/transport.ts#L5)

## Properties

### iceServers?

> `optional` **iceServers**: `RTCIceServer`[]

Defined in: [packages/network/src/transports/webrtc/transport.ts:8](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/webrtc/transport.ts#L8)

STUN/TURN config

***

### selfId

> **selfId**: `string`

Defined in: [packages/network/src/transports/webrtc/transport.ts:6](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/webrtc/transport.ts#L6)

***

### signaling

> **signaling**: `object`

Defined in: [packages/network/src/transports/webrtc/transport.ts:10](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/webrtc/transport.ts#L10)

Signaling adapter

#### on()

> **on**: (`fn`) => () => `void`

##### Parameters

###### fn

(`env`) => `void`

##### Returns

> (): `void`

###### Returns

`void`

#### peers()?

> `optional` **peers**: () => `string`[]

Optional: list of known peers to proactively connect to.

##### Returns

`string`[]

#### send()

> **send**: (`to`, `type`, `payload`) => `void` \| `Promise`\<`void`\>

##### Parameters

###### to

`string`

###### type

`"hello"` | `"offer"` | `"answer"` | `"ice"`

###### payload

`any`

##### Returns

`void` \| `Promise`\<`void`\>

***

### webRTC?

> `optional` **webRTC**: `object`

Defined in: [packages/network/src/transports/webrtc/transport.ts:28](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/webrtc/transport.ts#L28)

Provide WebRTC constructors in non-browser environments.

#### RTCIceCandidate?

> `optional` **RTCIceCandidate**: `any`

#### RTCPeerConnection

> **RTCPeerConnection**: `WebRTC`

#### RTCSessionDescription?

> `optional` **RTCSessionDescription**: `any`
