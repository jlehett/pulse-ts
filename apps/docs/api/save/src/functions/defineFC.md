[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / defineFC

# Function: defineFC()

> **defineFC**\<`P`\>(`id`, `fc`, `opts`): `FC`\<`P`\>

Defined in: packages/save/src/public/fc.ts:42

Wraps an FC so it auto-registers for rebuild and auto-attaches save metadata on mount.

- Avoids manual `registerFC(id, FC)` and `useSaveFC(id, props)` calls.
- The returned FC is what you should export and mount.
- Optionally map props before persisting to keep the save file minimal.

## Type Parameters

### P

`P`

## Parameters

### id

`string`

Stable id for save files.

### fc

`FC`\<`P`\>

The function component to wrap.

### opts

Optional config (autoRegister, mapProps).

#### autoRegister?

`boolean`

#### mapProps?

(`p`) => `unknown`

## Returns

`FC`\<`P`\>

## Examples

```ts
import { defineFC } from '@pulse-ts/save';
export const MyThing = defineFC('game:my-thing', (props) => { void props; });
```

```ts
// Persist only specific props to keep save files lean
const Player = defineFC('game:player', (p: { x: number; y: number; z: number }) => void p, {
  mapProps: ({ x, z }) => ({ x, z }),
});
```
