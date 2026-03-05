---
id: TICKET-101
epic: EPIC-015
title: Kinesis Video Streams TURN relay
status: done
branch: ticket-101-kinesis-turn-relay
priority: high
created: 2026-03-05
updated: 2026-03-05
labels:
  - infrastructure
  - networking
  - arena
---

## Description

Add AWS Kinesis Video Streams as a managed TURN relay so WebRTC P2P connections
succeed even when peers are behind symmetric NATs. The Lambda signaling server
fetches temporary TURN credentials via `GetIceServerConfig` and sends them to
clients during the lobby flow. Terraform provisions the Kinesis Video signaling
channel and IAM permissions.

## Acceptance Criteria

- [x] Terraform creates a Kinesis Video signaling channel
- [x] Lambda IAM role has `kinesisvideo:GetIceServerConfig` permission
- [x] Lambda fetches TURN credentials and sends them to clients during lobby join
- [x] Frontend uses the TURN credentials in ICE configuration alongside STUN servers
- [x] P2P connections succeed behind restrictive NATs (TURN fallback works)
- [x] No secrets or credentials hardcoded in frontend code
- [x] All tests pass

## Notes

- **2026-03-05**: Ticket created. Users behind symmetric NATs cannot connect with STUN-only ICE config. Kinesis Video Streams provides managed TURN at near-zero cost ($0.12/GB relay data).
- **2026-03-05**: Implementation complete. Added kinesis.tf, updated IAM/Lambda/outputs, added get-ice-servers action to Lambda, frontend requests TURN credentials before P2P handshake with 5s timeout fallback to STUN-only.
