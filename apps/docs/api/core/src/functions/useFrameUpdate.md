[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFrameUpdate

# Function: useFrameUpdate()

> **useFrameUpdate**(`fn`, `opts`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:204](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/fc/hooks.ts#L204)

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
