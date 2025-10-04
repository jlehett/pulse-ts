[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useNode

# Function: useNode()

> **useNode**(): [`Node`](../classes/Node.md)

Defined in: [packages/core/src/domain/fc/hooks.ts:54](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/fc/hooks.ts#L54)

Returns the `Node` associated with the active function component.

- Only callable during `world.mount(...)` while the component function is executing.
- The returned `Node` is the one created by the current component.

## Returns

[`Node`](../classes/Node.md)

The current component's `Node`.
