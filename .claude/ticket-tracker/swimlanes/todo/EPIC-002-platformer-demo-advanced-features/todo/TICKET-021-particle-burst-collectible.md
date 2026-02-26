---
id: TICKET-021
epic: EPIC-002
title: Particle burst on collectible pickup
status: todo
priority: low
created: 2026-02-25
updated: 2026-02-25
---

## Description

When the player picks up a collectible, spawn a brief particle burst at the pickup location — a small shower of glowing points that fade out over ~0.5 s.

Implementation (demo-local, no engine package needed yet):
- Use Three.js `Points` geometry with a small set of particles (~20–30)
- Each particle gets a random velocity on spawn; update positions each frame; fade opacity over lifetime
- Self-destructs after all particles have faded
- Color should match the collectible (gold/yellow)

This ticket will inform whether a `@pulse-ts/particles` package makes sense in a future engine pass.

## Acceptance Criteria

- [ ] Burst appears at the collectible's world position on pickup
- [ ] Particles fan outward and fade over ~0.5 s
- [ ] No particles persist after the burst completes
- [ ] No noticeable frame time impact (few particles, short-lived)

## Notes

- **2026-02-25**: Ticket created. Polish pass — best done after core gameplay is stable.
