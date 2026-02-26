---
id: TICKET-015
epic: EPIC-002
title: Coyote time
status: done
priority: medium
created: 2026-02-25
updated: 2026-02-26
branch: ticket-015-coyote-time
---

## Description

Allow the player to jump for a brief window (100–150 ms) after walking off a ledge, matching the "feel" of classic platformers. Without coyote time, walking off a ledge immediately prevents jumping even though the player perceived themselves as still on the platform.

Implementation:
- Track a `coyoteTimer` (countdown in seconds) in the player's fixed update
- When `grounded` transitions from `true` to `false` (without a jump having fired), start the timer
- Allow a jump to fire while `coyoteTimer > 0`, even if `!grounded`
- Reset the timer to 0 when a jump fires or when the player lands

## Acceptance Criteria

- [x] Player can jump for ~120 ms after walking off a ledge
- [x] Coyote time does NOT apply after a jump (can't double-jump via coyote)
- [x] Coyote time resets correctly on landing
- [x] Feels natural — not noticeably "cheaty" at the default window

## Notes

- **2026-02-25**: Ticket created. No blockers.
- **2026-02-26**: Implemented in `demos/platformer/src/nodes/PlayerNode.ts`. Added `COYOTE_TIME` constant (120ms), `coyoteTimer` variable, timer management in fixed update, and updated jump guard to use coyote timer. All tests pass.
