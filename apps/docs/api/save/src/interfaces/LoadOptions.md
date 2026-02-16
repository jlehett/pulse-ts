[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / LoadOptions

# Interface: LoadOptions

Defined in: packages/save/src/public/types.ts:25

Options for loading a world.

## Example

```ts
import { loadWorld } from '@pulse-ts/save';
loadWorld(world, save, { strict: false, applyTime: true, resetPrevious: true });
```

## Properties

### applyTime?

> `optional` **applyTime**: `boolean`

Defined in: packages/save/src/public/types.ts:33

Whether to apply the saved time state.

***

### resetPrevious?

> `optional` **resetPrevious**: `boolean`

Defined in: packages/save/src/public/types.ts:31

Whether to reset the previous values of the Transform component when applying.

***

### strict?

> `optional` **strict**: `boolean`

Defined in: packages/save/src/public/types.ts:29

Whether to fail if a node is missing when loading a save file in-place.
