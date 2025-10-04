[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / ThreeCameraPVSystem

# Class: ThreeCameraPVSystem

Defined in: [packages/three/src/systems/cameraPV.ts:21](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/cameraPV.ts#L21)

Pushes Three camera projection-view into the `CullingCamera` service.

- Runs first in `frame.early` by default.
- Enables core culling to use the Three camera.

## Example

```ts
import { World } from '@pulse-ts/core';
import { ThreeCameraPVSystem, ThreeService } from '@pulse-ts/three';
const world = new World();
world.provideService(new ThreeService({ canvas: document.createElement('canvas') }));
world.addSystem(new ThreeCameraPVSystem());
```

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

Defined in: [packages/three/src/systems/cameraPV.ts:24](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/cameraPV.ts#L24)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: [packages/three/src/systems/cameraPV.ts:22](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/cameraPV.ts#L22)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'early'`

Defined in: [packages/three/src/systems/cameraPV.ts:23](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/cameraPV.ts#L23)

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

Defined in: [packages/three/src/systems/cameraPV.ts:29](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/cameraPV.ts#L29)

Method that will be called on every tick that this system is registered for.

#### Returns

`void`

#### Overrides

`System.update`
