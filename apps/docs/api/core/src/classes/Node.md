[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Node

# Class: Node

Defined in: [core/src/node.ts:7](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L7)

## Constructors

### Constructor

> **new Node**(): `Node`

#### Returns

`Node`

## Properties

### \[kRegisteredTicks\]

> **\[kRegisteredTicks\]**: [`TickRegistration`](../interfaces/TickRegistration.md)[] = `[]`

Defined in: [core/src/node.ts:16](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L16)

***

### children

> **children**: `Node`[] = `[]`

Defined in: [core/src/node.ts:14](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L14)

***

### id

> `readonly` **id**: `number`

Defined in: [core/src/node.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L10)

***

### parent

> **parent**: `null` \| `Node` = `null`

Defined in: [core/src/node.ts:13](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L13)

***

### world

> **world**: `null` \| [`World`](World.md) = `null`

Defined in: [core/src/node.ts:11](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L11)

## Methods

### addChild()

> **addChild**(`child`): `this`

Defined in: [core/src/node.ts:27](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L27)

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

Defined in: [core/src/node.ts:70](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L70)

Destroys the node and its subtree.

#### Returns

`void`

***

### onDestroy()?

> `optional` **onDestroy**(): `void`

Defined in: [core/src/node.ts:92](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L92)

Called when the node is destroyed.

#### Returns

`void`

***

### onInit()?

> `optional` **onInit**(): `void`

Defined in: [core/src/node.ts:87](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L87)

Called when the node is initialized.

#### Returns

`void`

***

### removeChild()

> **removeChild**(`child`): `this`

Defined in: [core/src/node.ts:56](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/node.ts#L56)

Removes a child node from this node. Does not remove it from the world.

#### Parameters

##### child

`Node`

The child node to remove.

#### Returns

`this`

The node.
