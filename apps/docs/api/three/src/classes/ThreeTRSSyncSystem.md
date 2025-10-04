[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / ThreeTRSSyncSystem

# Class: ThreeTRSSyncSystem

Defined in: [packages/three/src/systems/trsSync.ts:8](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/trsSync.ts#L8)

Synchronizes Node TRS into Three Object3D roots each frame before render.

## Extends

- `System`

## Constructors

### Constructor

> **new ThreeTRSSyncSystem**(): `ThreeTRSSyncSystem`

#### Returns

`ThreeTRSSyncSystem`

#### Inherited from

`System.constructor`

## Properties

### order

> `static` **order**: `number`

Defined in: [packages/three/src/systems/trsSync.ts:11](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/trsSync.ts#L11)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: [packages/three/src/systems/trsSync.ts:9](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/trsSync.ts#L9)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'late'`

Defined in: [packages/three/src/systems/trsSync.ts:10](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/trsSync.ts#L10)

The phase of the update that this system is registered for.
Defaults to 'update'.

#### Overrides

`System.updatePhase`

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: packages/core/dist/index.d.ts:227

Attaches the system to the world.

#### Parameters

##### world

`World`

The world to attach the system to.

#### Returns

`void`

#### Inherited from

`System.attach`

***

### detach()

> **detach**(): `void`

Defined in: packages/core/dist/index.d.ts:231

Detaches the system from the world.

#### Returns

`void`

#### Inherited from

`System.detach`

***

### update()

> **update**(): `void`

Defined in: [packages/three/src/systems/trsSync.ts:13](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/trsSync.ts#L13)

Method that will be called on every tick that this system is registered for.

#### Returns

`void`

#### Overrides

`System.update`
