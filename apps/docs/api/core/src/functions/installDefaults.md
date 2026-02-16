[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / installDefaults

# Function: installDefaults()

> **installDefaults**(`world`): `void`

Defined in: [packages/core/src/public/bootstrap.ts:21](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/public/bootstrap.ts#L21)

Installs the default services and systems onto a world.

- Adds `StatsService` for performance snapshots.
- Adds `CullingSystem` for view-frustum visibility updates.

Defaults are opt-in to keep `World` minimal. Call this during setup
in apps that expect these features.

## Parameters

### world

[`World`](../classes/World.md)

The world to install defaults into.

## Returns

`void`

## Example

```ts
import { World, installDefaults } from '@pulse-ts/core';
const world = new World();
installDefaults(world);
```
