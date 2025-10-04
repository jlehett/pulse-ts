[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / RpcService

# Class: RpcService

Defined in: [packages/network/src/services/RpcService.ts:17](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/services/RpcService.ts#L17)

Lightweight RPC over TransportService using a reserved channel.

- Broadcast topology: any peer with a registered handler for `m` may respond.
- Correlation via `id`; timeouts supported client-side.
- Payloads are codec-encoded by TransportService (JSON by default).

## Extends

- `Service`

## Constructors

### Constructor

> **new RpcService**(): `RpcService`

#### Returns

`RpcService`

#### Inherited from

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

### call()

> **call**\<`Req`, `Res`\>(`name`, `payload`, `opts`): `Promise`\<`Res`\>

Defined in: [packages/network/src/services/RpcService.ts:46](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/services/RpcService.ts#L46)

Calls a remote method by broadcasting a request and awaiting the first response.

#### Type Parameters

##### Req

`Req` = `unknown`

##### Res

`Res` = `unknown`

#### Parameters

##### name

`string`

Method name.

##### payload

`Req`

Request payload.

##### opts

Timeout options.

###### timeoutMs?

`number`

#### Returns

`Promise`\<`Res`\>

***

### callTo()

> **callTo**\<`Req`, `Res`\>(`peerId`, `name`, `payload`, `opts`): `Promise`\<`Res`\>

Defined in: [packages/network/src/services/RpcService.ts:71](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/services/RpcService.ts#L71)

Calls a remote method on a specific peer and awaits the response.

#### Type Parameters

##### Req

`Req` = `unknown`

##### Res

`Res` = `unknown`

#### Parameters

##### peerId

`string`

##### name

`string`

##### payload

`Req`

##### opts

###### timeoutMs?

`number`

#### Returns

`Promise`\<`Res`\>

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

### register()

> **register**\<`Req`, `Res`\>(`name`, `fn`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/network/src/services/RpcService.ts:31](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/services/RpcService.ts#L31)

Registers a method handler.

#### Type Parameters

##### Req

`Req` = `unknown`

##### Res

`Res` = `unknown`

#### Parameters

##### name

`string`

Method name.

##### fn

(`payload`) => `Res` \| `Promise`\<`Res`\>

Async or sync handler returning the result payload.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function.
