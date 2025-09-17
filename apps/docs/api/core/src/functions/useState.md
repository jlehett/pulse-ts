[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useState

# Function: useState()

> **useState**\<`T`\>(`key`, `initial`): \[() => `T`, (`next`) => `void`\]

Defined in: [core/src/fc/hooks.ts:199](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L199)

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
