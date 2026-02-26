---
id: TICKET-016
epic: EPIC-002
title: Variable jump height (hold space for higher jump)
status: done
priority: medium
created: 2026-02-25
updated: 2026-02-26
branch: ticket-016-variable-jump-height
---

## Description

Apply additional upward force while the jump button is held, up to a maximum hold duration. This gives the player analog control over jump height — a quick tap for a small hop, a held press for maximum height.

Implementation:
- Track a `jumpHoldTimer` after a jump fires
- Each fixed step that the jump button is still held and `jumpHoldTimer < MAX_HOLD_TIME` (e.g., 0.2 s), apply a small additional upward force
- Stop applying force once the button is released or the hold time expires
- The base impulse (JUMP_IMPULSE) should be reduced slightly so the minimum jump is a short hop and the maximum held jump equals roughly the old height

## Acceptance Criteria

- [x] Quick tap produces a noticeably shorter jump than a held press
- [x] Maximum height (full hold) feels satisfying and clears the tallest platform gap
- [x] Holding jump in the air (after the hold window expires) does not continue to apply force
- [x] Works correctly alongside coyote time (TICKET-015)

## Notes

- **2026-02-25**: Ticket created. No blockers.
- **2026-02-26**: Implementation complete. Reduced JUMP_IMPULSE from 8 to 5.5, added JUMP_HOLD_FORCE (38) and JUMP_HOLD_MAX (0.18s). Added jumpHoldTimer that starts on jump fire and applies sustained upward force while held. Timer resets on death-plane respawn. All tests pass.
