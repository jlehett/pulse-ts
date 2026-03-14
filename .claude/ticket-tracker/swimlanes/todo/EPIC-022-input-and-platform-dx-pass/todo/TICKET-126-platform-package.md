---
id: TICKET-126
epic: EPIC-022
title: Platform Package (@pulse-ts/platform)
status: todo
priority: low
created: 2026-03-13
updated: 2026-03-13
labels:
  - platform
  - new-package
  - mobile
---

## Description

Create a new `@pulse-ts/platform` package with mobile detection and support utilities:
`isMobile()` for platform detection and `installMobileSupport({ fullscreen, orientation, installPrompt })`
for common mobile setup tasks.

Design doc: `design-docs/approved/014-platform-package.md`

## Acceptance Criteria

- [ ] New `@pulse-ts/platform` package created
- [ ] `isMobile()` returns boolean based on user agent / touch support
- [ ] `installMobileSupport(options)` handles fullscreen, orientation lock, install prompt
- [ ] Options are all optional with sensible defaults
- [ ] JSDoc with examples
- [ ] Unit tests (mocked environment)
- [ ] Documentation: overview, quickstart

## Notes

- **2026-03-13**: Ticket created from approved design doc #14.
