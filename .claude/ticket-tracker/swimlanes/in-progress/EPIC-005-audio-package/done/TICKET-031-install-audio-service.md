---
id: TICKET-031
epic: EPIC-005
title: installAudio and AudioService
status: done
priority: high
created: 2026-02-26
updated: 2026-02-26
---

## Description

Create the `@pulse-ts/audio` package with core AudioContext lifecycle management.

API:
- `installAudio(world, options?)` — bootstraps the AudioService (lazy AudioContext creation, autoplay policy handling, master volume)
- `useAudio()` — hook to access the AudioService from any node

The AudioContext is created lazily on the first sound play (which always follows user interaction), satisfying browser autoplay policy automatically.

## Acceptance Criteria

- [x] New `@pulse-ts/audio` package with proper structure (public/, domain/, etc.)
- [x] `installAudio(world, options?)` registers AudioService
- [x] `useAudio()` hook returns the AudioService
- [x] AudioContext created lazily on first use
- [x] Handles suspended state (auto-resume)
- [x] Master volume control
- [x] Full JSDoc with `@param`, `@returns`, `@example`
- [x] Colocated tests
- [x] Package exports via index.ts

## Notes

- **2026-02-26**: Ticket created. Foundation for the audio package — other tickets depend on this.
- **2026-02-26**: Status changed to done
