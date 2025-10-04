[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / attachComponent

# Function: attachComponent()

> **attachComponent**\<`O`, `T`\>(`owner`, `Component`): `T`

Defined in: [packages/core/src/domain/ecs/registry/componentRegistry.ts:49](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/registry/componentRegistry.ts#L49)

Attaches a component to the owner.

## Type Parameters

### O

`O` *extends* [`Node`](../classes/Node.md)

### T

`T` *extends* [`Component`](../classes/Component.md)

## Parameters

### owner

`O`

The owner of the component.

### Component

[`Ctor`](../type-aliases/Ctor.md)\<`T`\>

The component constructor.

## Returns

`T`

The component.
