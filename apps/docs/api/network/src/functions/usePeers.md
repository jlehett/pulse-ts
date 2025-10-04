[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / usePeers

# Function: usePeers()

> **usePeers**(): `object`

Defined in: [packages/network/src/fc/hooks.ts:288](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/fc/hooks.ts#L288)

Track known peer ids observed via incoming packet metadata.

- Uses `TransportService.onPacketIn` and collects `pkt.from` values.
- Resets the peer list when the transport status goes to 'closed'.
- Best-effort: requires transports to supply `from` (e.g., WebRTC mesh, memory hub).

## Returns

`object`

### has()

> `readonly` **has**: (`id`) => `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

### list()

> `readonly` **list**: () => `string`[]

#### Returns

`string`[]

### size()

> `readonly` **size**: () => `number`

#### Returns

`number`
