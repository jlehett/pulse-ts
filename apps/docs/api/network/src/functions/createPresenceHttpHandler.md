[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / createPresenceHttpHandler

# Function: createPresenceHttpHandler()

> **createPresenceHttpHandler**(`server`, `opts`): (`req`, `res`) => `void`

Defined in: [network/src/server/presence.ts:21](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/presence.ts#L21)

Creates a minimal Node-style HTTP handler exposing presence endpoints.

Endpoints (relative to basePath):
- GET /presence/rooms           -> { rooms: [{ name, count }] }
- GET /presence/rooms/:room     -> { room, peers: string[] }
- GET /presence/peers           -> { peers: [{ id, rooms }] }
- GET /presence/peers/:id       -> { id, rooms } | 404
- GET /presence/stats           -> { peers, rooms }

## Parameters

### server

[`NetworkServer`](../classes/NetworkServer.md)

### opts

[`PresenceHttpOptions`](../interfaces/PresenceHttpOptions.md) = `{}`

## Returns

> (`req`, `res`): `void`

### Parameters

#### req

`any`

#### res

`any`

### Returns

`void`
