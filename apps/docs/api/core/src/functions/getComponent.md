[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / getComponent

# Function: getComponent()

> **getComponent**\<`T`\>(`owner`, `Component`): `undefined` \| `T`

Defined in: [core/src/componentRegistry.ts:16](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/componentRegistry.ts#L16)

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
