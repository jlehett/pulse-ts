---
id: TICKET-135
epic: EPIC-025
title: "Arena migration: input, platform, network, audio, physics"
status: in-progress
priority: medium
created: 2026-03-13
updated: 2026-03-14
labels:
  - arena
  - migration
---

## Description

Refactor the arena demo to adopt remaining engine improvements from EPIC-022 through EPIC-024:

- **Input binding shorthand**: Replace verbose `Axis2D({ x: Axis1D(...), y: Axis1D(...) })`
  in `config/bindings.ts` with `Axis2D.wasd()` and `Axis2D.arrows()`.
- **useVirtualJoystick**: Replace manual touch controls in `TouchControlsNode.ts` with
  `useVirtualJoystick` hook.
- **Platform package**: Replace `isMobileDevice.ts`, `autoFullscreen.ts`, `landscapeEnforcer.ts`,
  `installPrompt.ts` with `@pulse-ts/platform` utilities.
- **useRemoteEntity / useLocalEntity**: Replace manual network entity setup in
  `LocalPlayerNode.ts` and `RemotePlayerNode.ts` with one-liner hooks.
- **Network flush**: Verify auto-flush on world destroy works (no demo changes needed).
- **Audio mixing groups**: Add `useSoundGroup` for SFX/music categorization and route
  existing `useSound` calls through appropriate groups.
- **Collision filter**: Add `filter` option to collision callbacks in `LocalPlayerNode.ts`
  to replace manual `getComponent(other, PlayerTag)` guards.

## Affected Files

- `config/bindings.ts` — Axis2D shorthands
- `TouchControlsNode.ts` — useVirtualJoystick
- `isMobileDevice.ts`, `autoFullscreen.ts`, `landscapeEnforcer.ts`, `installPrompt.ts` — platform package
- `LocalPlayerNode.ts` — useLocalEntity, collision filter, audio groups
- `RemotePlayerNode.ts` — useRemoteEntity
- `GameManagerNode.ts` — audio groups for sound effects

## Acceptance Criteria

- [ ] Axis2D bindings use shorthand methods
- [ ] TouchControlsNode uses useVirtualJoystick
- [ ] Mobile utilities replaced with @pulse-ts/platform
- [ ] Network entity setup uses useRemoteEntity/useLocalEntity
- [ ] Sound effects routed through mixing groups
- [ ] Collision callbacks use filter option
- [ ] All tests pass
- [ ] Lint clean

## Notes

- **2026-03-13**: Ticket created. Depends on EPIC-022, EPIC-023, EPIC-024 completion.
