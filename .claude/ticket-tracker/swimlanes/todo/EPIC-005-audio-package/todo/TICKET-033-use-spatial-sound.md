---
id: TICKET-033
epic: EPIC-005
title: useSpatialSound for 3D positional audio
status: todo
priority: low
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add `useSpatialSound()` to `@pulse-ts/audio` for 3D positional audio using Web Audio's PannerNode. Sounds attenuate with distance from the listener (camera).

Stretch goal — not needed for the platformer demo but completes the audio package for 3D games.

API:
```ts
const engineSfx = useSpatialSound('tone', {
    wave: 'sawtooth',
    frequency: 120,
    loop: true,
    gain: 0.3,
    rolloff: 'inverse',
    maxDistance: 50,
});
```

## Acceptance Criteria

- [ ] `useSpatialSound(type, options)` creates a spatialized sound source
- [ ] Integrates with Three.js camera position for listener
- [ ] Configurable rolloff model and max distance
- [ ] Supports looping sounds
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests

## Notes

- **2026-02-26**: Ticket created. Stretch goal for the audio package.
