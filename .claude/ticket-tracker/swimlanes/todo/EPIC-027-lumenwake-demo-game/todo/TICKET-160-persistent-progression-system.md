---
id: TICKET-160
title: Persistent progression system
status: todo
priority: medium
created: 2026-05-16
updated: 2026-05-16
depends_on:
  - TICKET-155
labels:
  - lumenwake
  - progression
  - ui
---

## Description

Implement the between-match progression system: lux currency, skill trees (Facets), equippable gear (Cores), and the pre-match loadout screen. All persisted via localStorage.

## Acceptance Criteria

- [ ] localStorage save/load for player profile (lux balance, unlocked nodes, equipped cores, selected class)
- [ ] Lux reward calculation: base amount + bonus per wave survived
- [ ] Skill tree ("Facets") UI:
  - 3 linear trees per class (~5 nodes each)
  - Nodes are stat/mechanic tweaks (e.g., "+15% beam width", "kills extend ability duration")
  - Unlock with lux, one-way progression
- [ ] Gear ("Cores") UI:
  - 3 slots: Offense, Defense, Utility
  - ~4 options per slot (e.g., "Flare Core +20% dmg -10% fire rate", "Prism Core: attacks pierce +1")
  - Unlock with lux, equip before match
- [ ] Loadout selection screen (pre-match): pick class + view/equip cores
- [ ] Match summary screen: show waves survived, lux earned, unlocks available
- [ ] Profile reset option (for testing/fresh start)

## Notes

- 2026-05-16: Created. Depends on TICKET-155 (needs player class system to exist). Can be built in parallel with wave/enemy work.
