---
id: TICKET-049
epic: EPIC-008
title: Particle effects
status: done
priority: low
branch: ticket-049-particle-effects
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - effects
  - particles
---

## Description

Particle effects for the arena: knockout mega-burst (80 particles, player color), impact sparks (16 particles on collision), dash trail (`useParticleEmitter`, active during dash only).

## Acceptance Criteria

- [x] Knockout mega-burst — 80 particles in player's color at death position
- [x] Impact sparks — 16 particles at collision contact point
- [x] Dash trail — `useParticleEmitter` active only during dash
- [x] Particle effects integrated into appropriate game events

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Implemented knockout mega-burst, dash trail emitter, bumped pool capacity. Tests and lint pass.
