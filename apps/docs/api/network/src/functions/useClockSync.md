[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useClockSync

# Function: useClockSync()

> **useClockSync**(`opts?`): `object`

Defined in: [packages/network/src/fc/hooks.ts:507](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/fc/hooks.ts#L507)

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
