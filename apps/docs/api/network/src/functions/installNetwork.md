[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / installNetwork

# Function: installNetwork()

> **installNetwork**(`world`, `opts`): `Promise`\<[`InstalledNetwork`](../interfaces/InstalledNetwork.md)\>

Defined in: [network/src/install.ts:43](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/install.ts#L43)

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
