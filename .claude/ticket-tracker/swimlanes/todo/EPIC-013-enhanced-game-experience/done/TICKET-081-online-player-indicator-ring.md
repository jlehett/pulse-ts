---
id: TICKET-081
epic: EPIC-013
title: Online player indicator ring
status: done
branch: ticket-081-online-player-indicator-ring
priority: medium
created: 2026-03-02
updated: 2026-03-02
labels:
  - arena
  - online
---

## Description

In online mode, add a light yellow circle outline (flat torus ring) beneath the locally
controlled player to make it easy to tell which character you are controlling. The ring
should hover just above the ground, have a subtle emissive glow, and only appear in
online mode.

## Acceptance Criteria

- [x] Yellow ring visible beneath local player in online mode
- [x] Ring is not visible in local 2-player mode
- [x] Ring follows the player position smoothly
- [x] Ring has subtle emissive glow under bloom
- [x] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Implementation complete — light yellow torus ring (0xffee88) added to LocalPlayerNode, gated on `replicate` prop (online mode only). Ring sits at player's feet, emissive glow for bloom visibility. 150 tests pass, lint clean.
