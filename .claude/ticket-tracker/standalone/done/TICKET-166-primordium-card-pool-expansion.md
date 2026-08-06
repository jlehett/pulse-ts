---
id: TICKET-166
title: Primordium card pool expansion
status: done
priority: high
created: 2026-08-06
updated: 2026-08-06
labels:
  - primordium
  - gameplay
  - cards
branch: ticket-166-primordium-card-pool-expansion
---

## Description

The card pool is only seven cards and every one of them is a stat nudge
(faster, bigger, cheaper). There is little to discover and few interesting
combinations. Expand it substantially with cards that are *capabilities*, not
numbers — which means growing the simulation's vocabulary first, since the
current sim can only express speed/size/upkeep/reproduction.

## Acceptance Criteria

- [x] New sim capabilities that unlock qualitatively different strategies (armor, toxicity, herding, dispersal, dormancy, omnivory, scavenging)
- [x] Predation is a real size *ladder* — armor can price you out of being prey, and cards can let a predator punch above its weight
- [x] Card pool grows to ~20+ cards with distinct identities and honest tradeoffs
- [x] No card is a pure upgrade; each gives up something real
- [x] Cards are grouped/legible in the evolve panel at the new pool size
- [x] AI rosters use the new pool so matches show off the mechanics
- [x] Tests cover the new sim mechanics and every card compiles to a sane caste
- [x] Balance regression test still passes; lint and typecheck clean

## Notes

- 2026-08-06: Created from user feedback: "I think we need a lot more cards. And creative ones."
- 2026-08-06: Grew the sim's vocabulary first, since the old pool could only express speed/size/upkeep/reproduction. Added armour (`defense`), `toxicity`, `preyReach`, `armorPiercing`, herding (`cohesion` + `crowdTolerance`), `spawnDispersal`, dormancy, omnivory, corpse fertility, and density-dependent crowding. Pool grew 7 -> 26 cards across six branches, grouped in the evolve panel.
- 2026-08-06: Predation is now a ladder rather than a binary. `canEat` is the single source of truth consulted by hunting, fleeing, and personal space, so armour and prey-reach can never leave those three disagreeing. Pack Hunter (x1.3), Apex Jaws (x1.55) and Venom (x1.7) stack multiplicatively to ~x3.4, and Shell Cracker ignores armour outright — so a predator can invest into killing things much larger than itself, and Carapace is a real counter that Shell Cracker then answers.
- 2026-08-06: BALANCE — measured, not assumed, and only partly solved. Root causes found by profiling: (1) `harvestRate/upkeep` sets a species' break-even light level and the lowest one competitively excludes everyone; (2) biomass = size x (light budget / upkeep), so `size/upkeep` is the score multiplier and any card moving one without the other is a silent score swing; (3) raising upkeep mid-match drops carrying capacity below the standing population, starving that lineage the instant it evolves — three of four lineages crashed at the first evolve turn; (4) `moveSpeed` is a hidden power stat because realized intake depends on sweeping fresh ground.
- 2026-08-06: Fixes applied: upkeep is off-limits as a card cost except the four whole-body metabolic cards, which move `size` with it; a locked invariant test keeps every card's `size/upkeep` within +/-20% of base; crowding is an absolute biomass-based cost (a proportional one billed the cheapest species least and compounded its advantage); intraspecific crowding is weighted 12x interspecific, which is the textbook condition for coexistence on a shared resource; matches start near carrying capacity so they test sustained performance instead of a growth race.
- 2026-08-06: Outcome: no more extinctions (was two lineages on exactly 0), leader spread down from 229:1 to ~50:1, and the mat regime did not return. Still NOT balanced — the r-strategist deck (Dwarfism + Efficient) leads on a first-mover effect: it breeds fastest, seizes ground early, and holds it. 89/89 tests pass, lint and typecheck clean.
- 2026-08-06: FOLLOW-UP for the remaining gap: the most promising fix is to stop retrofitting living organisms when a genome changes. `setCasteGenome` currently rewrites every living organism instantly, which is what makes an upkeep change a cliff; applying an evolved genome to *new generations only* (the `addCaste`/`reassignFraction` machinery already exists) would make evolution gradual and remove both the crash and the first-mover snowball.
