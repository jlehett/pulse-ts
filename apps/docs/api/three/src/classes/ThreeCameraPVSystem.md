[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / ThreeCameraPVSystem

# Class: ThreeCameraPVSystem

Defined in: [three/src/systems/cameraPV.ts:9](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/three/src/systems/cameraPV.ts#L9)

Pushes Three camera projection-view into the CullingCamera service.

## Extends

- `System`

## Constructors

### Constructor

> **new ThreeCameraPVSystem**(): `ThreeCameraPVSystem`

#### Returns

`ThreeCameraPVSystem`

#### Inherited from

`System.constructor`

## Properties

### order

> `static` **order**: `number` = `Number.MIN_SAFE_INTEGER`

Defined in: [three/src/systems/cameraPV.ts:12](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/three/src/systems/cameraPV.ts#L12)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: [three/src/systems/cameraPV.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/three/src/systems/cameraPV.ts#L10)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'early'`

Defined in: [three/src/systems/cameraPV.ts:11](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/three/src/systems/cameraPV.ts#L11)

The phase of the update that this system is registered for.
Defaults to 'update'.

#### Overrides

`System.updatePhase`

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: core/dist/index.d.ts:261

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

Defined in: core/dist/index.d.ts:265

Detaches the system from the world.

#### Returns

`void`

#### Inherited from

`System.detach`

***

### update()

> **update**(): `void`

Defined in: [three/src/systems/cameraPV.ts:17](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/three/src/systems/cameraPV.ts#L17)

Method that will be called on every tick that this system is registered for.

#### Returns

`void`

#### Overrides

`System.update`
