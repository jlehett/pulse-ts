[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / getComponent

# Function: getComponent()

> **getComponent**\<`T`\>(`owner`, `Component`): `undefined` \| `T`

Defined in: [packages/core/src/domain/ecs/registry/componentRegistry.ts:17](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/ecs/registry/componentRegistry.ts#L17)

Gets a component.

## Type Parameters

### T

`T` *extends* [`Component`](../classes/Component.md)

## Parameters

### owner

[`Node`](../classes/Node.md)

The owner of the component.

### Component

[`Ctor`](../type-aliases/Ctor.md)\<`T`\>

The component constructor.

## Returns

`undefined` \| `T`

The component.
