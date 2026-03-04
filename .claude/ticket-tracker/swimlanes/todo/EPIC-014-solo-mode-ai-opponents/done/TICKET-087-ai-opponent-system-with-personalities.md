---
id: TICKET-087
epic: EPIC-014
title: AI opponent system with personalities
status: done
priority: medium
created: 2026-03-02
updated: 2026-03-03
branch: ticket-087-ai-opponent-system-with-personalities
labels:
  - gameplay
  - ai
  - arena
---

## Description

Implement an AI opponent system that can control a player character in the arena.
The AI should have multiple distinct "personalities" that affect decision-making
and playstyle (e.g., aggressive rusher, defensive edge-hugger, erratic/chaotic).
Each personality should have tunable parameters that drive movement, attack
timing, and positioning strategy.

## Acceptance Criteria

- [x] AI controller can drive a player character (movement + attack inputs)
- [x] At least 3 distinct AI personalities with noticeably different playstyles
- [x] AI personalities are selectable or randomly assigned
- [x] AI responds to game state (opponent position, edge proximity, knockback)
- [x] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Starting implementation.
- **2026-03-03**: Implementation complete. AI system includes AiPlayerNode, AiService with personality-driven decision-making, 5 personalities (Brawler, Sentinel, Trickster, Berserker, Ghost), solo menu integration, pause system overhaul with engine timeScale, and particle timeScale for replay slow-motion. All 476 arena tests and 108 effects tests pass, lint clean.
