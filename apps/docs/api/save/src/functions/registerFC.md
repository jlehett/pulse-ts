[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerFC

# Function: registerFC()

> **registerFC**\<`P`\>(`id`, `fc`): `void`

Defined in: packages/save/src/domain/registries/fcRegistry.ts:13

Register a Function Component so rebuild loads can remount by id.

## Type Parameters

### P

`P` = `any`

## Parameters

### id

`string`

Stable id used in save files (e.g., 'game:player').

### fc

`FC`\<`P`\>

The function component reference.

## Returns

`void`

## Example

```ts
import { registerFC } from '@pulse-ts/save';
registerFC('game:thing', (props) => void props);
```
