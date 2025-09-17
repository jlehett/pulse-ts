[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / loadWorld

# Function: loadWorld()

> **loadWorld**(`world`, `save`, `opts`): `void`

Defined in: [save/src/world.ts:95](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/world.ts#L95)

Loads the world from a save file in-place.
- Updates the world's nodes and hierarchy
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
