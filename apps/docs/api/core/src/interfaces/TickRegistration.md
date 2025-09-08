[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / TickRegistration

# Interface: TickRegistration

Defined in: [core/src/types.ts:27](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L27)

A tick registration.

## Properties

### active

> **active**: `boolean`

Defined in: [core/src/types.ts:33](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L33)

***

### fn

> **fn**: [`TickFn`](../type-aliases/TickFn.md)

Defined in: [core/src/types.ts:32](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L32)

***

### kind

> **kind**: [`UpdateKind`](../type-aliases/UpdateKind.md)

Defined in: [core/src/types.ts:29](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L29)

***

### next

> **next**: `null` \| `TickRegistration`

Defined in: [core/src/types.ts:37](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L37)

***

### node

> **node**: [`Node`](../classes/Node.md)

Defined in: [core/src/types.ts:28](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L28)

***

### order

> **order**: `number`

Defined in: [core/src/types.ts:31](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L31)

***

### phase

> **phase**: [`UpdatePhase`](../type-aliases/UpdatePhase.md)

Defined in: [core/src/types.ts:30](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L30)

***

### prev

> **prev**: `null` \| `TickRegistration`

Defined in: [core/src/types.ts:36](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L36)

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [core/src/types.ts:38](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/types.ts#L38)

#### Returns

`void`
