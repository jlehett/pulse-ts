[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / installNetwork

# Function: installNetwork()

> **installNetwork**(`world`, `opts`): `Promise`\<[`InstalledNetwork`](../interfaces/InstalledNetwork.md)\>

Defined in: [packages/network/src/install.ts:43](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/install.ts#L43)

Installs @pulse-ts/network services and systems into a World.

- Idempotent: re-uses existing services/systems if present.
- Optionally sets a transport (and connects) and configures replication.

## Parameters

### world

`World`

### opts

[`NetworkInstallOptions`](../interfaces/NetworkInstallOptions.md) = `{}`

## Returns

`Promise`\<[`InstalledNetwork`](../interfaces/InstalledNetwork.md)\>
