[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Node

# Class: Node

Defined in: [packages/core/src/domain/ecs/base/node.ts:23](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L23)

A Node is an entity in the scene graph.

- Nodes form parent/child hierarchies.
- Components attach to nodes to hold data/state.
- Ticks registered on a node run according to the world's update loop.

## Example

```ts
const world = new World();
const parent = world.add(new Node());
const child = world.add(new Node());
parent.addChild(child);
```

## Constructors

### Constructor

> **new Node**(): `Node`

#### Returns

`Node`

## Properties

### \[kRegisteredTicks\]

> **\[kRegisteredTicks\]**: `TickRegistration`[] = `[]`

Defined in: [packages/core/src/domain/ecs/base/node.ts:32](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L32)

***

### children

> **children**: `Node`[] = `[]`

Defined in: [packages/core/src/domain/ecs/base/node.ts:30](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L30)

***

### id

> `readonly` **id**: `number`

Defined in: [packages/core/src/domain/ecs/base/node.ts:26](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L26)

***

### parent

> **parent**: `null` \| `Node` = `null`

Defined in: [packages/core/src/domain/ecs/base/node.ts:29](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L29)

***

### world

> **world**: `null` \| [`World`](World.md) = `null`

Defined in: [packages/core/src/domain/ecs/base/node.ts:27](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L27)

## Methods

### addChild()

> **addChild**(`child`): `this`

Defined in: [packages/core/src/domain/ecs/base/node.ts:43](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L43)

Adds a child node to this node.

#### Parameters

##### child

`Node`

The child node to add.

#### Returns

`this`

The node.

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/domain/ecs/base/node.ts:86](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L86)

Destroys the node and its subtree.

#### Returns

`void`

***

### onDestroy()?

> `optional` **onDestroy**(): `void`

Defined in: [packages/core/src/domain/ecs/base/node.ts:110](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L110)

Called when the node is destroyed.

#### Returns

`void`

***

### onInit()?

> `optional` **onInit**(): `void`

Defined in: [packages/core/src/domain/ecs/base/node.ts:105](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L105)

Called when the node is initialized.

#### Returns

`void`

***

### removeChild()

> **removeChild**(`child`): `this`

Defined in: [packages/core/src/domain/ecs/base/node.ts:72](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/base/node.ts#L72)

Removes a child node from this node. Does not remove it from the world.

#### Parameters

##### child

`Node`

The child node to remove.

#### Returns

`this`

The node.
