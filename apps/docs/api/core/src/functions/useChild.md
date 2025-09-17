[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useChild

# Function: useChild()

> **useChild**\<`P`\>(`fc`, `props?`): [`Node`](../classes/Node.md)

Defined in: [core/src/fc/hooks.ts:184](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L184)

Mounts a child function component as a `Node` parented to the current component's `Node`.

- The child is created immediately and added to the same `World`.
- The child's lifetime is tied to the parent; destroying the parent destroys the child.

## Type Parameters

### P

`P`

## Parameters

### fc

(`props`) => `void`

The child component function to mount.

### props?

`P`

Optional props to pass to the child component.

## Returns

[`Node`](../classes/Node.md)

The newly mounted child `Node`.
