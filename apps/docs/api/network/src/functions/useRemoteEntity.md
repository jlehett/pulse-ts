[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useRemoteEntity

# Function: useRemoteEntity()

> **useRemoteEntity**(`stableId`, `options?`): [`RemoteEntityHandle`](../interfaces/RemoteEntityHandle.md)

Defined in: [packages/network/src/public/entity.ts](https://github.com/jlehett/pulse-ts/blob/main/packages/network/src/public/entity.ts)

Sets up a consumer-side replicated entity: assigns stable ID,
configures transform replication as consumer, and provides
convenient access to interpolation data.

Combines `useStableId` + `useReplicateTransform({ role: 'consumer' })`
into a single call with built-in interpolation data accessors.

## Parameters

### stableId

`string`

Unique network identity for this entity.

### options?

Optional configuration.

#### lambda?

`number`

Interpolation smoothing factor. Higher = snappier. Default 12.

## Returns

[`RemoteEntityHandle`](../interfaces/RemoteEntityHandle.md)

A handle with interpolation data accessors.

## Example

```ts
const remote = useRemoteEntity(`player-${remotePlayerId}`, { lambda: 25 });

useFixedUpdate(() => {
    const rv = remote.targetVelocity;
    if (rv) setPlayerVelocity(remotePlayerId, rv.x, rv.z);
});
```
