[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ClockSyncService

# Class: ClockSyncService

Defined in: [packages/network/src/services/ClockSyncService.ts:16](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ClockSyncService.ts#L16)

Estimates server clock offset/drift via periodic pings over a reserved channel.

- Offset = best (min-RTT) sample of sNowMs - (cSend+cRecv)/2.
- Provides `getServerNowMs()` for consumers that need authoritative timers.

## Extends

- `Service`

## Constructors

### Constructor

> **new ClockSyncService**(`opts`): `ClockSyncService`

Defined in: [packages/network/src/services/ClockSyncService.ts:28](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ClockSyncService.ts#L28)

#### Parameters

##### opts

###### burst?

`number`

###### intervalMs?

`number`

#### Returns

`ClockSyncService`

#### Overrides

`Service.constructor`

## Properties

### onSample

> `readonly` **onSample**: `TypedEvent`\<\{ `offsetMs`: `number`; `rttMs`: `number`; \}\>

Defined in: [packages/network/src/services/ClockSyncService.ts:26](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ClockSyncService.ts#L26)

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

### detach()

> **detach**(): `void`

Defined in: packages/core/dist/index.d.ts:254

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### getOffsetMs()

> **getOffsetMs**(): `number`

Defined in: [packages/network/src/services/ClockSyncService.ts:65](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ClockSyncService.ts#L65)

Returns the current best-known server->client offset in ms.

#### Returns

`number`

***

### getServerNowMs()

> **getServerNowMs**(): `number`

Defined in: [packages/network/src/services/ClockSyncService.ts:70](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ClockSyncService.ts#L70)

Returns an estimated server time in ms.

#### Returns

`number`

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/network/src/services/ClockSyncService.ts:75](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ClockSyncService.ts#L75)

Returns sampling stats.

#### Returns

`object`

##### bestRttMs

> **bestRttMs**: `number`

##### offsetMs

> **offsetMs**: `number`

##### samples

> **samples**: `number`

***

### start()

> **start**(): `void`

Defined in: [packages/network/src/services/ClockSyncService.ts:35](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ClockSyncService.ts#L35)

Starts periodic clock sync pings. Idempotent.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/network/src/services/ClockSyncService.ts:57](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/services/ClockSyncService.ts#L57)

Stops clock sync.

#### Returns

`void`
