[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / installSave

# Function: installSave()

> **installSave**(`_world?`, `opts?`): `void`

Defined in: packages/save/src/public/install.ts:21

Convenience installer for @pulse-ts/save.
Registers core serializers and optional plugin serializers.

## Parameters

### \_world?

`World`

Reserved for future world-specific setup.

### opts?

[`InstallSaveOptions`](../interfaces/InstallSaveOptions.md) = `{}`

Optional plugin list (e.g., ['@pulse-ts/three']).

## Returns

`void`

## Example

```ts
import { World } from '@pulse-ts/core';
import { installSave } from '@pulse-ts/save';
const world = new World();
installSave(world, { plugins: ['@pulse-ts/three'] });
```
