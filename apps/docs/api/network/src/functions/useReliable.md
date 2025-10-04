[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useReliable

# Function: useReliable()

> **useReliable**\<`TReq`, `TRes`\>(`topic`): `object`

Defined in: [packages/network/src/fc/hooks.ts:462](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/fc/hooks.ts#L462)

Access a reliable request/ack channel by topic.

- Returns a stable `send` that resolves with a generic `{ status, result, reason }`.

## Type Parameters

### TReq

`TReq` = `any`

### TRes

`TRes` = `any`

## Parameters

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
