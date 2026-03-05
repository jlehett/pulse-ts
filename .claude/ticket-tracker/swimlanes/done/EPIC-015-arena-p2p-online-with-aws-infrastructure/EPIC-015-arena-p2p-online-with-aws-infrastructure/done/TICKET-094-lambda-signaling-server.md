---
id: TICKET-094
epic: EPIC-015
title: Lambda signaling server
status: done
priority: high
created: 2026-03-04
updated: 2026-03-04
branch: ticket-094-lambda-signaling-server
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

- [x] Lambda function code lives in the pulse-ts repo (e.g., `infra/lambda/` or `demos/arena/server/`)
- [x] WebSocket `$connect` / `$disconnect` / `$default` routes handled
- [x] Host can create a lobby (stored in DynamoDB or in-memory via connection state)
- [x] Clients can list open lobbies (returns lobby ID + host username)
- [x] Client joining a lobby triggers signaling relay between host and joiner
- [x] SDP offer/answer and ICE candidate messages relayed between peers
- [x] Lobby cleaned up when host disconnects
- [x] Lobby removed from listing once a joiner connects (1v1)
- [x] All tests pass

## Notes

- **2026-03-04**: Ticket created. DynamoDB may be needed for lobby state since Lambda is stateless; evaluate cost vs simplicity.
- **2026-03-04**: Starting implementation.
- **2026-03-04**: Implementation complete. Full signaling Lambda handler with DynamoDB-backed lobby + connection state. Protocol supports create-lobby, list-lobbies, join-lobby, leave-lobby, signal relay, game-start. Lobby auto-cleanup on host disconnect, revert to waiting on joiner disconnect. 13 Lambda tests pass (ESM + jest.unstable_mockModule for AWS SDK mocking). 495 arena tests still pass.
