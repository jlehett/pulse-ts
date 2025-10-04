[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerFC

# Function: registerFC()

> **registerFC**\<`P`\>(`id`, `fc`): `void`

Defined in: [packages/save/src/registries/fcRegistry.ts:13](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/registries/fcRegistry.ts#L13)

Register a function component for save/load.

## Type Parameters

### P

`P` = `any`

## Parameters

### id

`string`

Stable id used in save files (e.g., 'game:rts-camera')

### fc

`FC`\<`P`\>

The function component constructor

## Returns

`void`
