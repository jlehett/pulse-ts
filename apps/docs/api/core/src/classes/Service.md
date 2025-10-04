[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Service

# Abstract Class: Service

Defined in: [packages/core/src/domain/ecs/base/Service.ts:6](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/base/Service.ts#L6)

A service is a class that provides a functionality to the world.

## Extended by

- [`CullingCamera`](CullingCamera.md)
- [`StatsService`](StatsService.md)

## Constructors

### Constructor

> **new Service**(): `Service`

#### Returns

`Service`

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

***

### detach()

> **detach**(): `void`

Defined in: [packages/core/src/domain/ecs/base/Service.ts:23](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/base/Service.ts#L23)

Detaches the service from the world.

#### Returns

`void`
