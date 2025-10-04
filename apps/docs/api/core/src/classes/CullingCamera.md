[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / CullingCamera

# Class: CullingCamera

Defined in: [packages/core/src/domain/services/CullingCamera.ts:6](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/services/CullingCamera.ts#L6)

A service that provides a culling camera.

## Extends

- [`Service`](Service.md)

## Constructors

### Constructor

> **new CullingCamera**(`projView`): `CullingCamera`

Defined in: [packages/core/src/domain/services/CullingCamera.ts:7](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/services/CullingCamera.ts#L7)

#### Parameters

##### projView

`Float32Array`

#### Returns

`CullingCamera`

#### Overrides

[`Service`](Service.md).[`constructor`](Service.md#constructor)

## Properties

### projView

> **projView**: `Float32Array`

Defined in: [packages/core/src/domain/services/CullingCamera.ts:7](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/services/CullingCamera.ts#L7)

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: [packages/core/src/domain/ecs/base/Service.ts:16](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/Service.ts#L16)

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

Defined in: [packages/core/src/domain/ecs/base/Service.ts:23](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/Service.ts#L23)

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

[`Service`](Service.md).[`detach`](Service.md#detach)
