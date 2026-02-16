[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useReplication

# Function: useReplication()

> **useReplication**\<`T`\>(`key`, `opts`): `object`

Defined in: [packages/network/src/fc/hooks.ts:413](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/fc/hooks.ts#L413)

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
