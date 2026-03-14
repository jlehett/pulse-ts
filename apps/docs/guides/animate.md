# Animated Values

`useAnimate` provides a general-purpose time-varying value source. It supports three modes — oscillation, rate, and tween — selected by the shape of the options object you pass in.

## Quick start

```ts
import { useAnimate } from '@pulse-ts/effects';
import { useFrameUpdate } from '@pulse-ts/core';

function BobbingLight() {
    const bob = useAnimate({ wave: 'sine', amplitude: 0.2, frequency: 2 });
    const spin = useAnimate({ rate: 1.5 });

    useFrameUpdate(() => {
        light.position.y = baseY + bob.value;
        light.rotation.y = spin.value;
    });
}
```

## Modes

### Oscillation

Produces a repeating waveform. Specify a `wave` shape (`'sine'`, `'triangle'`, `'square'`, `'sawtooth'`) plus either an `amplitude` (centered at zero) or a `min`/`max` range.

```ts
// Centered at 0, oscillates [-0.5, 0.5]
const bob = useAnimate({ wave: 'sine', amplitude: 0.5, frequency: 2 });

// Oscillates between min and max
const pulse = useAnimate({ wave: 'sine', min: 0.3, max: 0.9, frequency: 3 });
```

### Rate

Linearly increasing value: `value = rate * elapsed`.

```ts
const spin = useAnimate({ rate: 2 }); // 2 units/sec
```

### Tween

One-shot interpolation from `from` to `to` over `duration` seconds. Must call `play()` to start.

```ts
const fade = useAnimate({ from: 0, to: 1, duration: 0.5, easing: 'ease-out' });
fade.play();
```

Available easing presets: `'linear'`, `'ease-in'`, `'ease-out'`, `'ease-in-out'`. You can also pass a custom `(t: number) => number` function.

## Play callback

All modes support an optional callback on `play()` for fire-and-forget animation consumption. The callback is invoked each frame with the current value, eliminating the need for a separate `useFrameUpdate`.

```ts
// Tween with callback
const flash = useAnimate({ from: 2.0, to: 1.0, duration: 0.5, easing: 'ease-out' });
flash.play((v) => { panel.style.filter = `brightness(${v})`; });

// Oscillation with callback
const pulse = useAnimate({ wave: 'sine', min: 0.4, max: 1.5, frequency: 1.5 });
pulse.play((v) => { material.emissiveIntensity = v; });

// Rate with callback
const spin = useAnimate({ rate: 2 });
spin.play((v) => { mesh.rotation.y = v; });
```

Calling `play()` without a callback still works exactly as before. The callback is about how you consume the value, not about the animation configuration. You can also change the callback on replay:

```ts
const pop = useAnimate({ from: 1.35, to: 1.0, duration: 0.5, easing: 'ease-out' });

function scalePop(el: HTMLElement) {
    pop.reset();
    pop.play((v) => { el.style.transform = `scale(${v})`; });
}
```

## API reference

### `AnimatedValue`

| Property / Method | Type | Description |
|---|---|---|
| `value` | `number` (readonly) | Current animated value, auto-updated each frame. |
| `play(onUpdate?)` | `(cb?: (value: number) => void) => void` | Start animation (tween) or attach a callback (all modes). |
| `reset()` | `() => void` | Reset elapsed time to zero / tween to initial state. |
| `finished` | `boolean` (readonly) | Whether the tween has completed. Always `false` for oscillation/rate. |

### Limitations

- Tween mode does not loop automatically. Call `reset()` then `play()` to replay.
- Rate mode grows without bound. Use `reset()` if you need to restart.
- The play callback is replaced (not accumulated) on each `play()` call.
