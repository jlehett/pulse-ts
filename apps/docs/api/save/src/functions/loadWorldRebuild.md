[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / loadWorldRebuild

# Function: loadWorldRebuild()

> **loadWorldRebuild**(`world`, `save`, `opts`): `void`

Defined in: [packages/save/src/world.ts:144](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/save/src/world.ts#L144)

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
