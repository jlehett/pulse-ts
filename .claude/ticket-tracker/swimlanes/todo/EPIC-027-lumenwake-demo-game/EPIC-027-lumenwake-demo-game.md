---
id: EPIC-027
title: Lumenwake Demo Game
status: todo
created: 2026-05-16
updated: 2026-05-16
---

## Description

Build a fully-featured co-op PvE horde-mode demo game. Players are radiant prisms (glowing geometric crystals) fighting voidforms (dark hollow polyhedra) across 8 waves + 1 boss wave in a dimming arena. Top-down camera, quick matches (5-8 min).

Features:
- 3 playable classes (Shard, Ward, Lens) with distinct geometry and abilities
- 3 arena map variants (Nexus, Fracture, Convergence)
- Persistent progression via localStorage (skill trees + equippable gear cores)
- In-match roguelite buffs ("Refractions") chosen between waves
- Difficulty scaling by player count (1-4 players)
- P2P co-op networking via WebRTC (same architecture as arena demo)
- Geometric art style with bloom, emissive materials, no modeling required

## Tickets

- TICKET-153: Project scaffold & basic game loop
- TICKET-154: Arena rendering & map system
- TICKET-155: Local player movement & combat
- TICKET-156: Enemy system & AI
- TICKET-157: Wave manager & match flow
- TICKET-158: Refraction (in-match buff) system
- TICKET-159: Boss wave
- TICKET-160: Persistent progression system
- TICKET-161: P2P networking & lobby
- TICKET-162: Polish, VFX & audio
