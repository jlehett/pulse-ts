[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useChild

# Function: useChild()

> **useChild**\<`P`\>(`fc`, `props?`): [`Node`](../classes/Node.md)

Defined in: [packages/core/src/domain/fc/hooks.ts:241](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/fc/hooks.ts#L241)

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

## Example

```ts
import { World, useChild } from '@pulse-ts/core';
function Child() {}
function Parent() {
  useChild(Child);
}
new World().mount(Parent);
```
