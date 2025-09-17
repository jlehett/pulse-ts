[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useReliable

# Function: useReliable()

> **useReliable**\<`TReq`, `TRes`\>(`topic`): `object`

Defined in: [network/src/fc/hooks.ts:236](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/fc/hooks.ts#L236)

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
