[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useAction

# Function: useAction()

> **useAction**(`name`): () => [`ActionState`](../type-aliases/ActionState.md)

Defined in: [packages/input/src/public/hooks.ts:43](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/public/hooks.ts#L43)

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
