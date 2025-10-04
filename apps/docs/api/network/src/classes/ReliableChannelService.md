[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ReliableChannelService

# Class: ReliableChannelService

Defined in: [packages/network/src/services/ReliableChannel.ts:48](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L48)

## Extends

- `Service`

## Constructors

### Constructor

> **new ReliableChannelService**(`defaults`): `ReliableChannelService`

Defined in: [packages/network/src/services/ReliableChannel.ts:53](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L53)

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

### detach()

> **detach**(): `void`

Defined in: packages/core/dist/index.d.ts:254

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### inflight()

> **inflight**(): `number`

Defined in: [packages/network/src/services/ReliableChannel.ts:155](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L155)

Returns number of inflight requests.

#### Returns

`number`

***

### send()

> **send**\<`TReq`, `TRes`\>(`topic`, `payload`, `opts`): `Promise`\<[`ReliableResult`](../interfaces/ReliableResult.md)\<`TRes`\>\>

Defined in: [packages/network/src/services/ReliableChannel.ts:62](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L62)

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

***

### sendTo()

> **sendTo**\<`TReq`, `TRes`\>(`peerId`, `topic`, `payload`, `opts`): `Promise`\<[`ReliableResult`](../interfaces/ReliableResult.md)\<`TRes`\>\>

Defined in: [packages/network/src/services/ReliableChannel.ts:108](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/services/ReliableChannel.ts#L108)

Sends a reliable request addressed to a specific peer id (or ids).

#### Type Parameters

##### TReq

`TReq` = `unknown`

##### TRes

`TRes` = `unknown`

#### Parameters

##### peerId

`string` | `string`[]

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
