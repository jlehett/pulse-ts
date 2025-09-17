[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / RpcService

# Class: RpcService

Defined in: [network/src/services/RpcService.ts:16](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/RpcService.ts#L16)

Lightweight RPC over TransportService using a reserved channel (`__rpc`).

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

### call()

> **call**\<`Req`, `Res`\>(`name`, `payload`, `opts`): `Promise`\<`Res`\>

Defined in: [network/src/services/RpcService.ts:45](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/RpcService.ts#L45)

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

### detach()

> **detach**(): `void`

Defined in: core/dist/index.d.ts:288

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### register()

> **register**\<`Req`, `Res`\>(`name`, `fn`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [network/src/services/RpcService.ts:30](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/RpcService.ts#L30)

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
