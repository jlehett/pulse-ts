[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useClockSync

# Function: useClockSync()

> **useClockSync**(`opts?`): `object`

Defined in: [network/src/fc/hooks.ts:257](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/fc/hooks.ts#L257)

Starts client clock sync and provides accessors for server time.

## Parameters

### opts?

#### burst?

`number`

#### intervalMs?

`number`

## Returns

`object`

### getOffsetMs()

> `readonly` **getOffsetMs**: () => `number`

#### Returns

`number`

### getServerNowMs()

> `readonly` **getServerNowMs**: () => `number`

#### Returns

`number`

### getStats()

> `readonly` **getStats**: () => `object`

#### Returns

`object`

##### bestRttMs

> **bestRttMs**: `number`

##### offsetMs

> **offsetMs**: `number`

##### samples

> **samples**: `number`
