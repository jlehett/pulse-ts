[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / SaveFile

# Type Alias: SaveFile

> **SaveFile** = `object`

Defined in: [packages/save/src/types.ts:70](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L70)

A save file.

## Properties

### nodes

> **nodes**: [`SaveNodeRecord`](SaveNodeRecord.md)[]

Defined in: [packages/save/src/types.ts:78](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L78)

The nodes of the world.

***

### services

> **services**: `object`[]

Defined in: [packages/save/src/types.ts:76](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L76)

Serialized services.

#### data

> **data**: `unknown`

#### type

> **type**: `string`

***

### time?

> `optional` **time**: `object`

Defined in: [packages/save/src/types.ts:74](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L74)

The time state of the world.

#### paused

> **paused**: `boolean`

#### timeScale

> **timeScale**: `number`

***

### version

> **version**: `number`

Defined in: [packages/save/src/types.ts:72](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/types.ts#L72)

The version of the save file.
