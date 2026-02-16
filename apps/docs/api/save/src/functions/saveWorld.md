[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / saveWorld

# Function: saveWorld()

> **saveWorld**(`world`, `opts`): [`SaveFile`](../type-aliases/SaveFile.md)

Defined in: packages/save/src/public/world.ts:18

Saves the world to a JSON-safe object.

## Parameters

### world

`World`

The world to serialize.

### opts

[`SaveOptions`](../interfaces/SaveOptions.md) = `{}`

Optional save options (e.g., includeTime).

## Returns

[`SaveFile`](../type-aliases/SaveFile.md)

A JSON-safe save file object.

## Example

```ts
import { World } from '@pulse-ts/core';
import { installSave, saveWorld } from '@pulse-ts/save';
const world = new World();
installSave(world);
const save = saveWorld(world, { includeTime: true });
const json = JSON.stringify(save);
```
