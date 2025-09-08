[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / LoadOptions

# Interface: LoadOptions

Defined in: [save/src/types.ts:19](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/types.ts#L19)

Options for loading a world.

## Properties

### applyTime?

> `optional` **applyTime**: `boolean`

Defined in: [save/src/types.ts:27](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/types.ts#L27)

Whether to apply the saved time state.

***

### resetPrevious?

> `optional` **resetPrevious**: `boolean`

Defined in: [save/src/types.ts:25](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/types.ts#L25)

Whether to reset the previous values of the Transform component when applying.

***

### strict?

> `optional` **strict**: `boolean`

Defined in: [save/src/types.ts:23](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/types.ts#L23)

Whether to fail if a node is missing when loading a save file in-place.
