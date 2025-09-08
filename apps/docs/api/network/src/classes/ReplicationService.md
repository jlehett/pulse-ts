[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ReplicationService

# Class: ReplicationService

Defined in: [network/src/services/ReplicationService.ts:25](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReplicationService.ts#L25)

Service for entity replication via periodic snapshots/deltas.

- Entities are identified by StableId.id (provided via user code).
- A "replica" is a named state slice under an entity (e.g., 'transform').
- Replicas provide `read()` to snapshot state and `apply(patch)` to consume deltas.
- Shallow diff is used for delta; custom equality can be done inside `read()`.

## Extends

- `Service`

## Constructors

### Constructor

> **new ReplicationService**(`opts`): `ReplicationService`

Defined in: [network/src/services/ReplicationService.ts:37](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReplicationService.ts#L37)

#### Parameters

##### opts

###### channel?

`string`

###### sendHz?

`number`

#### Returns

`ReplicationService`

#### Overrides

`Service.constructor`

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: core/dist/index.d.ts:284

Attaches the service to the world.

#### Parameters

##### world

`World`

The world to attach the service to.

#### Returns

`void`

#### Inherited from

`Service.attach`

***

### configure()

> **configure**(`opts`): `void`

Defined in: [network/src/services/ReplicationService.ts:46](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReplicationService.ts#L46)

Updates replication options (channel and/or send rate).

#### Parameters

##### opts

`Partial`\<\{ `channel`: `string`; `sendHz`: `number`; \}\>

#### Returns

`void`

***

### detach()

> **detach**(): `void`

Defined in: core/dist/index.d.ts:288

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### getStats()

> **getStats**(): `object`

Defined in: [network/src/services/ReplicationService.ts:169](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReplicationService.ts#L169)

Returns basic replication stats.

#### Returns

`object`

##### entitiesTracked

> **entitiesTracked**: `number`

##### sendHz

> **sendHz**: `number`

##### sentEntities

> **sentEntities**: `number`

##### sentReplicas

> **sentReplicas**: `number`

##### seq

> **seq**: `number`

***

### markDirty()

> **markDirty**(`entityId`, `key?`): `void`

Defined in: [network/src/services/ReplicationService.ts:78](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReplicationService.ts#L78)

Marks a replica dirty (forces inclusion in next snapshot).

#### Parameters

##### entityId

`string`

##### key?

`string`

#### Returns

`void`

***

### register()

> **register**(`entityId`, `key`, `rec`): () => `void`

Defined in: [network/src/services/ReplicationService.ts:53](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReplicationService.ts#L53)

Registers a replica under an entity id. Returns a disposer.

#### Parameters

##### entityId

`string`

##### key

`string`

##### rec

###### apply?

`ApplyFn`

###### read?

`ReadFn`

#### Returns

> (): `void`

##### Returns

`void`

***

### sendSnapshot()

> **sendSnapshot**(): `void`

Defined in: [network/src/services/ReplicationService.ts:100](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReplicationService.ts#L100)

Sends a delta snapshot to all peers via TransportService.

#### Returns

`void`

***

### tick()

> **tick**(`dt`): `void`

Defined in: [network/src/services/ReplicationService.ts:90](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ReplicationService.ts#L90)

Ticks snapshot scheduling; call from a System.

#### Parameters

##### dt

`number`

#### Returns

`void`
