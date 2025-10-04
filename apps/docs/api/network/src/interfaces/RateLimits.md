[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / RateLimits

# Interface: RateLimits

Defined in: [packages/network/src/server/rateLimit.ts:3](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/rateLimit.ts#L3)

## Properties

### burstMultiplier?

> `optional` **burstMultiplier**: `number`

Defined in: [packages/network/src/server/rateLimit.ts:9](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/rateLimit.ts#L9)

Multiplier for burst capacity (default 2).

***

### bytesPerSecond?

> `optional` **bytesPerSecond**: `number`

Defined in: [packages/network/src/server/rateLimit.ts:7](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/rateLimit.ts#L7)

Bytes per second allowed per peer (default unlimited).

***

### disconnectOnAbuse?

> `optional` **disconnectOnAbuse**: `boolean`

Defined in: [packages/network/src/server/rateLimit.ts:16](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/rateLimit.ts#L16)

When a peer exceeds limits: drop (default) or disconnect (handled by caller).

***

### messagesPerSecond?

> `optional` **messagesPerSecond**: `number`

Defined in: [packages/network/src/server/rateLimit.ts:5](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/rateLimit.ts#L5)

Messages per second allowed per peer (default unlimited).

***

### onLimitExceeded()?

> `optional` **onLimitExceeded**: (`peerId`, `info`) => `void`

Defined in: [packages/network/src/server/rateLimit.ts:18](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/rateLimit.ts#L18)

Callback when a peer is rate limited.

#### Parameters

##### peerId

`string`

##### info

###### channel

`string`

###### kind

`RateLimitKind`

#### Returns

`void`

***

### perChannel?

> `optional` **perChannel**: `Record`\<`string`, \{ `bytesPerSecond?`: `number`; `messagesPerSecond?`: `number`; \}\>

Defined in: [packages/network/src/server/rateLimit.ts:11](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/rateLimit.ts#L11)

Per-channel overrides.
