---
id: TICKET-017
epic: EPIC-002
title: Dash ability
status: in-progress
branch: ticket-017-dash-ability
priority: medium
created: 2026-02-25
updated: 2026-02-26
---

## Description

Add a horizontal dash ability (e.g., bound to Shift) that launches the player in their current movement direction with a brief burst of speed, followed by a cooldown.

- Bind to a new `dash` action in `config/bindings.ts`
- On activation: set a large horizontal velocity in the current facing direction for a short duration (~0.15 s)
- After dash: apply a cooldown (~1 s) during which the action is ignored
- Dash should work in the air and on the ground
- Visual cue: brief camera FOV pulse or screen-space effect (optional, can be added in TICKET-022 polish pass)

## Acceptance Criteria

- [ ] Dash fires in the player's current movement direction on key press
- [ ] Dash has a noticeable speed burst and short duration
- [ ] Cooldown prevents rapid re-dashing
- [ ] Dash key binding is defined in `bindings.ts`
- [ ] Works both grounded and airborne

## Notes

- **2026-02-25**: Ticket created. No blockers.
- **2026-02-26**: Starting implementation. Added dash binding (ShiftLeft) and full dash logic in PlayerNode — activation, velocity override, cooldown, and respawn reset.
