[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / StatsOverlaySystem

# Class: StatsOverlaySystem

Defined in: [packages/three/src/systems/statsOverlay.ts:18](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/statsOverlay.ts#L18)

Displays stats overlay on the screen (FPS, fixed sps) using Three's DOM element.

## Extends

- `System`

## Constructors

### Constructor

> **new StatsOverlaySystem**(`opts?`): `StatsOverlaySystem`

Defined in: [packages/three/src/systems/statsOverlay.ts:27](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/statsOverlay.ts#L27)

#### Parameters

##### opts?

[`StatsOverlayOptions`](../interfaces/StatsOverlayOptions.md)

#### Returns

`StatsOverlaySystem`

#### Overrides

`System.constructor`

## Properties

### order

> `static` **order**: `number`

Defined in: [packages/three/src/systems/statsOverlay.ts:21](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/statsOverlay.ts#L21)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: [packages/three/src/systems/statsOverlay.ts:19](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/statsOverlay.ts#L19)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'late'`

Defined in: [packages/three/src/systems/statsOverlay.ts:20](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/statsOverlay.ts#L20)

The phase of the update that this system is registered for.
Defaults to 'update'.

#### Overrides

`System.updatePhase`

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: [packages/three/src/systems/statsOverlay.ts:31](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/statsOverlay.ts#L31)

Attaches the system to the world.

#### Parameters

##### world

`World`

The world to attach the system to.

#### Returns

`void`

#### Overrides

`System.attach`

***

### detach()

> **detach**(): `void`

Defined in: [packages/three/src/systems/statsOverlay.ts:72](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/statsOverlay.ts#L72)

Detaches the system from the world.

#### Returns

`void`

#### Overrides

`System.detach`

***

### update()

> **update**(`dt`): `void`

Defined in: [packages/three/src/systems/statsOverlay.ts:78](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/systems/statsOverlay.ts#L78)

Method that will be called on every tick that this system is registered for.

#### Parameters

##### dt

`number`

#### Returns

`void`

#### Overrides

`System.update`
