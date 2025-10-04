[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / withSave

# Function: withSave()

> **withSave**\<`P`\>(`id`, `opts`): (`fc`) => `FC`\<`P`\>

Defined in: packages/save/src/public/fc.ts:76

Curried variant of [defineFC](defineFC.md) for ergonomic composition.

## Type Parameters

### P

`P`

## Parameters

### id

`string`

Stable id for save files.

### opts

Optional config (autoRegister, mapProps).

#### autoRegister?

`boolean`

#### mapProps?

(`p`) => `unknown`

## Returns

> (`fc`): `FC`\<`P`\>

### Parameters

#### fc

`FC`\<`P`\>

### Returns

`FC`\<`P`\>

## Example

```ts
import { withSave } from '@pulse-ts/save';
const Saved = withSave('game:thing')((props) => void props);
```
