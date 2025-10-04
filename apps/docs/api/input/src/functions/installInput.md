[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / installInput

# Function: installInput()

> **installInput**(`world`, `opts`): [`InputService`](../classes/InputService.md)

Defined in: [packages/input/src/public/install.ts:42](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/public/install.ts#L42)

Convenience installer for `@pulse-ts/input`.
Wires up the `InputService`, registers DOM providers when available, and
adds `InputCommitSystem` to snapshot input at frame.early.

## Parameters

### world

`World`

The world to install into.

### opts

[`InstallInputOptions`](../type-aliases/InstallInputOptions.md) = `{}`

Optional install options and default bindings.

## Returns

[`InputService`](../classes/InputService.md)

The created and registered `InputService`.

## Example

```ts
import { World } from '@pulse-ts/core';
import { installInput, Axis2D, Key } from '@pulse-ts/input';

const world = new World();
const input = installInput(world, {
  preventDefault: true,
  bindings: {
    move: Axis2D({ x: { pos: Key('D'), neg: Key('A') }, y: { pos: Key('W'), neg: Key('S') } })
  }
});
// later in your FC, read via hooks
```
