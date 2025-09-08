[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / StatsService

# Class: StatsService

Defined in: [core/src/services/Stats.ts:24](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/services/Stats.ts#L24)

The world stats service.

## Extends

- [`Service`](Service.md)

## Constructors

### Constructor

> **new StatsService**(): `StatsService`

#### Returns

`StatsService`

#### Inherited from

[`Service`](Service.md).[`constructor`](Service.md#constructor)

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: [core/src/Service.ts:16](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Service.ts#L16)

Attaches the service to the world.

#### Parameters

##### world

[`World`](World.md)

The world to attach the service to.

#### Returns

`void`

#### Inherited from

[`Service`](Service.md).[`attach`](Service.md#attach)

***

### detach()

> **detach**(): `void`

Defined in: [core/src/Service.ts:23](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Service.ts#L23)

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

[`Service`](Service.md).[`detach`](Service.md#detach)

***

### get()

> **get**(): `StatsSnapshot`

Defined in: [core/src/services/Stats.ts:29](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/services/Stats.ts#L29)

Gets the stats snapshot.

#### Returns

`StatsSnapshot`

The stats snapshot.
