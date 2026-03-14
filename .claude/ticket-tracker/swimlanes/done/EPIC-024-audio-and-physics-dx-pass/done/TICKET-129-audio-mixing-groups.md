---
id: TICKET-129
epic: EPIC-024
title: Audio Mixing Groups (useSoundGroup)
status: done
priority: medium
created: 2026-03-13
updated: 2026-03-14
labels:
  - audio
  - dx
---

## Description

Implement `useSoundGroup` in `@pulse-ts/audio` and add a `group` option to `useSound`
for routing sounds through named mixing groups. Each group has independent volume and
mute controls. Effective gain = `sound.gain * group.volume * masterVolume`.

Design doc: `design-docs/approved/036-audio-mixing-groups.md`

## Acceptance Criteria

- [ ] `useSoundGroup(name, options?)` creates or accesses a named sound group
- [ ] Group handle: `setVolume(volume)`, `setMuted(muted)`, readonly `volume`, `muted`, `name`
- [ ] `useSound` accepts optional `group` string option
- [ ] Sound gain scales by group volume: `sound.gain * group.volume * masterVolume`
- [ ] Groups persist across world lifecycles (tied to audio service)
- [ ] Backward compatible — sounds without a group scale only by master volume
- [ ] JSDoc with examples
- [ ] Unit tests for group volume scaling, muting, persistence
- [ ] Documentation updated

## Notes

- **2026-03-13**: Ticket created from approved design doc #36.
