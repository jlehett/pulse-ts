---
id: TICKET-110
epic: EPIC-018
title: Color Utility
status: todo
priority: low
created: 2026-03-13
updated: 2026-03-13
labels:
  - core
  - utility
---

## Description

Add a `color()` utility to `@pulse-ts/core` that converts a hex number into multiple
formats: `.hex` (CSS string), `.num` (original number), `.rgb` (CSS rgb string),
`.rgba(alpha)` (CSS rgba string), `.r`, `.g`, `.b` (0–255 channels).

Design doc: `design-docs/approved/021-color-utility.md`

## Acceptance Criteria

- [ ] `color(0x48c9b0)` returns an object with format accessors
- [ ] `.hex` returns CSS hex string (`'#48c9b0'`)
- [ ] `.num` returns original number
- [ ] `.rgb` returns CSS rgb string
- [ ] `.rgba(alpha)` returns CSS rgba string
- [ ] `.r`, `.g`, `.b` return 0–255 channel values
- [ ] JSDoc with examples
- [ ] Unit tests for all format conversions
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #21.
