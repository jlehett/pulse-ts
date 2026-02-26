---
id: TICKET-022
epic: EPIC-002
title: Screen shake on hard landing
status: in-progress
priority: low
branch: ticket-022-screen-shake-on-hard-landing
created: 2026-02-25
updated: 2026-02-26
---

## Description

Apply a brief camera shake when the player lands after a significant fall. Shake intensity should scale with the vertical velocity at impact.

Implementation:
- Track the player's downward velocity in the frame before landing
- On landing (grounded transitions false → true), if `|vy| > threshold` (e.g., 6 m/s), trigger a shake
- Shake: add a decaying random offset to the camera's position each frame for ~0.3 s
- Shake magnitude scales linearly with impact velocity above the threshold

Also consider: brief FOV kick on dash (from TICKET-017) — can be added here as a small addition.

## Acceptance Criteria

- [ ] Small falls produce no shake; large falls produce a visible, brief shake
- [ ] Shake decays smoothly (not a sudden stop)
- [ ] Shake does not interfere with normal camera follow behaviour
- [ ] (Optional) Dash triggers a subtle FOV pulse

## Notes

- **2026-02-25**: Ticket created. Polish pass.
- **2026-02-26**: Starting implementation. Branch: `ticket-022-screen-shake-on-hard-landing`.
