[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / installInput

# Function: installInput()

> **installInput**(`world`, `opts`): [`InputService`](../classes/InputService.md)

Defined in: packages/input/src/public/install.ts:35

Convenience installer for @pulse-ts/input.

Example
```ts
import { World } from '@pulse-ts/core';
import { installInput, Axis2D, Key } from '@pulse-ts/input';

const world = new World();
installInput(world, {
  preventDefault: true,
  bindings: {
    move: Axis2D({ x: { pos: Key('D'), neg: Key('A') }, y: { pos: Key('W'), neg: Key('S') } })
  }
});
```

## Parameters

### world

`World`

### opts

`InstallInputOptions` = `{}`

## Returns

[`InputService`](../classes/InputService.md)
