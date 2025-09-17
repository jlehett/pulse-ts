[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / ClockSyncService

# Class: ClockSyncService

Defined in: [network/src/services/ClockSyncService.ts:15](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ClockSyncService.ts#L15)

Estimates server clock offset/drift via periodic pings over channel `__clock`.

- Offset = best (min-RTT) sample of sNowMs - (cSend+cRecv)/2.
- Provides `getServerNowMs()` for consumers that need authoritative timers.

## Extends

- `Service`

## Constructors

### Constructor

> **new ClockSyncService**(`opts`): `ClockSyncService`

Defined in: [network/src/services/ClockSyncService.ts:27](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ClockSyncService.ts#L27)

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

Defined in: [network/src/services/ClockSyncService.ts:25](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ClockSyncService.ts#L25)

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

### detach()

> **detach**(): `void`

Defined in: core/dist/index.d.ts:288

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### getOffsetMs()

> **getOffsetMs**(): `number`

Defined in: [network/src/services/ClockSyncService.ts:63](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ClockSyncService.ts#L63)

Returns the current best-known server->client offset in ms.

#### Returns

`number`

***

### getServerNowMs()

> **getServerNowMs**(): `number`

Defined in: [network/src/services/ClockSyncService.ts:68](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ClockSyncService.ts#L68)

Returns an estimated server time in ms.

#### Returns

`number`

***

### getStats()

> **getStats**(): `object`

Defined in: [network/src/services/ClockSyncService.ts:73](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ClockSyncService.ts#L73)

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

Defined in: [network/src/services/ClockSyncService.ts:34](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ClockSyncService.ts#L34)

Starts periodic clock sync pings. Idempotent.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [network/src/services/ClockSyncService.ts:55](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/ClockSyncService.ts#L55)

Stops clock sync.

#### Returns

`void`
