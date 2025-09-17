[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / NetworkInstallOptions

# Interface: NetworkInstallOptions

Defined in: [network/src/install.ts:12](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/install.ts#L12)

Options for installing @pulse-ts/network into a World.

## Properties

### autoConnect?

> `optional` **autoConnect**: `boolean`

Defined in: [network/src/install.ts:16](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/install.ts#L16)

Auto-connect the transport when provided. Default: true.

***

### codec?

> `optional` **codec**: [`Codec`](Codec.md)

Defined in: [network/src/install.ts:18](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/install.ts#L18)

Optional packet codec for TransportService.

***

### replication?

> `optional` **replication**: `object`

Defined in: [network/src/install.ts:20](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/install.ts#L20)

Replication configuration.

#### channel?

> `optional` **channel**: `string`

#### sendHz?

> `optional` **sendHz**: `number`

***

### systems?

> `optional` **systems**: `object`

Defined in: [network/src/install.ts:22](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/install.ts#L22)

Enable/disable systems. All enabled by default.

#### interpolation?

> `optional` **interpolation**: `boolean`

#### networkTick?

> `optional` **networkTick**: `boolean`

#### snapshot?

> `optional` **snapshot**: `boolean`

***

### transport?

> `optional` **transport**: [`Transport`](Transport.md) \| () => [`Transport`](Transport.md)

Defined in: [network/src/install.ts:14](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/install.ts#L14)

Optional transport instance or factory; if provided, it is set on TransportService.
