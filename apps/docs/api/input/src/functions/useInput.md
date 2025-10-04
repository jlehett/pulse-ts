[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useInput

# Function: useInput()

> **useInput**(): [`InputService`](../classes/InputService.md)

Defined in: packages/input/src/public/hooks.ts:20

Get the InputService.

## Returns

[`InputService`](../classes/InputService.md)

The InputService.

Example
```ts
import { useInput } from '@pulse-ts/input';
const getSvc = useInput();
const svc = getSvc; // callable in FC hooks
```
