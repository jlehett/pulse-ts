[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / registerCoreSerializers

# Function: registerCoreSerializers()

> **registerCoreSerializers**(): `void`

Defined in: packages/save/src/infra/serializers/core.ts:16

Register all of the @pulse-ts/core components/services with the save system.

## Returns

`void`

## Example

```ts
import { installSave } from '@pulse-ts/save';
installSave(world); // calls registerCoreSerializers() under the hood
```
