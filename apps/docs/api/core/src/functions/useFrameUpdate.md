[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFrameUpdate

# Function: useFrameUpdate()

> **useFrameUpdate**(`fn`, `opts`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:204](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/domain/fc/hooks.ts#L204)

Registers a frame tick in the `update` phase.

- Runs once per rendered frame after `frame.early` and before `frame.late`.
- Use for animation and per-frame logic.

## Parameters

### fn

(`dt`) => `void`

Callback invoked with `dt` in seconds for the variable frame step.

### opts

`TickOpts` = `{}`

Optional scheduling options (lower `order` runs earlier; default 0).

## Returns

`void`

## Example

```ts
import { World, useFrameUpdate } from '@pulse-ts/core';
function Rotator() {
  useFrameUpdate((dt) => {
    // advance state using dt
  });
}
new World().mount(Rotator);
```
