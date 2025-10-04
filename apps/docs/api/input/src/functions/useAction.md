[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useAction

# Function: useAction()

> **useAction**(`name`): () => [`ActionState`](../type-aliases/ActionState.md)

Defined in: packages/input/src/public/hooks.ts:43

Get the action state for a given action name.

## Parameters

### name

`string`

The name of the action.

## Returns

The action state accessor.

Example
```ts
import { useAction } from '@pulse-ts/input';
const jump = useAction('jump');
// inside frame update
const { pressed } = jump();
```

> (): [`ActionState`](../type-aliases/ActionState.md)

### Returns

[`ActionState`](../type-aliases/ActionState.md)
