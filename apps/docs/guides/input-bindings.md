# Guide: Input Bindings & Actions

Configure keyboard, mouse, and custom bindings with `@pulse-ts/input`, and consume them with hooks in Functional Nodes.

## Install service and providers

```ts
import { installInput, Axis1D, Axis2D, PointerMovement, PointerWheelScroll, PointerButton, Key, Chord, Sequence } from '@pulse-ts/input';

installInput(world, {
  preventDefault: true,
  pointerLock: true,
  bindings: {
    // Digital actions via chords and sequences
    jump: Chord([Key('Space')]),
    dash: Sequence([Key('KeyD'), Key('KeyS')], { maxGapFrames: 10 }),

    // Axes
    moveX: Axis1D({ pos: Key('D'), neg: Key('A') }),
    moveY: Axis1D({ pos: Key('W'), neg: Key('S') }),
    move: Axis2D({ x: { pos: Key('D'), neg: Key('A') }, y: { pos: Key('W'), neg: Key('S') } }),

    // Pointer
    look: PointerMovement({ scaleX: 0.1, scaleY: 0.1 }),
    zoom: PointerWheelScroll({ scale: 1.0 }),

    // Pointer button (mouse)
    fire: PointerButton(0)
  }
});
```

## Read inputs in Functional Nodes

```ts
import { useAxis1D, useAxis2D, useAction, usePointer } from '@pulse-ts/input';
import { useFrameUpdate } from '@pulse-ts/core';

function PlayerController() {
  const move = useAxis2D('move');
  const jump = useAction('jump');
  const dash = useAction('dash');
  const fire = useAction('fire');
  const zoom = useAxis1D('zoom');
  const pointer = usePointer();

  useFrameUpdate((dt) => {
    const m = move();         // { x, y }
    const j = jump();         // { pressed, released, held }
    const d = dash();
    const z = zoom();         // wheel delta (scaled)
  const { deltaX, deltaY } = pointer(); // mouse delta (scaled)

    // ...apply to movement/camera...
  });
}
```

## Virtual input (tests/bots)

```ts
import { VirtualInput } from '@pulse-ts/input';

const vi = new VirtualInput(useInput());
vi.press('jump');
vi.axis2D('move', { x: 1, y: 0 });
```

## Subscribing to action events

Prefer polling via hooks in gameplay code. For event-driven flows (UI, analytics), you can subscribe to action state changes that occur during `commit()`:

```ts
import { installInput, Key } from '@pulse-ts/input';

const input = installInput(world, { bindings: { jump: Key('Space') } });
const off = input.actionEvent.on(({ name, state }) => {
  if (name === 'jump') {
    if (state.pressed) console.log('Jump pressed!');
    if (state.released) console.log('Jump released!');
  }
});

// later, to unsubscribe
off();
```

## Tips

- Set `preventDefault` to avoid scrolling/back/forward during gameplay.
- Enable `pointerLock` to capture mouse for FPS-style look.
- Use `Axis2D` for combined WASD vectors and `Axis1D` for single axes.
- Use `Chord` for simultaneous keys and `Sequence` for combos.

Note: `preventDefault` and `pointerLock` default to `false` unless specified in `installInput` options.

## Multiple pointer movement bindings

You can bind more than one action to pointer movement, each with its own sensitivity/inversion. This is useful for separate "look" and "aim" vectors.

```ts
installInput(world, {
  bindings: {
    look: PointerMovement({ scaleX: 0.1, scaleY: 0.1 }),
    aim:  PointerMovement({ scaleX: 0.05, scaleY: 0.05, invertY: true }),
  }
});
```
