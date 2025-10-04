[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / ThreeRenderSystem

# Class: ThreeRenderSystem

Defined in: [packages/three/src/systems/render.ts:20](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/render.ts#L20)

Renders the Three scene each frame.

- Runs last in `frame.late` by default.
- Consumes renderer, scene, and camera from `ThreeService`.

## Example

```ts
import { World } from '@pulse-ts/core';
import { ThreeRenderSystem, ThreeService } from '@pulse-ts/three';
const world = new World();
world.provideService(new ThreeService({ canvas: document.createElement('canvas') }));
world.addSystem(new ThreeRenderSystem());
```

## Extends

- `System`

## Constructors

### Constructor

> **new ThreeRenderSystem**(): `ThreeRenderSystem`

#### Returns

`ThreeRenderSystem`

#### Inherited from

`System.constructor`

## Properties

### order

> `static` **order**: `number` = `Number.MAX_SAFE_INTEGER`

Defined in: [packages/three/src/systems/render.ts:23](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/render.ts#L23)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: [packages/three/src/systems/render.ts:21](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/render.ts#L21)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'late'`

Defined in: [packages/three/src/systems/render.ts:22](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/render.ts#L22)

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

Defined in: [packages/three/src/systems/render.ts:25](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/systems/render.ts#L25)

Method that will be called on every tick that this system is registered for.

#### Returns

`void`

#### Overrides

`System.update`
