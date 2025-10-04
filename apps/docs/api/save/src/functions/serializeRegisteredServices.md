[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / serializeRegisteredServices

# Function: serializeRegisteredServices()

> **serializeRegisteredServices**(`world`): `object`[]

Defined in: packages/save/src/domain/registries/serviceRegistry.ts:46

Serialize all world services that have registered serializers.

## Parameters

### world

`World`

The source world.

## Returns

`object`[]

Array of serialized service payloads.

## Example

```ts
const items = serializeRegisteredServices(world);
```
