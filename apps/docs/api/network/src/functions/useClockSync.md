[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useClockSync

# Function: useClockSync()

> **useClockSync**(`opts?`): `object`

Defined in: [packages/network/src/fc/hooks.ts:507](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/fc/hooks.ts#L507)

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
