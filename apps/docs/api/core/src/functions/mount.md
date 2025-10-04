[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / mount

# Function: mount()

> **mount**\<`P`\>(`world`, `fc`, `props`, `opts?`): [`Node`](../classes/Node.md)

Defined in: [packages/core/src/domain/fc/runtime.ts:33](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/domain/fc/runtime.ts#L33)

Mounts a function component.

## Type Parameters

### P

`P`

## Parameters

### world

[`World`](../classes/World.md)

The world to mount the component in.

### fc

[`FC`](../type-aliases/FC.md)\<`P`\>

The function component to mount.

### props

The props to pass to the component.

`undefined` | `P`

### opts?

The options for the mount.

#### parent?

`null` \| [`Node`](../classes/Node.md)

## Returns

[`Node`](../classes/Node.md)

The node that was mounted.
