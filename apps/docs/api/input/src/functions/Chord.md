[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Chord

# Function: Chord()

> **Chord**(`keys`): [`ChordBinding`](../type-aliases/ChordBinding.md)

Defined in: [packages/input/src/domain/bindings/expr.ts:172](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/expr.ts#L172)

Create a chord binding (simultaneous keys must be held down together).

## Parameters

### keys

(`string` \| [`KeyBinding`](../type-aliases/KeyBinding.md))[]

Array of `Key(...)` or shorthand strings.

## Returns

[`ChordBinding`](../type-aliases/ChordBinding.md)

The chord binding expression.

## Example

```ts
import { Chord, Key } from '@pulse-ts/input';
const jump = Chord([Key('Space')]);
```
