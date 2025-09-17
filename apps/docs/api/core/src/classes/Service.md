[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Service

# Abstract Class: Service

Defined in: [core/src/Service.ts:6](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Service.ts#L6)

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

Defined in: [core/src/Service.ts:16](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Service.ts#L16)

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

Defined in: [core/src/Service.ts:23](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Service.ts#L23)

Detaches the service from the world.

#### Returns

`void`
