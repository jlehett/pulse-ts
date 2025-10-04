[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / ThreeService

# Class: ThreeService

Defined in: [packages/three/src/services/Three.ts:56](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L56)

ThreeService: provides renderer/scene/camera and scene-graph bridging.

- Lifecycles with the `World` as a `Service` (not a `System`).
- Focused systems (render, camera PV, TRS sync) consume this service.
- Encapsulates Node ↔ Object3D root mapping and parenting.

## Example

```ts
import { World, Node } from '@pulse-ts/core';
import { ThreeService } from '@pulse-ts/three';

const world = new World();
const canvas = document.createElement('canvas');
const three = world.provideService(new ThreeService({ canvas }));
const node = world.add(new Node());
const root = three.ensureRoot(node); // Object3D root for this node
```

## Extends

- `Service`

## Constructors

### Constructor

> **new ThreeService**(`opts`): `ThreeService`

Defined in: [packages/three/src/services/Three.ts:67](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L67)

#### Parameters

##### opts

[`ThreeOptions`](../interfaces/ThreeOptions.md)

#### Returns

`ThreeService`

#### Overrides

`Service.constructor`

## Properties

### camera

> `readonly` **camera**: `PerspectiveCamera`

Defined in: [packages/three/src/services/Three.ts:59](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L59)

***

### options

> `readonly` **options**: `Required`\<[`ThreeOptions`](../interfaces/ThreeOptions.md)\>

Defined in: [packages/three/src/services/Three.ts:60](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L60)

***

### renderer

> `readonly` **renderer**: `WebGLRenderer`

Defined in: [packages/three/src/services/Three.ts:57](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L57)

***

### scene

> `readonly` **scene**: `Scene`

Defined in: [packages/three/src/services/Three.ts:58](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L58)

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: [packages/three/src/services/Three.ts:97](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L97)

Attaches the service to the world.

#### Parameters

##### world

`World`

The world to attach the service to.

#### Returns

`void`

#### Overrides

`Service.attach`

***

### attachChild()

> **attachChild**(`node`, `child`): `void`

Defined in: [packages/three/src/services/Three.ts:156](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L156)

Attaches a child `Object3D` to the root of the given node.

#### Parameters

##### node

`Node`

The node to attach the child to.

##### child

`Object3D`

The child `Object3D` to attach.

#### Returns

`void`

***

### detach()

> **detach**(): `void`

Defined in: [packages/three/src/services/Three.ts:111](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L111)

Detaches the service from the world.

#### Returns

`void`

#### Overrides

`Service.detach`

***

### detachChild()

> **detachChild**(`node`, `child`): `void`

Defined in: [packages/three/src/services/Three.ts:166](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L166)

Detaches a child `Object3D` from the root of the given node.

#### Parameters

##### node

`Node`

The node to detach the child from.

##### child

`Object3D`

The child `Object3D` to detach.

#### Returns

`void`

***

### disposeRoot()

> **disposeRoot**(`node`): `void`

Defined in: [packages/three/src/services/Three.ts:176](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L176)

Disposes the root `Object3D` for the given node and removes it from the scene graph.

#### Parameters

##### node

`Node`

The node to dispose the root for.

#### Returns

`void`

***

### ensureRoot()

> **ensureRoot**(`node`): `Object3D`

Defined in: [packages/three/src/services/Three.ts:135](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L135)

Ensures a root Object3D for the given node.

#### Parameters

##### node

`Node`

The node to ensure a root for.

#### Returns

`Object3D`

The root `THREE.Object3D`.

***

### iterateRoots()

> **iterateRoots**(): `IterableIterator`\<\[`Node`, `RootRecord`\]\>

Defined in: [packages/three/src/services/Three.ts:187](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/three/src/services/Three.ts#L187)

Iterates node→root records managed by the service.

#### Returns

`IterableIterator`\<\[`Node`, `RootRecord`\]\>

Iterator of `[Node, RootRecord]` entries.
