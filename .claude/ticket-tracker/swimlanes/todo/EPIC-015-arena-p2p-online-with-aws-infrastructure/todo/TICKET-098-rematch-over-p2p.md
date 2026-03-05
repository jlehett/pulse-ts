---
id: TICKET-098
epic: EPIC-015
title: Rematch over P2P
status: todo
priority: medium
created: 2026-03-04
updated: 2026-03-04
labels:
  - networking
  - gameplay
  - arena
---

## Description

Ensure the existing rematch functionality works correctly over the P2P
DataChannel connection. After a match ends, both players can rematch without
re-signaling — the existing DataChannel stays open and a new game session
starts over it.

## Acceptance Criteria

- [ ] Rematch button works as normal after a P2P match
- [ ] No re-signaling or new RTCPeerConnection needed for rematches
- [ ] DataChannel remains open between matches
- [ ] Game state resets cleanly for the new match
- [ ] Handles case where one player disconnects during rematch negotiation
- [ ] All tests pass

## Notes

- **2026-03-04**: Ticket created. Depends on TICKET-095 (WebRTC layer). Existing rematch logic (TICKET-089) should mostly work if the transport layer is swapped cleanly.
