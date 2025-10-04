[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useReliableTo

# Function: useReliableTo()

> **useReliableTo**\<`TReq`, `TRes`\>(`peerId`, `topic`): `object`

Defined in: [packages/network/src/fc/hooks.ts:483](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/fc/hooks.ts#L483)

Access a reliable request/ack channel addressed to a specific peer (or peers).

## Type Parameters

### TReq

`TReq` = `any`

### TRes

`TRes` = `any`

## Parameters

### peerId

`string` | `string`[]

### topic

`string`

## Returns

`object`

### send()

> `readonly` **send**: (`payload`, `opts?`) => `Promise`\<[`ReliableResult`](../interfaces/ReliableResult.md)\<`TRes`\>\>

#### Parameters

##### payload

`TReq`

##### opts?

###### retries?

`number`

###### timeoutMs?

`number`

#### Returns

`Promise`\<[`ReliableResult`](../interfaces/ReliableResult.md)\<`TRes`\>\>
