[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / StatsOverlaySystem

# Class: StatsOverlaySystem

Defined in: [packages/three/src/domain/systems/statsOverlay.ts:40](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/statsOverlay.ts#L40)

Displays a stats overlay (FPS, fixed SPS) inside Three's container element.

- Appends a positioned `<div>` overlay next to the Three canvas.
- Reads values from `StatsService` every `updateMs`.

## Example

```ts
import { World } from '@pulse-ts/core';
import { StatsOverlaySystem, ThreeService } from '@pulse-ts/three';
const world = new World();
world.provideService(new ThreeService({ canvas: document.createElement('canvas') }));
world.addSystem(new StatsOverlaySystem({ position: 'top-right' }));
```

## Extends

- `System`

## Constructors

### Constructor

> **new StatsOverlaySystem**(`opts?`): `StatsOverlaySystem`

Defined in: [packages/three/src/domain/systems/statsOverlay.ts:49](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/statsOverlay.ts#L49)

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

Defined in: [packages/three/src/domain/systems/statsOverlay.ts:43](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/statsOverlay.ts#L43)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: [packages/three/src/domain/systems/statsOverlay.ts:41](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/statsOverlay.ts#L41)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'late'`

Defined in: [packages/three/src/domain/systems/statsOverlay.ts:42](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/statsOverlay.ts#L42)

The phase of the update that this system is registered for.
Defaults to 'update'.

#### Overrides

`System.updatePhase`

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: [packages/three/src/domain/systems/statsOverlay.ts:53](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/statsOverlay.ts#L53)

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

Defined in: [packages/three/src/domain/systems/statsOverlay.ts:94](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/statsOverlay.ts#L94)

Detaches the system from the world.

#### Returns

`void`

#### Overrides

`System.detach`

***

### update()

> **update**(`dt`): `void`

Defined in: [packages/three/src/domain/systems/statsOverlay.ts:100](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/statsOverlay.ts#L100)

Method that will be called on every tick that this system is registered for.

#### Parameters

##### dt

`number`

#### Returns

`void`

#### Overrides

`System.update`
