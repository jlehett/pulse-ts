[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / SaveNodeRecord

# Type Alias: SaveNodeRecord

> **SaveNodeRecord** = `object`

Defined in: [packages/save/src/types.ts:56](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L56)

A record of a node in the save file.

## Properties

### components

> **components**: `object`[]

Defined in: [packages/save/src/types.ts:62](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L62)

The components of the node.

#### data

> **data**: `unknown`

#### type

> **type**: `string`

***

### fc?

> `optional` **fc**: `object`

Defined in: [packages/save/src/types.ts:64](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L64)

Optional function-component descriptor for re-mounting in rebuild mode.

#### props?

> `optional` **props**: `unknown`

#### type

> **type**: `string`

***

### id

> **id**: `number`

Defined in: [packages/save/src/types.ts:58](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L58)

The unique ID of the node.

***

### parent

> **parent**: `number` \| `null`

Defined in: [packages/save/src/types.ts:60](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L60)

The parent ID of the node.
