[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / useSaveFC

# Function: useSaveFC()

> **useSaveFC**\<`P`\>(`id`, `props?`): `void`

Defined in: packages/save/src/public/fc.ts:17

Marks the current FC for persistence with a stable id and serializable props.
Call at the top of your FC.

## Type Parameters

### P

`P` = `any`

## Parameters

### id

`string`

Stable id string written into the save file.

### props?

`P`

Serializable props to persist for rebuild.

## Returns

`void`

## Example

```ts
import { useSaveFC } from '@pulse-ts/save';
export const Player = () => {
  useSaveFC('game:player', { speed: 2 });
};
```
