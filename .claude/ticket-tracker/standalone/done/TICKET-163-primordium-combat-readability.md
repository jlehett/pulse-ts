---
id: TICKET-163
title: Primordium combat readability & graphics pass
status: done
priority: high
created: 2026-08-05
updated: 2026-08-05
labels:
  - primordium
  - graphics
  - readability
branch: ticket-163-primordium-combat-readability
---

## Description

The primordium demo is hard to read during the sim phase, especially combat.
Kill flashes are anonymous white spheres, predators are visually identical to
grazers, and the HUD gives no signal about who is winning fights or trending
up. Improve the graphics and readability so a player can tell at a glance
which species is winning — both in-world and on the HUD.

## Acceptance Criteria

- [x] Combat kill events carry attacker/victim identity out of the sim (not just position)
- [x] Kill flashes are colored by the attacker's lineage so combat zones read as "who is winning here"
- [x] Predator castes are visually distinct from photosynthesizers (different silhouette, not just color)
- [x] Energy-based dimming no longer muddies faction identity (raise brightness floor / preserve hue)
- [x] HUD shows a rolling combat feed: who is killing whom, with counts and faction colors
- [x] HUD leaderboard shows biomass trend (rising/falling) per lineage
- [x] Sim changes covered by tests; lint passes on the demo

## Notes

- 2026-08-05: Created from user feedback: "it's not clear which species is winning during combat".
- 2026-08-05: Starting implementation. Branch based on evo-demo (primordium only exists there, not on main).
- 2026-08-05: Implementation complete: sim records killer/victim castes per hit; renderer gives carnivores cone silhouettes, attacker-colored additive kill flashes, brighter energy tint floor; HUD gains rolling combat feed + biomass trend arrows. 64/64 tests pass, lint clean.
- 2026-08-05: Done. Visually verified via puppeteer-driven Chrome (headless Chrome throttles rAF, so headful): predator spikes, attacker-colored flashes, combat feed, and trend arrows all confirmed on screen mid-match.
