[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / RemoteEntityHandle

# Interface: RemoteEntityHandle

Defined in: [packages/network/src/public/entity.ts](https://github.com/jlehett/pulse-ts/blob/main/packages/network/src/public/entity.ts)

Interpolation data handle returned by [useRemoteEntity](../functions/useRemoteEntity.md).

## Properties

### stableId

> `readonly` **stableId**: `string`

The stable ID used for replication.

### targetVelocity

> `readonly` **targetVelocity**: `{ x: number; y: number; z: number }` \| `null`

Current target velocity from the interpolation service (may be null before first network update).

### targetPosition

> `readonly` **targetPosition**: `{ x: number; y: number; z: number }` \| `null`

Current target position from the interpolation service (may be null before first network update).
