# Audio Mixing Groups

Mixing groups let you control the volume of sound categories independently -- for example, SFX vs music vs UI sounds. Players expect a settings menu where they can adjust each category, and `useSoundGroup` makes that straightforward.

## Quick start

```ts
import { useSoundGroup, useSound } from '@pulse-ts/audio';

function GameManagerNode() {
    // Define groups with initial volumes
    const sfx = useSoundGroup('sfx', { volume: 0.8 });
    const music = useSoundGroup('music', { volume: 0.5 });

    // Route sounds through groups
    const beep = useSound('tone', {
        wave: 'sine',
        frequency: 880,
        duration: 0.1,
        gain: 0.1,
        group: 'sfx',
    });

    // Control group volume from a settings menu
    sfx.setVolume(settingsSliderValue);
    music.setMuted(true);
}
```

## How gain scaling works

A sound's effective gain is:

```
effective gain = sound.gain * group.volume * masterVolume
```

- `sound.gain` -- the gain value passed to `useSound` (default `0.1`)
- `group.volume` -- the group's volume set via `useSoundGroup` (default `1`)
- `masterVolume` -- the master volume on `AudioService` (default `1`)

If a sound has no `group` option, it scales only by `masterVolume`.

If a group is muted (`group.setMuted(true)`), all sounds in that group play at zero gain.

## Cross-node referencing

Groups are referenced by string name, so different nodes can route sounds through the same group without import dependencies:

```ts
// In GameManagerNode.ts -- define the group
const sfx = useSoundGroup('sfx', { volume: 0.8 });

// In PlayerNode.ts -- use the same group by name
const dashSfx = useSound('noise', {
    filter: 'bandpass',
    frequency: [2000, 500],
    duration: 0.15,
    gain: 0.12,
    group: 'sfx',
});

// In EnemyNode.ts -- same group again
const impactSfx = useSound('tone', {
    wave: 'square',
    frequency: [200, 80],
    duration: 0.1,
    gain: 0.15,
    group: 'sfx',
});
```

## Group persistence

Groups are tied to the `AudioService`, not the world. This means volume preferences survive world recreation (e.g., game restarts). If you reuse the same `AudioService` across worlds, the group state carries over.

```ts
const audio = new AudioService({ masterVolume: 0.8 });

// World 1
const world1 = new World();
world1.provideService(audio);
// ... set sfx volume to 0.4

// World 2 -- same AudioService, group volumes preserved
const world2 = new World();
world2.provideService(audio);
```

## API reference

### `useSoundGroup(name, options?)`

Creates or accesses a named sound group.

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Unique group name |
| `options.volume` | `number` | Initial volume `[0, 1]` (default `1`) |
| `options.muted` | `boolean` | Whether group starts muted (default `false`) |

Returns a `SoundGroupHandle`:

| Property/Method | Description |
|-----------------|-------------|
| `name` | The group name (readonly) |
| `volume` | Current volume (readonly) |
| `muted` | Current mute state (readonly) |
| `setVolume(v)` | Set group volume `[0, 1]` |
| `setMuted(m)` | Set mute state |

### `useSound` `group` option

Pass `group: 'groupName'` in the options to route a sound through a mixing group:

```ts
const sfx = useSound('tone', {
    frequency: 440,
    duration: 0.1,
    group: 'sfx', // route through the 'sfx' group
});
```
