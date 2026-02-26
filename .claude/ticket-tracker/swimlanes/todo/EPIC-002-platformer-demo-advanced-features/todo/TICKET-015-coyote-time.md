---
id: TICKET-015
epic: EPIC-002
title: Coyote time
status: todo
priority: medium
created: 2026-02-25
updated: 2026-02-25
---

## Description

Allow the player to jump for a brief window (100–150 ms) after walking off a ledge, matching the "feel" of classic platformers. Without coyote time, walking off a ledge immediately prevents jumping even though the player perceived themselves as still on the platform.

Implementation:
- Track a `coyoteTimer` (countdown in seconds) in the player's fixed update
- When `grounded` transitions from `true` to `false` (without a jump having fired), start the timer
- Allow a jump to fire while `coyoteTimer > 0`, even if `!grounded`
- Reset the timer to 0 when a jump fires or when the player lands

## Acceptance Criteria

- [ ] Player can jump for ~120 ms after walking off a ledge
- [ ] Coyote time does NOT apply after a jump (can't double-jump via coyote)
- [ ] Coyote time resets correctly on landing
- [ ] Feels natural — not noticeably "cheaty" at the default window

## Notes

- **2026-02-25**: Ticket created. No blockers.
