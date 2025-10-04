[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerServiceSerializer

# Function: registerServiceSerializer()

> **registerServiceSerializer**\<`T`\>(`ctor`, `serializer`): `void`

Defined in: packages/save/src/domain/registries/serviceRegistry.ts:15

Register a service serializer.

## Type Parameters

### T

`T` *extends* `Service`

## Parameters

### ctor

`Ctor`\<`T`\>

The service constructor to associate with the serializer.

### serializer

`ServiceSerializer`\<`T`\>

The serializer implementation.

## Returns

`void`

## Example

```ts
import { registerServiceSerializer } from '@pulse-ts/save';
// see ServiceSerializer example in public/types
```
