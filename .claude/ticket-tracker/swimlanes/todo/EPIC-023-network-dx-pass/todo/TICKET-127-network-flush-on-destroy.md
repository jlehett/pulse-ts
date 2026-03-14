---
id: TICKET-127
epic: EPIC-023
title: Network Flush on World Destroy
status: todo
priority: medium
created: 2026-03-13
updated: 2026-03-13
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

- [ ] Pending outbound messages are flushed when world is destroyed
- [ ] Implemented via `useDestroy` in network installer (no new API)
- [ ] No messages lost during world teardown
- [ ] Backward compatible — no API changes
- [ ] Unit tests for flush-on-destroy behavior
- [ ] Documentation updated if needed

## Notes

- **2026-03-13**: Ticket created from approved design doc #9.
