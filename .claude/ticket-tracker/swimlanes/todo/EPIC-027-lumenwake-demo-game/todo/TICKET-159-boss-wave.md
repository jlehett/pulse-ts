---
id: TICKET-159
title: Boss wave
status: todo
priority: medium
created: 2026-05-16
updated: 2026-05-16
depends_on:
  - TICKET-157
labels:
  - lumenwake
  - gameplay
---

## Description

Implement the Riftmaw boss encounter as wave 9 — a multi-phase fight with distinct attack patterns and a victory sequence.

## Acceptance Criteria

- [ ] Riftmaw boss: large twisting "impossible" geometry (compound rotating polyhedra)
- [ ] Multi-phase fight:
  - Phase 1: Full form, standard attacks
  - Phase 2 (50% HP): Fractures into 3-4 smaller independent forms
  - Phase 3: Reforms with enraged attacks (faster, more damage)
- [ ] Attack patterns:
  - Void beam sweep (rotating line attack across arena)
  - Spawn minions (summons Shard enemies mid-fight)
  - Darkness nova (expanding ring of darkness, must dodge)
- [ ] Boss health bar HUD (segmented by phase)
- [ ] HP scales by player count (same formula as regular enemies)
- [ ] Victory sequence on boss defeat (explosion of light, arena re-illuminates)
- [ ] Triggers match-end flow on defeat

## Notes

- 2026-05-16: Created. Depends on TICKET-157 (wave manager triggers boss on wave 9).
