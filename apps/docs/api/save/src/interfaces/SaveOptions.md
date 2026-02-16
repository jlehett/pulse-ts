[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / SaveOptions

# Interface: SaveOptions

Defined in: packages/save/src/public/types.ts:12

Options for saving a world.

## Example

```ts
import { saveWorld } from '@pulse-ts/save';
const save = saveWorld(world, { includeTime: true, version: 1 });
```

## Properties

### includeTime?

> `optional` **includeTime**: `boolean`

Defined in: packages/save/src/public/types.ts:16

Whether to include the time state in the save file.

***

### version?

> `optional` **version**: `number`

Defined in: packages/save/src/public/types.ts:14

The version of the save file; defaults to 1.
