# Approved: Audio Mixing Groups (`useSoundGroup`)

> Independent volume control per sound category — SFX, music, ambience, UI.

**Origin:** Engine Improvements #36 (`useSoundGroup`).

---

## Summary

A new `useSoundGroup` hook in `@pulse-ts/audio` and a `group` option on `useSound` for routing sounds through named mixing groups. Each group has independent volume and mute controls.

---

## Problem

The audio package has only master volume on `AudioService` — no way to independently control SFX vs music vs UI sound volumes. The arena demo has 7+ `useSound` calls across 3 files, all with hardcoded `gain` values. A settings menu that lets players adjust "effects volume" vs "music volume" would require manually tracking every sound handle and scaling their gains. This is the #1 expected feature in any audio system.

---

## API

### `useSoundGroup`

```typescript
interface SoundGroupOptions {
    /** Initial volume (0–1). Default: 1. */
    volume?: number;
    /** Whether the group starts muted. Default: false. */
    muted?: boolean;
}

interface SoundGroupHandle {
    readonly name: string;
    readonly volume: number;
    readonly muted: boolean;
    setVolume(volume: number): void;
    setMuted(muted: boolean): void;
}

/**
 * Create or access a named sound group. Sounds routed to this group
 * have their gain scaled by the group's volume.
 *
 * @param name - Unique group name.
 * @param options - Initial volume and mute state.
 * @returns A handle for controlling the group.
 *
 * @example
 * const sfx = useSoundGroup('sfx', { volume: 0.8 });
 * const music = useSoundGroup('music', { volume: 0.5 });
 *
 * // In settings menu:
 * sfx.setVolume(settingsSliderValue);
 * music.setMuted(true);
 */
function useSoundGroup(name: string, options?: SoundGroupOptions): SoundGroupHandle;
```

### `useSound` enhancement

```typescript
interface SoundOptions {
    // ... existing options ...

    /** Route this sound through a mixing group. */
    group?: string;
}

/**
 * @example
 * const dashSfx = useSound('noise', {
 *     filter: 'bandpass', frequency: [2000, 500],
 *     duration: 0.15, gain: 0.12,
 *     group: 'sfx',
 * });
 */
```

---

## Usage Examples

### Define groups and assign sounds

```typescript
// GameManagerNode.ts — define groups
const sfx = useSoundGroup('sfx', { volume: 0.8 });
const music = useSoundGroup('music', { volume: 0.5 });

// Sounds route through their group
const beepSfx = useSound('tone', { wave: 'sine', frequency: [880, 880], gain: 0.1, group: 'sfx' });
const fanfareSfx = useSound('arpeggio', { wave: 'sine', notes: [523, 659, 784], gain: 0.12, group: 'sfx' });

// LocalPlayerNode.ts — same group, different node
const dashSfx = useSound('noise', { filter: 'bandpass', gain: 0.12, group: 'sfx' });
const impactSfx = useSound('tone', { wave: 'square', gain: 0.15, group: 'sfx' });
```

### Settings menu control

```typescript
// Mute all sound effects
sfx.setMuted(true);

// Adjust music volume from a slider
music.setVolume(sliderValue);
```

### No group — unchanged behavior

```typescript
// Still works — sound plays at its own gain, scaled only by master volume
const clickSfx = useSound('tone', { gain: 0.1 });
```

---

## Design Decisions

- **String-based group names** — Groups are referenced by name in `useSound`'s `group` option. This avoids import dependencies between nodes that define groups and nodes that use sounds.
- **Group volume scales sound gain** — A sound's effective gain is `sound.gain * group.volume * masterVolume`. The sound's own gain is its relative loudness within the group.
- **Groups persist across world lifecycles** — Volume preferences are typically user settings that should survive world recreation (e.g., game restart). Groups are tied to the audio service, not the world.
- **Backward compatible** — The `group` option on `useSound` is optional. Sounds without a group are scaled only by master volume, matching current behavior.
