[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useWebRTC

# Function: useWebRTC()

> **useWebRTC**(`selfId`, `opts`): `object`

Defined in: [packages/network/src/fc/hooks.ts:101](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/fc/hooks.ts#L101)

Establish a WebRTC mesh transport using a dedicated signaling transport.

- Keeps a separate TransportService for signaling so swapping the main transport does not break signaling.
- On mount: connects signaling, wires rtc, swaps main TransportService to WebRTC and connects it.
- On unmount: disconnects rtc and stops signaling.

## Parameters

### selfId

`string`

### opts

#### iceServers?

`RTCIceServer`[]

#### peers?

() => `string`[]

#### signaling

[`Transport`](../interfaces/Transport.md) \| () => [`Transport`](../interfaces/Transport.md)

#### webRTC?

\{ `RTCIceCandidate?`: `any`; `RTCPeerConnection`: \{(`configuration?`): `RTCPeerConnection`; `prototype`: `RTCPeerConnection`; `generateCertificate`: `Promise`\<`RTCCertificate`\>; \}; `RTCSessionDescription?`: `any`; \}

#### webRTC.RTCIceCandidate?

`any`

#### webRTC.RTCPeerConnection

\{(`configuration?`): `RTCPeerConnection`; `prototype`: `RTCPeerConnection`; `generateCertificate`: `Promise`\<`RTCCertificate`\>; \}

#### webRTC.RTCPeerConnection.prototype

`RTCPeerConnection`

#### webRTC.RTCPeerConnection.generateCertificate

#### webRTC.RTCSessionDescription?

`any`

## Returns

`object`

### disconnect()

> `readonly` **disconnect**: () => `undefined` \| `Promise`\<`void`\>

#### Returns

`undefined` \| `Promise`\<`void`\>

### getStatus()

> `readonly` **getStatus**: () => [`TransportStatus`](../type-aliases/TransportStatus.md)

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)
