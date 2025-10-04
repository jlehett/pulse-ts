[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useState

# Function: useState()

> **useState**\<`T`\>(`key`, `initial`): \[() => `T`, (`next`) => `void`\]

Defined in: [packages/core/src/domain/fc/hooks.ts:266](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/fc/hooks.ts#L266)

Persistent state hook for Pulse FCs (no re-render model).

- Values are stored in the node's `State` component (JSON-serializable recommended).
- Returns [get, set] where get() reads the latest value each time.
- Setter supports functional updates.

## Type Parameters

### T

`T`

## Parameters

### key

`string`

The key to store the state for.

### initial

The initial value to store.

`T` | () => `T`

## Returns

\[() => `T`, (`next`) => `void`\]

A tuple of [get, set] where get() reads the latest value each time.

## Example

```ts
import { World, useState, useFrameUpdate } from '@pulse-ts/core';
function Counter() {
  const [get, set] = useState('count', 0);
  useFrameUpdate(() => set((c) => c + 1));
}
new World().mount(Counter);
```
