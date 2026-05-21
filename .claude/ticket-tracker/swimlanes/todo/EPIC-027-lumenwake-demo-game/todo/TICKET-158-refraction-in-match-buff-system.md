---
id: TICKET-158
title: Refraction (in-match buff) system
status: todo
priority: medium
created: 2026-05-16
updated: 2026-05-20
branch: ticket-158-refraction-in-match-buff-system
depends_on:
  - TICKET-157
labels:
  - lumenwake
  - gameplay
  - progression
---

## Description

Implement the roguelite-style in-match buff system where players choose 1 of 3 random "Refractions" between waves, with stacking/tiering mechanics.

## Acceptance Criteria

- [ ] Pool of ~15 refractions defined in config, each with 3 tiers of increasing power
- [ ] Between-wave pick UI: display 3 random options from pool, player picks 1
- [ ] Buff application system: modifies player stats/behavior when picked
- [ ] Stacking: picking the same refraction again upgrades it (tier 1→2→3)
- [ ] Initial refractions implemented:
  - Chain Light (attacks bounce to nearby enemies)
  - Afterglow (kills leave damaging light pool)
  - Overcharge (ability cooldowns reduced)
  - Radiant Armor (damage reduction in light zones)
  - Searing Beam (primary attack damage +%)
  - Photon Shield (chance to block damage)
  - Lux Magnet (increased lux pickup radius)
  - Prismatic Burst (AoE on ability use)
  - Swift Light (movement speed +%)
  - Resonance (nearby ally attacks amplified)
  - Void Resistance (reduced darkness damage)
  - Convergent Focus (damage increases while stationary)
  - Refracted Healing (heal on kill)
  - Cascade (chance for abilities to reset cooldown)
  - Luminous Overload (periodic damage nova)
- [ ] HUD indicator showing active refractions and their tiers

## Notes

- 2026-05-16: Created. Depends on TICKET-157 (wave manager provides the between-wave timing).
