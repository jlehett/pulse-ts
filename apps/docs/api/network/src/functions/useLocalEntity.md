[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useLocalEntity

# Function: useLocalEntity()

> **useLocalEntity**(`stableId`): `void`

Defined in: [packages/network/src/public/entity.ts](https://github.com/jlehett/pulse-ts/blob/main/packages/network/src/public/entity.ts)

Sets up a producer-side replicated entity: assigns stable ID
and configures transform replication as producer.

Combines `useStableId` + `useReplicateTransform({ role: 'producer' })`
into a single call.

## Parameters

### stableId

`string`

Unique network identity for this entity.

## Returns

`void`

## Example

```ts
useLocalEntity(`player-${playerId}`);
```
