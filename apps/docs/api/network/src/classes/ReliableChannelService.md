[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ReliableChannelService

# Class: ReliableChannelService

Defined in: [network/src/services/ReliableChannel.ts:47](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReliableChannel.ts#L47)

## Extends

- `Service`

## Constructors

### Constructor

> **new ReliableChannelService**(`defaults`): `ReliableChannelService`

Defined in: [network/src/services/ReliableChannel.ts:52](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReliableChannel.ts#L52)

#### Parameters

##### defaults

###### retries?

`number`

###### timeoutMs?

`number`

#### Returns

`ReliableChannelService`

#### Overrides

`Service.constructor`

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

### detach()

> **detach**(): `void`

Defined in: core/dist/index.d.ts:288

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### inflight()

> **inflight**(): `number`

Defined in: [network/src/services/ReliableChannel.ts:107](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReliableChannel.ts#L107)

Returns number of inflight requests.

#### Returns

`number`

***

### send()

> **send**\<`TReq`, `TRes`\>(`topic`, `payload`, `opts`): `Promise`\<[`ReliableResult`](../interfaces/ReliableResult.md)\<`TRes`\>\>

Defined in: [network/src/services/ReliableChannel.ts:61](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReliableChannel.ts#L61)

Sends a reliable request to a server handler registered for `topic`.

#### Type Parameters

##### TReq

`TReq` = `unknown`

##### TRes

`TRes` = `unknown`

#### Parameters

##### topic

`string`

##### payload

`TReq`

##### opts

###### retries?

`number`

###### timeoutMs?

`number`

#### Returns

`Promise`\<[`ReliableResult`](../interfaces/ReliableResult.md)\<`TRes`\>\>
