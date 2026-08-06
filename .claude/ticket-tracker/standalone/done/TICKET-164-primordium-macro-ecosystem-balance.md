---
id: TICKET-164
title: Primordium macro-ecosystem balance pass
status: done
priority: high
created: 2026-08-06
updated: 2026-08-06
branch: ticket-164-primordium-macro-ecosystem-balance
labels:
  - primordium
  - balance
  - simulation
---

## Description

Matches devolve into every faction blanketing its starting quadrant with a
uniform lattice of tiny organisms — it reads as a bacterial mat, not a macro
ecosystem. Rebalance so populations are smaller, individuals are larger and
longer-lived, the light field stays visibly patchy rather than grazed bare,
and factions actually leave their home quadrant and meet.

## Acceptance Criteria

- [x] Diagnose the saturation empirically (population, light depletion, spatial occupancy over a match)
- [x] Steady-state population is an order of magnitude smaller; individuals scaled up to match
- [x] Light field stays visibly patchy mid-match instead of grazed to zero everywhere
- [x] Spatial occupancy is clumpy (herds with gaps), not a uniform lattice at the separation radius
- [x] Factions expand beyond their home quadrant and interact by mid-match
- [x] Card effects still matter at the new scale (no card becomes a no-op or an auto-win)
- [x] Balance regression test locks in the macro regime; lint and full suite pass

## Notes

- 2026-08-06: Created from user feedback: matches "devolve into an ecosystem where all 4 sides basically have the entirety of their starting quadrant covered... looks more like bacteria than a macro ecosystem".
- 2026-08-06: Measured baseline: population 4478 by t=40s, light field stripped to 1% of cap, occupancy 41%, and Titan finishing at 5267 biomass against Swarm 0 and Bloom 11 — a total runaway with two extinctions, not just a visual problem.
- 2026-08-06: Root cause was a famine equilibrium. Grazers stripped whatever cell they stood on to zero, so population grew until the whole field was bare and everything lived at subsistence — where the only trait that pays is energy buffering, which is why Bigger Body snowballed and every other card was noise. Density then sat at the separation radius, which is what produced the crystalline lattice look.
- 2026-08-06: Fixes: saturating (diminishing-returns) harvest so thin ground feeds poorly; light cap raised so patch richness is decoupled from the world's total energy budget; upkeep chosen from a sweep as the lever that sets standing population; separation radius cut to body diameter; predator satiation so kill rate tracks hunger not geometry; staggered seed ages to stop cohort die-off waves; Pressure rate retuned (at the old rate no lineage could afford a single card at the new turnover volume).
- 2026-08-06: Result: population ~800 (from 4478), light settles at 54% of cap (from 1%), occupancy 8.8% (from 41%), all four lineages alive with a 5:1 spread (from a runaway with two extinctions), and sustained combat throughout. 71/71 tests pass, lint clean, verified visually.
- 2026-08-06: Known follow-up: Swarm (Prolific+Fleet+Efficient) still finishes ahead of the field. Upkeep divides into the light budget to set population, so any card touching it is the strongest card in the game; worth revisiting if it feels dominant in play.
