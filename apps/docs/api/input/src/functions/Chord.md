[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Chord

# Function: Chord()

> **Chord**(`keys`): [`ChordBinding`](../type-aliases/ChordBinding.md)

Defined in: packages/input/src/domain/bindings/expr.ts:160

Create a Chord binding (simultaneous keys).

Example
```ts
import { Chord, Key } from '@pulse-ts/input';
const jump = Chord([Key('Space')]);
```

## Parameters

### keys

(`string` \| [`KeyBinding`](../type-aliases/KeyBinding.md))[]

## Returns

[`ChordBinding`](../type-aliases/ChordBinding.md)
