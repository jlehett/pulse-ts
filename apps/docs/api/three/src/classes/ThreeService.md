[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / ThreeService

# Class: ThreeService

Defined in: [packages/three/src/services/Three.ts:26](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L26)

ThreeService: provides renderer/scene/camera and scene-graph bridging.

- Lifecycles with the World as a Service (not a System)
- Focused Systems (render, camera PV, TRS sync) consume this service
- Encapsulates node<->Object3D root mapping and parenting

## Extends

- `Service`

## Constructors

### Constructor

> **new ThreeService**(`opts`): `ThreeService`

Defined in: [packages/three/src/services/Three.ts:37](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L37)

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

Defined in: [packages/three/src/services/Three.ts:29](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L29)

***

### options

> `readonly` **options**: `Required`\<[`ThreeOptions`](../interfaces/ThreeOptions.md)\>

Defined in: [packages/three/src/services/Three.ts:30](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L30)

***

### renderer

> `readonly` **renderer**: `WebGLRenderer`

Defined in: [packages/three/src/services/Three.ts:27](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L27)

***

### scene

> `readonly` **scene**: `Scene`

Defined in: [packages/three/src/services/Three.ts:28](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L28)

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: [packages/three/src/services/Three.ts:67](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L67)

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

Defined in: [packages/three/src/services/Three.ts:126](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L126)

Attaches a child Object3D to the root of the given node.

#### Parameters

##### node

`Node`

The node to attach the child to.

##### child

`Object3D`

The child Object3D to attach.

#### Returns

`void`

***

### detach()

> **detach**(): `void`

Defined in: [packages/three/src/services/Three.ts:81](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L81)

Detaches the service from the world.

#### Returns

`void`

#### Overrides

`Service.detach`

***

### detachChild()

> **detachChild**(`node`, `child`): `void`

Defined in: [packages/three/src/services/Three.ts:136](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L136)

Detaches a child Object3D from the root of the given node.

#### Parameters

##### node

`Node`

The node to detach the child from.

##### child

`Object3D`

The child Object3D to detach.

#### Returns

`void`

***

### disposeRoot()

> **disposeRoot**(`node`): `void`

Defined in: [packages/three/src/services/Three.ts:146](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L146)

Disposes the root Object3D for the given node.

#### Parameters

##### node

`Node`

The node to dispose the root for.

#### Returns

`void`

***

### ensureRoot()

> **ensureRoot**(`node`): `Object3D`

Defined in: [packages/three/src/services/Three.ts:105](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L105)

Ensures a root Object3D for the given node.

#### Parameters

##### node

`Node`

The node to ensure a root for.

#### Returns

`Object3D`

The root Object3D.

***

### iterateRoots()

> **iterateRoots**(): `IterableIterator`\<\[`Node`, `RootRecord`\]\>

Defined in: [packages/three/src/services/Three.ts:157](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/three/src/services/Three.ts#L157)

Iterates over the roots.

#### Returns

`IterableIterator`\<\[`Node`, `RootRecord`\]\>

An iterator over the roots.
