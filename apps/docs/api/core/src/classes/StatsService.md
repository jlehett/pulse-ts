[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / StatsService

# Class: StatsService

Defined in: [packages/core/src/domain/services/Stats.ts:24](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/services/Stats.ts#L24)

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

Defined in: [packages/core/src/domain/ecs/base/Service.ts:16](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/base/Service.ts#L16)

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

Defined in: [packages/core/src/domain/ecs/base/Service.ts:23](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/base/Service.ts#L23)

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

[`Service`](Service.md).[`detach`](Service.md#detach)

***

### get()

> **get**(): `StatsSnapshot`

Defined in: [packages/core/src/domain/services/Stats.ts:29](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/services/Stats.ts#L29)

Gets the stats snapshot.

#### Returns

`StatsSnapshot`

The stats snapshot.
