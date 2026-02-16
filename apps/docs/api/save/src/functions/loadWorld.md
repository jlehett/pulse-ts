[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / loadWorld

# Function: loadWorld()

> **loadWorld**(`world`, `save`, `opts`): `void`

Defined in: packages/save/src/public/world.ts:33

Loads a save object into an existing world in-place.
Matches nodes by StableId when present, else by numeric id.

## Parameters

### world

`World`

The target world to mutate.

### save

[`SaveFile`](../type-aliases/SaveFile.md)

The save file previously produced by [saveWorld](saveWorld.md).

### opts

[`LoadOptions`](../interfaces/LoadOptions.md) = `{}`

Load options (strict, resetPrevious, applyTime).

## Returns

`void`

## Example

```ts
import { loadWorld } from '@pulse-ts/save';
// ... obtain `save` via saveWorld or from storage
loadWorld(world, save, { applyTime: true, resetPrevious: true });
```
