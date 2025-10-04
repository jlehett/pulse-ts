[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / RtcSignalingClient

# Class: RtcSignalingClient

Defined in: [packages/network/src/signaling/RtcSignalingClient.ts:12](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/signaling/RtcSignalingClient.ts#L12)

Minimal signaling client riding on TransportService over the broker.

## Constructors

### Constructor

> **new RtcSignalingClient**(`svc`, `selfId`): `RtcSignalingClient`

Defined in: [packages/network/src/signaling/RtcSignalingClient.ts:15](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/signaling/RtcSignalingClient.ts#L15)

#### Parameters

##### svc

[`TransportService`](TransportService.md)

##### selfId

`string`

#### Returns

`RtcSignalingClient`

## Methods

### send()

> **send**(`to`, `type`, `payload`): `void`

Defined in: [packages/network/src/signaling/RtcSignalingClient.ts:38](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/signaling/RtcSignalingClient.ts#L38)

#### Parameters

##### to

`string`

##### type

`"hello"` | `"offer"` | `"answer"` | `"ice"`

##### payload

`any`

#### Returns

`void`

***

### start()

> **start**(`onMessage`): `void`

Defined in: [packages/network/src/signaling/RtcSignalingClient.ts:22](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/signaling/RtcSignalingClient.ts#L22)

#### Parameters

##### onMessage

(`env`) => `void`

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/network/src/signaling/RtcSignalingClient.ts:33](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/signaling/RtcSignalingClient.ts#L33)

#### Returns

`void`
