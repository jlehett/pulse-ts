[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / SaveNodeRecord

# Type Alias: SaveNodeRecord

> **SaveNodeRecord** = `object`

Defined in: packages/save/src/public/types.ts:71

A record of a node in the save file.

## Properties

### components

> **components**: `object`[]

Defined in: packages/save/src/public/types.ts:77

The components of the node.

#### data

> **data**: `unknown`

#### type

> **type**: `string`

***

### fc?

> `optional` **fc**: `object`

Defined in: packages/save/src/public/types.ts:79

Optional function-component descriptor for re-mounting in rebuild mode.

#### props?

> `optional` **props**: `unknown`

#### type

> **type**: `string`

***

### id

> **id**: `number`

Defined in: packages/save/src/public/types.ts:73

The unique ID of the node.

***

### parent

> **parent**: `number` \| `null`

Defined in: packages/save/src/public/types.ts:75

The parent ID of the node.
