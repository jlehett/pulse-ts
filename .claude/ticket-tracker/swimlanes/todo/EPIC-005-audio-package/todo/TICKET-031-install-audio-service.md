---
id: TICKET-031
epic: EPIC-005
title: installAudio and AudioService
status: todo
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

- [ ] New `@pulse-ts/audio` package with proper structure (public/, domain/, etc.)
- [ ] `installAudio(world, options?)` registers AudioService
- [ ] `useAudio()` hook returns the AudioService
- [ ] AudioContext created lazily on first use
- [ ] Handles suspended state (auto-resume)
- [ ] Master volume control
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Package exports via index.ts

## Notes

- **2026-02-26**: Ticket created. Foundation for the audio package — other tickets depend on this.
