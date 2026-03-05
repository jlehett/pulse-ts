---
id: TICKET-094
epic: EPIC-015
title: Lambda signaling server
status: todo
priority: high
created: 2026-03-04
updated: 2026-03-04
labels:
  - backend
  - aws
  - networking
  - arena
---

## Description

Implement the AWS Lambda function that powers the signaling server behind the
API Gateway WebSocket API. Handles lobby management (create, list, join, cleanup
on disconnect) and relays WebRTC signaling messages (SDP offers/answers, ICE
candidates) between peers.

## Acceptance Criteria

- [ ] Lambda function code lives in the pulse-ts repo (e.g., `infra/lambda/` or `demos/arena/server/`)
- [ ] WebSocket `$connect` / `$disconnect` / `$default` routes handled
- [ ] Host can create a lobby (stored in DynamoDB or in-memory via connection state)
- [ ] Clients can list open lobbies (returns lobby ID + host username)
- [ ] Client joining a lobby triggers signaling relay between host and joiner
- [ ] SDP offer/answer and ICE candidate messages relayed between peers
- [ ] Lobby cleaned up when host disconnects
- [ ] Lobby removed from listing once a joiner connects (1v1)
- [ ] All tests pass

## Notes

- **2026-03-04**: Ticket created. DynamoDB may be needed for lobby state since Lambda is stateless; evaluate cost vs simplicity.
