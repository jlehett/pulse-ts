---
id: TICKET-019
epic: EPIC-002
title: Checkpoints
status: todo
priority: medium
created: 2026-02-25
updated: 2026-02-25
---

## Description

Add checkpoint objects that save the player's respawn position. When the player dies (death plane, hazard, or enemy contact), they respawn at the last activated checkpoint rather than the level spawn.

- `CheckpointNode` — a visually distinct object (e.g., a flag or glowing pillar) with a trigger collider
- On player contact, store the checkpoint's world position as the active respawn point
- Visual feedback when a checkpoint activates (e.g., color change from inactive to active)
- Player node receives the current respawn position from a shared state or event

## Acceptance Criteria

- [ ] Checkpoints are placeable via `level.ts`
- [ ] Touching a checkpoint saves it as the respawn location
- [ ] Death respawns the player at the last checkpoint (not the level spawn, if a checkpoint was reached)
- [ ] Activated checkpoints visually distinguish themselves from inactive ones
- [ ] Multiple checkpoints in sequence work correctly (only the latest counts)

## Notes

- **2026-02-25**: Ticket created. No blockers.
