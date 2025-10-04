[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / query

# Function: query()

> **query**\<`Has`\>(`world`, `has`, `opts?`): `IterableIterator`\<\[[`Node`](../classes/Node.md), ...\{ \[K in string \| number \| symbol\]: InstanceType\<Has\[K\<K\>\]\> \}\[\]\]\>

Defined in: [packages/core/src/domain/ecs/query/defineQuery.ts:122](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/domain/ecs/query/defineQuery.ts#L122)

Convenience one-off query helper. See `defineQuery` for behavior.

## Type Parameters

### Has

`Has` *extends* readonly [`ComponentCtor`](../type-aliases/ComponentCtor.md)[]

## Parameters

### world

[`World`](../classes/World.md)

### has

`Has`

### opts?

#### not?

readonly [`ComponentCtor`](../type-aliases/ComponentCtor.md)[]

## Returns

`IterableIterator`\<\[[`Node`](../classes/Node.md), ...\{ \[K in string \| number \| symbol\]: InstanceType\<Has\[K\<K\>\]\> \}\[\]\]\>

## Example

```ts
for (const [node, t] of query(world, [Transform])) {
  // ...
}
```
