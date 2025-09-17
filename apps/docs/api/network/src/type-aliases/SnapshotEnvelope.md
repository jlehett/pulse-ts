[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / SnapshotEnvelope

# Type Alias: SnapshotEnvelope

> **SnapshotEnvelope** = `object`

Defined in: [network/src/replication/protocol.ts:4](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/replication/protocol.ts#L4)

Snapshot message envelope for replication. Sent over the `__rep` channel.

## Properties

### ents

> **ents**: `object`[]

Defined in: [network/src/replication/protocol.ts:12](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/replication/protocol.ts#L12)

Entities with replica patches.

#### id

> **id**: `string`

Stable entity identifier (StableId.id).

#### reps

> **reps**: `Record`\<`string`, `any`\>

Replica key -> shallow patch object.

***

### full?

> `optional` **full**: `boolean`

Defined in: [network/src/replication/protocol.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/replication/protocol.ts#L10)

True for full snapshot; omitted/false for delta.

***

### seq

> **seq**: `number`

Defined in: [network/src/replication/protocol.ts:8](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/replication/protocol.ts#L8)

Monotonic sequence for ordering.

***

### t

> **t**: `"snap"`

Defined in: [network/src/replication/protocol.ts:6](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/replication/protocol.ts#L6)

Message type. Currently only 'snap'.
