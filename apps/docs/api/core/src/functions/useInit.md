[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useInit

# Function: useInit()

> **useInit**(`fn`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:78](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/fc/hooks.ts#L78)

Registers an initialization hook for the current component.

- Each function runs after the component function body has executed and the `Node` was added to the `World`.
- If the function returns another function, that returned function is registered as a destroy/cleanup hook.

## Parameters

### fn

() => `void` \| () => `void`

The function to run on initialization. Optionally returns a cleanup function.

## Returns

`void`

## Example

```ts
import { World, useInit } from '@pulse-ts/core';
function Spawner() {
  useInit(() => {
    // do one-time setup
    return () => void 0; // cleanup
  });
}
new World().mount(Spawner);
```
