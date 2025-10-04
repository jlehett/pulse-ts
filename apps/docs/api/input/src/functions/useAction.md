[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useAction

# Function: useAction()

> **useAction**(`name`): () => [`ActionState`](../type-aliases/ActionState.md)

Defined in: [packages/input/src/public/hooks.ts:43](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/public/hooks.ts#L43)

Create an accessor for an action's state.

## Parameters

### name

`string`

Action name.

## Returns

A function that returns the latest `ActionState` when called.

> (): [`ActionState`](../type-aliases/ActionState.md)

### Returns

[`ActionState`](../type-aliases/ActionState.md)

## Example

```ts
import { useAction } from '@pulse-ts/input';
const jump = useAction('jump');
// inside frame update
const { pressed } = jump();
```
