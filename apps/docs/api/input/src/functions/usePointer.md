[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / usePointer

# Function: usePointer()

> **usePointer**(): () => [`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

Defined in: packages/input/src/public/hooks.ts:93

Get the pointer state.

## Returns

The pointer snapshot accessor.

Example
```ts
import { usePointer } from '@pulse-ts/input';
const pointer = usePointer();
const { deltaX, deltaY } = pointer();
```

> (): [`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

### Returns

[`PointerSnapshot`](../type-aliases/PointerSnapshot.md)
