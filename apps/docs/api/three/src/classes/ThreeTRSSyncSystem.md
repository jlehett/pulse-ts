[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / ThreeTRSSyncSystem

# Class: ThreeTRSSyncSystem

Defined in: [packages/three/src/domain/systems/trsSync.ts:20](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/trsSync.ts#L20)

Synchronizes Node TRS into Three Object3D roots each frame before render.

- Copies local TRS (with interpolation when `alpha>0`) from `Transform` components into corresponding Three roots.
- Optionally respects core `Visibility` when `enableCulling` is `true`.

## Example

```ts
import { World } from '@pulse-ts/core';
import { ThreeTRSSyncSystem, ThreeService } from '@pulse-ts/three';
const world = new World();
world.provideService(new ThreeService({ canvas: document.createElement('canvas') }));
world.addSystem(new ThreeTRSSyncSystem());
```

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

Defined in: [packages/three/src/domain/systems/trsSync.ts:23](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/trsSync.ts#L23)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: [packages/three/src/domain/systems/trsSync.ts:21](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/trsSync.ts#L21)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'late'`

Defined in: [packages/three/src/domain/systems/trsSync.ts:22](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/trsSync.ts#L22)

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

Defined in: [packages/three/src/domain/systems/trsSync.ts:25](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/systems/trsSync.ts#L25)

Method that will be called on every tick that this system is registered for.

#### Returns

`void`

#### Overrides

`System.update`
