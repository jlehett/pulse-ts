[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useRPC

# Function: useRPC()

> **useRPC**\<`Req`, `Res`\>(`name`, `handler?`): `object`

Defined in: [packages/network/src/fc/hooks.ts:256](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/fc/hooks.ts#L256)

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
