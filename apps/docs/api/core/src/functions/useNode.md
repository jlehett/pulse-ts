[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useNode

# Function: useNode()

> **useNode**(): [`Node`](../classes/Node.md)

Defined in: [packages/core/src/domain/fc/hooks.ts:54](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/fc/hooks.ts#L54)

Returns the `Node` associated with the active function component.

- Only callable during `world.mount(...)` while the component function is executing.
- The returned `Node` is the one created by the current component.

## Returns

[`Node`](../classes/Node.md)

The current component's `Node`.
