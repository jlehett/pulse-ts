[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / defineFC

# Function: defineFC()

> **defineFC**\<`P`\>(`id`, `fc`, `opts`): `FC`\<`P`\>

Defined in: [save/src/hooks/fc.ts:33](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/save/src/hooks/fc.ts#L33)

Wraps an FC so it auto-registers for rebuild and auto-attaches save metadata on mount.

- Avoids manual `registerFC(id, FC)` and `useSaveFC(id, props)` calls.
- The returned FC is what you should export and mount.
- Optionally map props before persisting to keep the save file minimal.

Usage:
  export const MyThing = defineFC('game:my-thing', (props) => { ... });

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

Optional behavior tweaks.

#### autoRegister?

`boolean`

#### mapProps?

(`p`) => `unknown`

## Returns

`FC`\<`P`\>
