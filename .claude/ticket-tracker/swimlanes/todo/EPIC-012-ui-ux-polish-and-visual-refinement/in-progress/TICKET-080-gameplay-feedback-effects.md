---
id: TICKET-080
epic: EPIC-012
title: Gameplay feedback effects (camera shake, colored KO flash, victory confetti)
status: in-progress
branch: ticket-080-gameplay-feedback-effects
priority: medium
created: 2026-03-02
updated: 2026-03-02
labels:
  - effects
  - arena
---

## Description

Add screen-space feedback that makes gameplay feel impactful. Builds on bloom
post-processing from TICKET-077 for best visual results.

### Camera shake (`CameraRigNode.ts`)
- Add `triggerCameraShake(intensity, duration)` exported function
- Per-frame: decay intensity, apply random XZ offset to camera position
- Auto-trigger big shake (0.8, 0.5s) on `ko_flash` phase transition
- Small shake (0.3, 0.2s) triggered from collision callback in LocalPlayerNode

### Colored KO flash (`KnockoutOverlayNode.ts`)
- Flash color changes to scoring player's color (teal/coral) instead of white
- Add gentle dark fade during `resetting` phase for smoother round transition

### Victory confetti (`VictoryEffectNode.ts`)
- New node: watches gameState.phase, triggers on `match_over`
- 5 colors × 40 particles from arena center — additive blending, gravity, shrink
- Added as child of ArenaNode

## Acceptance Criteria

- [ ] Camera shakes visibly on collision (small) and knockout (big)
- [ ] KO flash is tinted in the scoring player's color
- [ ] Brief dark fade during resetting phase smooths round transition
- [ ] Confetti particle burst plays on match victory
- [ ] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Starting implementation.
