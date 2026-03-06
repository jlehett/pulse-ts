---
id: TICKET-103
epic: EPIC-017
title: Build-time version hash and version polling
status: done
branch: ticket-103-build-time-version-hash-and-polling
priority: high
created: 2026-03-05
updated: 2026-03-05
labels:
  - infra
  - arena
---

## Description

Inject a version identifier at build time and provide a mechanism for the
running client to detect when a newer version has been deployed.

### Implementation

1. **Build-time injection:** Use Vite's `define` to inject a version hash
   (e.g., short git SHA or content hash) into the client bundle as
   `__APP_VERSION__`.
2. **Version manifest:** The deploy script writes a `version.json` file to S3
   containing `{ "version": "<hash>" }` alongside the built assets.
3. **Polling:** A lightweight poller fetches `version.json` periodically (e.g.,
   every 60s) and compares against the injected `__APP_VERSION__`. Expose a
   simple API: `isUpdateAvailable()` or an event/callback.
4. **Cache busting:** `version.json` must be served with `Cache-Control:
   no-cache` or a short max-age so CloudFront doesn't serve stale versions.

### Files to touch

- `demos/arena/vite.config.ts` — inject `__APP_VERSION__`
- `infra/deploy.sh` — write `version.json` after build
- New module: `demos/arena/src/versionCheck.ts` — polling logic

## Acceptance Criteria

- [x] `__APP_VERSION__` is available at runtime and matches the deployed hash
- [x] `version.json` is written to S3 on every deploy
- [x] `version.json` is served with appropriate cache headers (no stale reads)
- [x] Polling detects a version mismatch within ~60 seconds of deploy
- [x] `isUpdateAvailable()` or equivalent API returns true when mismatch detected
- [x] Tests cover version comparison logic

## Notes

- **2026-03-05**: Ticket created.
- **2026-03-05**: Implementation complete. Added `__APP_VERSION__` injection via
  Vite define, `version.json` generation in deploy.sh with no-cache headers,
  and `versionCheck.ts` polling module with 16 tests covering all APIs.
