---
id: TICKET-082
epic: EPIC-013
title: Instant replay system
status: todo
priority: high
created: 2026-03-02
updated: 2026-03-02
labels:
  - arena
  - effects
  - gameplay
---

## Description

After each knockout, show a slow-motion instant replay of the last few seconds before
the KO. The replay camera follows the winning player, zooms in during the hit, then
zooms back out. Slow motion gets even slower during the impact moment. Shown to both
players before proceeding with the normal next-round flow.

### Implementation approach

1. **Position recording**: Module-level ring buffer records both players' positions
   each fixed step (~60Hz). Keeps last ~2 seconds. Collision events mark the "hit" frame.

2. **New `replay` phase**: Inserted between knockout detection and `ko_flash`.
   GameManagerNode transitions to `replay` on KO (deferring score increment).

3. **ReplayNode**: Drives playback — advances through recorded frames with variable
   speed (0.4x normal, 0.15x around hit moment). Shows "REPLAY" text overlay.
   Transitions to `ko_flash` when playback completes.

4. **Player nodes**: During replay phase, read position from replay buffer instead
   of physics. Already freeze during non-playing phases.

5. **Camera**: CameraRigNode switches to follow-cam during replay — tracks the
   winning player, zooms in at hit moment, zooms back out.

## Acceptance Criteria

- [ ] Positions recorded continuously during gameplay
- [ ] Replay triggers automatically on each knockout
- [ ] Camera follows winning player during replay
- [ ] Camera zooms in during the hit moment
- [ ] Slow-motion effect with extra slowdown at impact
- [ ] "REPLAY" text visible during playback
- [ ] Normal round flow resumes after replay ends
- [ ] Works in both local and online mode
- [ ] All tests pass

## Notes

- **2026-03-02**: Ticket created.
