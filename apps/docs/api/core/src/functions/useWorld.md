[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useWorld

# Function: useWorld()

> **useWorld**(): [`World`](../classes/World.md)

Defined in: [packages/core/src/domain/fc/hooks.ts:33](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/domain/fc/hooks.ts#L33)

Returns the `World` that is currently mounting the active function component.

- Only callable during `world.mount(...)` while the component function is executing.
- Throws if used outside of component mount (similar to React hook rules).
- The returned reference is stable for the lifetime of the component.

## Returns

[`World`](../classes/World.md)

The current `World` instance.

## Example

```ts
import { World, useWorld, useFrameUpdate } from '@pulse-ts/core';
function GameLoop() {
  const world = useWorld();
  useFrameUpdate(() => {
    // read perf each frame
    void world.getPerf();
  });
}
new World().mount(GameLoop);
```
