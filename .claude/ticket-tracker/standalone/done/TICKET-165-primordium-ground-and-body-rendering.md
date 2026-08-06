---
id: TICKET-165
title: Primordium ground palette & body grounding fixes
status: done
priority: medium
created: 2026-08-06
updated: 2026-08-06
labels:
  - primordium
  - graphics
  - readability
branch: ticket-165-primordium-ground-and-body-rendering
---

## Description

Visual cleanup after the macro-ecosystem rebalance (TICKET-164) made organisms
much larger:

1. The lit ground reads as a flat light blue, which competes with the blue and
   green faction colours instead of receding behind them.
2. Wildlife is nearly invisible — small body size plus a desaturated grey-blue
   against a cool ground.
3. Organism bodies clip through the ground plane. Bodies are drawn centred at
   `y = 0` with the plane at `y = -0.5`, so a body of radius ~2.8 sinks well
   below the floor.

## Acceptance Criteria

- [x] Ground palette recedes behind the faction colours (low saturation, dark when grazed)
- [x] Grazed vs lush ground is still clearly readable as a resource signal
- [x] Wildlife is visible against the ground without being mistaken for a faction
- [x] Bodies rest on the ground plane rather than intersecting it, at every body size
- [x] Newborn grow-in and death fade-out stay grounded as they scale
- [x] Lint, typecheck, and the full suite pass; verified visually

## Notes

- 2026-08-06: Created from user feedback after TICKET-164: "playfield is like a light blue... wildlife is hard to see... organisms tend to clip through the bottom of the play field".
- 2026-08-06: Fixed. Ground swapped from a cyan light ramp to a dark near-neutral earth ramp (it was competing with the blue and green lineages); wildlife recoloured to warm bone white with a floor on rendered body radius so small castes stay visible; bodies now lifted by their own half-extent (sphere radius, cone half-height) so they rest on the plane at every scale, including grow-in and death fade. Verified visually.
