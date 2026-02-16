[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / SaveFile

# Type Alias: SaveFile

> **SaveFile** = `object`

Defined in: packages/save/src/public/types.ts:89

A save file.

## Example

```ts
import { saveWorld } from '@pulse-ts/save';
const save = saveWorld(world);
localStorage.setItem('save', JSON.stringify(save));
```

## Properties

### nodes

> **nodes**: [`SaveNodeRecord`](SaveNodeRecord.md)[]

Defined in: packages/save/src/public/types.ts:97

The nodes of the world.

***

### services

> **services**: `object`[]

Defined in: packages/save/src/public/types.ts:95

Serialized services.

#### data

> **data**: `unknown`

#### type

> **type**: `string`

***

### time?

> `optional` **time**: `object`

Defined in: packages/save/src/public/types.ts:93

The time state of the world.

#### paused

> **paused**: `boolean`

#### timeScale

> **timeScale**: `number`

***

### version

> **version**: `number`

Defined in: packages/save/src/public/types.ts:91

The version of the save file.
