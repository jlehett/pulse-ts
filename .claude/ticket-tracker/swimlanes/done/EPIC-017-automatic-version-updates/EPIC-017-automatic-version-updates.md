---
id: EPIC-017
title: Automatic version updates
status: done
created: 2026-03-05
updated: 2026-03-05
---

## Description

Implement a version tracking and auto-update system for the arena demo so that
players automatically pick up new deployments without manual refresh. When a new
version of the game client is deployed, active users should be notified or
seamlessly transitioned to the updated code.

## Open Questions

- **Frontend only or frontend + backend?** Frontend assets are static
  (S3/CloudFront). The Lambda signaling server is updated independently. If a
  deploy changes the network protocol, both sides need to agree on version. For
  pure frontend changes (UI, gameplay tuning), only the client matters.
- **Detection mechanism:** Poll a version manifest on S3? Use CloudFront
  headers? Service worker cache comparison? ETag/hash check?
- **Update timing:** Force reload between matches? Show a banner mid-match?
  Only on next page load? Auto-reload when idle?
- **In-progress matches:** What happens if a deploy lands while two players are
  mid-match? Both need the same client version for physics/knockback to agree.

## Goal

Players always run the latest deployed version with minimal disruption. Version
mismatches between online players are detected and handled gracefully.

## Notes

- **2026-03-05**: Epic created. Scope and approach TBD.
- **2026-03-05**: Epic closed — all tickets complete.
