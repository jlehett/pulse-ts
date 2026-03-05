---
id: TICKET-100
epic: EPIC-015
title: Migrate Lambda signaling server to TypeScript
status: done
priority: medium
created: 2026-03-04
updated: 2026-03-04
branch: ticket-100-lambda-typescript-migration
labels:
  - backend
  - aws
  - arena
---

## Description

Convert the Lambda signaling server from plain JavaScript (.mjs) to TypeScript.
Add a build step to compile TS to JS for Lambda deployment. Align with the
repo-wide convention of TypeScript everywhere.

## Acceptance Criteria

- [x] Lambda source code is TypeScript (.ts)
- [x] Types defined for all message protocols, DynamoDB items, and event shapes
- [x] Build step compiles TS to JS (output to a deploy-ready directory)
- [x] Terraform `archive_file` updated to zip the compiled output (not raw TS)
- [x] Tests migrated to TypeScript or updated to work with the new build
- [x] All Lambda tests pass
- [x] All arena tests still pass

## Notes

- **2026-03-04**: Ticket created.
- **2026-03-04**: Starting implementation.
- **2026-03-04**: Implementation complete. Source migrated to `lambda/src/index.ts` + `lambda/src/types.ts` with full protocol types (WebSocketEvent, ClientMessage, ServerMessage, ConnectionRecord, LobbyRecord, etc.). Build via `tsc` outputs to `lambda/dist/`. Terraform updated to zip from `dist/`. Tests migrated to `.test.ts` with jest.mock + babel-jest. Arena jest config updated to exclude `infra/`. 13 Lambda tests pass, 495 arena tests pass.
