[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / getNetwork

# Function: getNetwork()

> **getNetwork**(`world`): `object`

Defined in: [packages/network/src/facade.ts:15](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/facade.ts#L15)

Simplified facade over common networking tasks for a given World.

## Parameters

### world

`World`

## Returns

### channel()

> `readonly` **channel**\<`T`\>(`name`): `object`

Typed channel helper.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### name

`ChannelName`

#### Returns

`object`

##### publish()

> `readonly` **publish**(`data`): `void`

###### Parameters

###### data

`T`

###### Returns

`void`

##### subscribe()

> `readonly` **subscribe**(`fn`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

###### Parameters

###### fn

[`ChannelHandler`](../type-aliases/ChannelHandler.md)\<`T`\>

###### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

### connect()

> `readonly` **connect**(`t`, `opts?`): `Promise`\<`void`\>

Sets the low-level transport and optionally connects (default true).

#### Parameters

##### t

[`Transport`](../interfaces/Transport.md) | () => [`Transport`](../interfaces/Transport.md)

##### opts?

###### autoConnect?

`boolean`

#### Returns

`Promise`\<`void`\>

### disconnect()

> `readonly` **disconnect**(): `Promise`\<`void`\>

Disconnects if connected.

#### Returns

`Promise`\<`void`\>

### reliable()

> `readonly` **reliable**\<`TReq`, `TRes`\>(`topic`): `object`

Reliable request/ack channel by topic.

#### Type Parameters

##### TReq

`TReq` = `unknown`

##### TRes

`TRes` = `unknown`

#### Parameters

##### topic

`string`

#### Returns

`object`

##### send()

> `readonly` **send**(`payload`, `opts?`): `Promise`\<[`ReliableResult`](../interfaces/ReliableResult.md)\<`TRes`\>\>

###### Parameters

###### payload

`TReq`

###### opts?

###### retries?

`number`

###### timeoutMs?

`number`

###### Returns

`Promise`\<[`ReliableResult`](../interfaces/ReliableResult.md)\<`TRes`\>\>

### replicate()

> `readonly` **replicate**\<`T`\>(`key`, `opts`): `object`

Registers a replica under an explicit entity id.
Returns helpers to dirty or dispose the registration.

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### key

`string`

##### opts

###### apply?

(`patch`) => `void`

###### id

`string`

###### read?

() => `T`

#### Returns

`object`

##### dispose()

> `readonly` **dispose**(): `void`

###### Returns

`void`

##### markDirty()

> `readonly` **markDirty**(): `void`

###### Returns

`void`

### rpc()

> `readonly` **rpc**\<`Req`, `Res`\>(`name`): `object`

RPC helper for a given method name.

#### Type Parameters

##### Req

`Req` = `unknown`

##### Res

`Res` = `unknown`

#### Parameters

##### name

`string`

#### Returns

`object`

##### call()

> `readonly` **call**(`payload`, `opts?`): `Promise`\<`Res`\>

###### Parameters

###### payload

`Req`

###### opts?

###### timeoutMs?

`number`

###### Returns

`Promise`\<`Res`\>

##### register()

> `readonly` **register**(`fn`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

###### Parameters

###### fn

(`payload`) => `Res` \| `Promise`\<`Res`\>

###### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

### stats()

> `readonly` **stats**(): `object`

Basic transport statistics.

#### Returns

`object`

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

### status()

> `readonly` **status**(): [`TransportStatus`](../type-aliases/TransportStatus.md)

Current connection status.

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)
