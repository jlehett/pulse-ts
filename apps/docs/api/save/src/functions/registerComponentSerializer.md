[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerComponentSerializer

# Function: registerComponentSerializer()

> **registerComponentSerializer**\<`T`\>(`ctor`, `serializer`): `void`

Defined in: packages/save/src/domain/registries/componentRegistry.ts:21

Register a component serializer.

## Type Parameters

### T

`T` *extends* `Component`

## Parameters

### ctor

`Ctor`\<`T`\>

The component constructor to associate with the serializer.

### serializer

[`ComponentSerializer`](../type-aliases/ComponentSerializer.md)\<`T`\>

The serializer implementation.

## Returns

`void`

## Example

```ts
import { registerComponentSerializer } from '@pulse-ts/save';
// see ComponentSerializer example in public/types
```
