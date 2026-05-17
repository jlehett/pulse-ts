---
id: TICKET-161
title: P2P networking & lobby
status: todo
priority: medium
created: 2026-05-16
updated: 2026-05-16
depends_on:
  - TICKET-157
labels:
  - lumenwake
  - networking
---

## Description

Implement multiplayer support using the same P2P WebRTC architecture as the arena demo. Star topology with host authority over enemies/waves. Support 1-4 players.

## Acceptance Criteria

- [ ] Reuse arena demo's WebRTC + Lambda signaling approach
- [ ] Lobby UI: create game, list available games, join game (1-4 players)
- [ ] Star topology: host maintains DataChannel to each joiner (up to 3)
- [ ] Player transform replication at 60Hz (useReplicateTransform)
- [ ] RemotePlayerNode with interpolation (useRemoteEntity)
- [ ] Network channels defined:
  - wave-start (host → all): wave number, enemy composition
  - enemy-spawn (host → all): enemy ID, type, position
  - enemy-damage (client → host): enemy ID, damage amount
  - enemy-death (host → all): enemy ID, lux drop
  - refraction-pick (each → all): player ID, chosen refraction
  - player-death (host → all): player ID
  - player-revive (host → all): player ID
- [ ] Host authority: enemy spawns, HP tracking, wave progression, damage validation
- [ ] Client damage reports: "I hit enemy X for Y" → host validates proximity + cooldown
- [ ] Disconnect handling: if host disconnects, match ends; if peer disconnects, continue without them
- [ ] Dev relay via Vite plugin for local testing (reuse from arena)
- [ ] Solo mode works without any network initialization

## Notes

- 2026-05-16: Created. Depends on TICKET-157 (wave manager must exist for host to drive wave state). Heaviest integration ticket.
