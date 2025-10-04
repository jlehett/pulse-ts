[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useInput

# Function: useInput()

> **useInput**(): [`InputService`](../classes/InputService.md)

Defined in: [packages/input/src/public/hooks.ts:20](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/public/hooks.ts#L20)

Get the `InputService` bound to the current world.

## Returns

[`InputService`](../classes/InputService.md)

The `InputService` instance.

## Example

```ts
import { useInput } from '@pulse-ts/input';
const input = useInput();
// use inside FC hooks to query actions/axes
```
