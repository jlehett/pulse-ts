---
id: TICKET-013
epic: EPIC-002
title: Hazard platforms
status: done
priority: medium
created: 2026-02-25
updated: 2026-02-26
---

## Description

Add hazard platform variants that kill the player on contact and trigger an immediate respawn (to the last checkpoint, or spawn if no checkpoint reached).

- `HazardNode` — a visually distinct surface (e.g., red/orange spikes or lava-colored box) with a trigger collider
- On collision with the player, trigger death/respawn via the same mechanism as the death plane
- Should be distinguishable from safe platforms at a glance (color + emissive material)
- Add typed hazard definitions to `level.ts`

## Acceptance Criteria

- [x] Hazard platforms visually stand out from regular platforms
- [x] Player touching a hazard respawns at the last checkpoint (or spawn)
- [x] Hazards can be placed in the level config
- [x] All existing physics tests pass

## Notes

- **2026-02-25**: Ticket created. No blockers.
- **2026-02-26**: Implemented together with TICKET-019 (Checkpoints). Created `HazardNode` with pulsing red/orange emissive box, trigger collider, and player respawn on contact via shared `RespawnState`. Added `HazardDef` interface and level data to `level.ts`. Two hazards placed in the level. All 18 tests pass.
