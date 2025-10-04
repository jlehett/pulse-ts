[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / defineQuery

# Function: defineQuery()

> **defineQuery**\<`Has`, `Not`\>(`has`, `opts?`): `object`

Defined in: [packages/core/src/domain/ecs/query/defineQuery.ts:22](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/query/defineQuery.ts#L22)

Defines a reusable typed query that matches nodes that have all components in `has`
and none of the components in `not`.

Result tuples are ordered as `[node, ...componentsInOrder]`.

## Type Parameters

### Has

`Has` *extends* readonly [`ComponentCtor`](../type-aliases/ComponentCtor.md)[]

### Not

`Not` *extends* readonly [`ComponentCtor`](../type-aliases/ComponentCtor.md)[] = \[\]

## Parameters

### has

`Has`

### opts?

#### not?

`Not`

## Returns

`object`

### count()

> **count**: (`world`) => `number`

#### Parameters

##### world

[`World`](../classes/World.md)

#### Returns

`number`

### run()

> **run**: (`world`) => `IterableIterator`\<\[[`Node`](../classes/Node.md), ...\{ \[K in string \| number \| symbol\]: InstanceType\<Has\[K\<K\>\]\> \}\[\]\]\>

#### Parameters

##### world

[`World`](../classes/World.md)

#### Returns

`IterableIterator`\<\[[`Node`](../classes/Node.md), ...\{ \[K in string \| number \| symbol\]: InstanceType\<Has\[K\<K\>\]\> \}\[\]\]\>

### some()

> **some**: (`world`) => `boolean`

#### Parameters

##### world

[`World`](../classes/World.md)

#### Returns

`boolean`

## Example

```ts
const QB = defineQuery([Transform, Bounds]);
for (const [node, t, b] of QB.run(world)) {
  // use t and b
}
```
