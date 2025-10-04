[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ReplicationService

# Class: ReplicationService

Defined in: [packages/network/src/services/ReplicationService.ts:26](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReplicationService.ts#L26)

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

Defined in: [packages/network/src/services/ReplicationService.ts:38](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReplicationService.ts#L38)

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

Defined in: packages/core/dist/index.d.ts:250

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

Defined in: [packages/network/src/services/ReplicationService.ts:47](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReplicationService.ts#L47)

Updates replication options (channel and/or send rate).

#### Parameters

##### opts

`Partial`\<\{ `channel`: `string`; `sendHz`: `number`; \}\>

#### Returns

`void`

***

### detach()

> **detach**(): `void`

Defined in: packages/core/dist/index.d.ts:254

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/network/src/services/ReplicationService.ts:170](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReplicationService.ts#L170)

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

Defined in: [packages/network/src/services/ReplicationService.ts:79](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReplicationService.ts#L79)

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

Defined in: [packages/network/src/services/ReplicationService.ts:54](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReplicationService.ts#L54)

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

Defined in: [packages/network/src/services/ReplicationService.ts:101](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReplicationService.ts#L101)

Sends a delta snapshot to all peers via TransportService.

#### Returns

`void`

***

### tick()

> **tick**(`dt`): `void`

Defined in: [packages/network/src/services/ReplicationService.ts:91](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ReplicationService.ts#L91)

Ticks snapshot scheduling; call from a System.

#### Parameters

##### dt

`number`

#### Returns

`void`
