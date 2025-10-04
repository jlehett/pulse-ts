[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / loadWorldRebuild

# Function: loadWorldRebuild()

> **loadWorldRebuild**(`world`, `save`, `opts`): `void`

Defined in: [packages/save/src/world.ts:144](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/save/src/world.ts#L144)

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
