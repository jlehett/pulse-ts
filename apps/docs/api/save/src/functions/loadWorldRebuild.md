[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / loadWorldRebuild

# Function: loadWorldRebuild()

> **loadWorldRebuild**(`world`, `save`, `opts`): `void`

Defined in: packages/save/src/public/world.ts:51

Rebuilds the world from a save object by remounting saved Functional Nodes
and reapplying serialized components.

## Parameters

### world

`World`

The world to clear and rebuild.

### save

[`SaveFile`](../type-aliases/SaveFile.md)

The save file to rebuild from.

### opts

[`LoadOptions`](../interfaces/LoadOptions.md) = `{}`

Load options (resetPrevious, applyTime).

## Returns

`void`

## Example

```ts
import { loadWorldRebuild } from '@pulse-ts/save';
loadWorldRebuild(world, save, { applyTime: true });
```
