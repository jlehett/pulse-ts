---
id: TICKET-048
epic: EPIC-008
title: Audio polish
status: done
priority: low
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - audio
branch: ticket-048-audio-polish
---

## Description

Sound effects for the arena: knockout death sound (descending tone), round-win fanfare (arpeggio), dash whoosh (noise), countdown beeps. All via `useSound`.

## Acceptance Criteria

- [x] Knockout death sound — descending tone via `useSound('tone', ...)`
- [x] Round-win fanfare — arpeggio via `useSound('arpeggio', ...)`
- [x] Dash whoosh — noise via `useSound('noise', ...)`
- [x] Countdown beeps — short tones for 3-2-1 countdown
- [x] Sounds integrated into appropriate game events

## Notes

- **2026-02-26**: Ticket created.
