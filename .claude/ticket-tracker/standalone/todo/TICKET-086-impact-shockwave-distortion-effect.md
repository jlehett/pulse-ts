---
id: TICKET-086
title: Impact shockwave distortion effect
status: todo
priority: normal
labels: [effects, arena, rendering]
created: 2026-03-02
updated: 2026-03-02
---

## Description

Implement a screen-space or world-space shockwave distortion effect that plays at collision impact points. The effect should create a gravity-like ripple that visually distorts nearby space, adding satisfying visual feedback to player-vs-player impacts.

### Implementation Ideas

- **Post-processing approach**: A screen-space distortion pass (e.g., radial UV displacement using a normal/distortion map) triggered at the screen-space position of each impact
- **Shader-based**: Custom ShaderMaterial on a expanding sphere/ring mesh at the impact point, sampling and distorting the scene behind it
- **Integration**: Hook into the existing collision callback in LocalPlayerNode (where impact bursts and camera shake already fire) to trigger the shockwave at the collision midpoint

### Considerations

- Should work with the existing EffectComposer post-processing pipeline
- Performance: keep it lightweight — one or two extra draw calls per impact, not a full-screen pass every frame
- The distortion should be brief (0.2–0.4s) and subtle enough to feel polished without obscuring gameplay

## Acceptance Criteria

- [ ] Shockwave distortion effect plays at the midpoint of player collisions
- [ ] Effect expands outward and fades over ~0.3s
- [ ] Distortion is visually noticeable but not gameplay-obscuring
- [ ] Works alongside existing impact burst particles and camera shake
- [ ] Performance: no measurable frame drop on mid-range hardware
- [ ] Tests cover the shockwave trigger logic and lifecycle

## Notes

- **2026-03-02**: Created — visual polish idea for impact feedback.
