[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / getComponent

# Function: getComponent()

> **getComponent**\<`T`\>(`owner`, `Component`): `undefined` \| `T`

Defined in: [packages/core/src/domain/ecs/registry/componentRegistry.ts:17](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/ecs/registry/componentRegistry.ts#L17)

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
