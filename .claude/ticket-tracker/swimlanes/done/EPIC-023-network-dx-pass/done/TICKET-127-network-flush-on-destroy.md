---
id: TICKET-127
epic: EPIC-023
title: Network Flush on World Destroy
status: done
priority: medium
created: 2026-03-13
updated: 2026-03-14
labels:
  - network
  - bugfix
---

## Description

Auto-flush pending outbound network messages on world destroy via `useDestroy` in the
network installer. Prevents lost messages when a world is torn down (e.g., game restart,
lobby return). No API changes — transparent behavioral fix.

Design doc: `design-docs/approved/009-network-flush-on-destroy.md`

## Acceptance Criteria

- [x] Pending outbound messages are flushed when world is destroyed
- [x] Implemented via TransportService.detach() flush (no new API)
- [x] No messages lost during world teardown
- [x] Backward compatible — no API changes
- [x] Unit tests for flush-on-destroy behavior
- [x] Documentation updated if needed

## Notes

- **2026-03-13**: Ticket created from approved design doc #9.
