[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useReplicateTransform

# Function: useReplicateTransform()

> **useReplicateTransform**(`opts`): `void`

Defined in: [network/src/fc/transform.ts:22](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/fc/transform.ts#L22)

Replicates the local Transform of this node under replica key 'transform'.

- Producer: sends { p:{x,y,z}, r:{x,y,z,w}, s:{x,y,z} } at snapshot rate.
- Consumer: applies incoming patches as smoothing targets via InterpolationService.

Usage:
- On both sides, ensure `useStableId('entity-id')` or pass `opts.id`.
- Call `useReplicateTransform({ role: 'producer'|'consumer'|'both' })`.

## Parameters

### opts

#### id?

`string`

#### lambda?

`number`

Smoothing rate constant (per second). Higher is snappier. Default 12.

#### role?

`"producer"` \| `"consumer"` \| `"both"`

#### snapDist?

`number`

Snap immediately if further than this distance. Default 5 units.

## Returns

`void`
