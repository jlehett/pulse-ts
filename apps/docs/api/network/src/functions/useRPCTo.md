[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useRPCTo

# Function: useRPCTo()

> **useRPCTo**\<`Req`, `Res`\>(`peerId`, `name`, `handler?`): `object`

Defined in: [packages/network/src/fc/hooks.ts:358](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/fc/hooks.ts#L358)

Register or call an RPC method to a specific peer.

- If `handler` is provided, registers the method (same as useRPC).
- Returns a `call` function that targets a fixed peer via callTo().

## Type Parameters

### Req

`Req` = `unknown`

### Res

`Res` = `unknown`

## Parameters

### peerId

`string`

### name

`string`

### handler?

(`payload`) => `Res` \| `Promise`\<`Res`\>

## Returns

### call()

> `readonly` **call**: (`payload`, `opts?`) => `Promise`\<`Res`\>

Calls the RPC method on the given peer id and awaits the result.

#### Parameters

##### payload

`Req`

##### opts?

###### timeoutMs?

`number`

#### Returns

`Promise`\<`Res`\>
