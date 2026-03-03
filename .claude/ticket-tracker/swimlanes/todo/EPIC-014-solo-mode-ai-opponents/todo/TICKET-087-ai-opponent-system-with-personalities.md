---
id: TICKET-087
epic: EPIC-014
title: AI opponent system with personalities
status: todo
priority: medium
created: 2026-03-02
updated: 2026-03-02
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

- [ ] AI controller can drive a player character (movement + attack inputs)
- [ ] At least 3 distinct AI personalities with noticeably different playstyles
- [ ] AI personalities are selectable or randomly assigned
- [ ] AI responds to game state (opponent position, edge proximity, knockback)
- [ ] All tests pass

## Notes

- **2026-03-02**: Ticket created.
