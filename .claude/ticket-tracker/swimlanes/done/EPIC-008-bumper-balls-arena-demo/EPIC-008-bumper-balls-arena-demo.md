---
id: EPIC-008
title: Bumper Balls Arena Demo
status: done
created: 2026-02-26
updated: 2026-02-28
---

## Description

Split-screen multiplayer arena demo showcasing network, effects, save, and all other engine packages. Two players on a circular floating platform — knock your opponent off the edge. Fall = opponent scores. First to 5 wins the match. Particle explosions, sound effects, persistent leaderboard.

Default mode is split-screen (two World instances in one browser tab connected via MemoryHub). Optional WebSocket mode for separate browser tabs.

## Goal

Deliver a polished multiplayer demo that exercises every engine package (core, input, three, physics, audio, network, effects, save), proving the engine can handle real-time networked gameplay with split-screen rendering.

## Notes

- **2026-02-26**: Epic created. 13 tickets (TICKET-040 through TICKET-052). Milestones: foundation (040–043), minimal playable (044–045), complete game loop (046–047), polish (048–050), extras (051–052).
- **2026-02-28**: All 13 tickets complete. Epic closed.
