[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / usePointer

# Function: usePointer()

> **usePointer**(): () => [`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

Defined in: [packages/input/src/public/hooks.ts:93](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/public/hooks.ts#L93)

Create an accessor for the pointer snapshot for this frame.

## Returns

A function that returns the latest `PointerSnapshot`.

> (): [`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

### Returns

[`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

## Example

```ts
import { usePointer } from '@pulse-ts/input';
const pointer = usePointer();
const { deltaX, deltaY } = pointer();
```
