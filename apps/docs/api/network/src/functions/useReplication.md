[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useReplication

# Function: useReplication()

> **useReplication**\<`T`\>(`key`, `opts`): `object`

Defined in: [network/src/fc/hooks.ts:187](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/fc/hooks.ts#L187)

Declares a replicated state slice for the current node.

- Entity identity requires a StableId; ensure `useStableId('id')` was called earlier
  in the component, or provide `opts.id` to override.
- Provide `read()` to include this state in outgoing snapshots (producer role).
- Provide `apply(patch)` to consume incoming snapshots (consumer role).
- Either or both may be provided, depending on authority model.

## Type Parameters

### T

`T` = `any`

## Parameters

### key

`string`

Replica key name under the entity (e.g., 'transform', 'state').

### opts

Replica functions and options.

#### apply?

(`patch`) => `void`

Apply a shallow patch object onto local state for this replica.

#### id?

`string`

Optional explicit entity id; if omitted, reads StableId.id.

#### read?

() => `T`

Produce a JSON-serializable state object for this replica.

## Returns

### markDirty()

> `readonly` **markDirty**: () => `void`

Forces this replica to be included in the next snapshot.

#### Returns

`void`
