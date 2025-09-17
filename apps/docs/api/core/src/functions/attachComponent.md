[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / attachComponent

# Function: attachComponent()

> **attachComponent**\<`O`, `T`\>(`owner`, `Component`): `T`

Defined in: [core/src/componentRegistry.ts:46](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/componentRegistry.ts#L46)

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
