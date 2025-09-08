[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useRPC

# Function: useRPC()

> **useRPC**\<`Req`, `Res`\>(`name`, `handler?`): `object`

Defined in: [network/src/fc/hooks.ts:134](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/fc/hooks.ts#L134)

Register or call an RPC method over the network.

- If `handler` is provided, registers the method and returns a disposer via unmount.
- Always returns a `call` function to invoke the RPC.

## Type Parameters

### Req

`Req` = `unknown`

### Res

`Res` = `unknown`

## Parameters

### name

`string`

Method name.

### handler?

(`payload`) => `Res` \| `Promise`\<`Res`\>

Optional method implementation.

## Returns

### call()

> `readonly` **call**: (`payload`, `opts?`) => `Promise`\<`Res`\>

Calls the RPC method and awaits the result.

#### Parameters

##### payload

`Req`

##### opts?

###### timeoutMs?

`number`

#### Returns

`Promise`\<`Res`\>
