[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useClockSync

# Function: useClockSync()

> **useClockSync**(`opts?`): `object`

Defined in: [packages/network/src/fc/hooks.ts:507](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/fc/hooks.ts#L507)

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
