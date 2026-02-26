---
id: TICKET-013
epic: EPIC-002
title: Hazard platforms
status: todo
priority: medium
created: 2026-02-25
updated: 2026-02-25
---

## Description

Add hazard platform variants that kill the player on contact and trigger an immediate respawn (to the last checkpoint, or spawn if no checkpoint reached).

- `HazardNode` — a visually distinct surface (e.g., red/orange spikes or lava-colored box) with a trigger collider
- On collision with the player, trigger death/respawn via the same mechanism as the death plane
- Should be distinguishable from safe platforms at a glance (color + emissive material)
- Add typed hazard definitions to `level.ts`

## Acceptance Criteria

- [ ] Hazard platforms visually stand out from regular platforms
- [ ] Player touching a hazard respawns at the last checkpoint (or spawn)
- [ ] Hazards can be placed in the level config
- [ ] All existing physics tests pass

## Notes

- **2026-02-25**: Ticket created. No blockers.
