[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useNetworkStatus

# Function: useNetworkStatus()

> **useNetworkStatus**(): `object`

Defined in: [packages/network/src/fc/hooks.ts:229](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/fc/hooks.ts#L229)

Subscribe to transport status changes and access the latest value.

## Returns

### get()

> `readonly` **get**: () => [`TransportStatus`](../type-aliases/TransportStatus.md)

Latest known status (fallbacks to current service if available).

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)
