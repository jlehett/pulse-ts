[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / loadWorldRebuild

# Function: loadWorldRebuild()

> **loadWorldRebuild**(`world`, `save`, `opts`): `void`

Defined in: [packages/save/src/world.ts:144](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/save/src/world.ts#L144)

Rebuilds the world from a save file:
- Clears the current scene (preserving internal system node)
- Recreates nodes and hierarchy
- Applies components via registered serializers
- Optionally applies time state

## Parameters

### world

`World`

The world to load the save file into.

### save

[`SaveFile`](../type-aliases/SaveFile.md)

The save file to load.

### opts

[`LoadOptions`](../interfaces/LoadOptions.md) = `{}`

The options for loading the world.

## Returns

`void`
