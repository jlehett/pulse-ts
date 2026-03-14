---
id: TICKET-126
epic: EPIC-022
title: Platform Package (@pulse-ts/platform)
status: done
priority: low
created: 2026-03-13
updated: 2026-03-14
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

- [x] New `@pulse-ts/platform` package created
- [x] `isMobile()` returns boolean based on user agent / touch support
- [x] `installMobileSupport(options)` handles fullscreen, orientation lock, install prompt
- [x] Options are all optional with sensible defaults
- [x] JSDoc with examples
- [x] Unit tests (mocked environment)
- [x] Documentation: overview, quickstart

## Notes

- **2026-03-13**: Ticket created from approved design doc #14.
