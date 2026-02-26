---
id: TICKET-032
epic: EPIC-005
title: useSound declarative procedural sound hook
status: todo
priority: high
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add a `useSound()` hook to `@pulse-ts/audio` for declarative procedural sound synthesis.

API:
```ts
const jumpSfx = useSound('tone', {
    wave: 'square',
    frequency: [400, 800],   // start → end (auto-ramp)
    duration: 0.08,
    gain: 0.1,
});

const dashSfx = useSound('noise', {
    filter: 'bandpass',
    frequency: [2000, 500],  // filter sweep
    duration: 0.15,
    gain: 0.12,
});

const collectSfx = useSound('arpeggio', {
    wave: 'sine',
    notes: [523.25, 659.25, 783.99],
    interval: 0.06,
    duration: 0.2,
    gain: 0.1,
});

jumpSfx.play();  // fire-and-forget
```

Sound types: `'tone'` (oscillator with optional frequency ramp), `'noise'` (white noise with filter), `'arpeggio'` (multi-note sequence).

## Acceptance Criteria

- [ ] `useSound('tone', options)` creates oscillator-based sounds with frequency ramp
- [ ] `useSound('noise', options)` creates filtered white noise
- [ ] `useSound('arpeggio', options)` creates multi-note sequences
- [ ] `.play()` is fire-and-forget (no manual cleanup needed)
- [ ] Supports `wave`, `frequency`, `duration`, `gain`, `envelope` options
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Update platformer demo to use `useSound` instead of raw audio.ts

## Notes

- **2026-02-26**: Ticket created. Replaces the demo's manual Web Audio graph construction with declarative config.
