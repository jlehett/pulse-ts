[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useNode

# Function: useNode()

> **useNode**(): [`Node`](../classes/Node.md)

Defined in: [core/src/fc/hooks.ts:30](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L30)

Returns the `Node` associated with the active function component.

- Only callable during `world.mount(...)` while the component function is executing.
- The returned `Node` is the one created by the current component.

## Returns

[`Node`](../classes/Node.md)

The current component's `Node`.
