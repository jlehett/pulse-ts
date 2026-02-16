[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / deserializeServices

# Function: deserializeServices()

> **deserializeServices**(`world`, `items`): `void`

Defined in: packages/save/src/domain/registries/serviceRegistry.ts:65

Apply serialized services to an existing world.
This only applies when the target service is already provided by the world.

## Parameters

### world

`World`

The target world.

### items

`object`[]

Array of serialized service payloads.

## Returns

`void`

## Example

```ts
deserializeServices(world, [{ type: 'game:my-svc', data: { v: 1 } }]);
```
