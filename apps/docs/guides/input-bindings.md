# Guide: Input Bindings & Actions

Configure keyboard, mouse, and custom bindings with `@pulse-ts/input`, and consume them with hooks in Functional Nodes.

## Install service and providers

```ts
import { installInput, Axis1D, Axis2D, PointerMovement, PointerWheelScroll, Key, Chord, Sequence } from '@pulse-ts/input';

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
    zoom: PointerWheelScroll({ scale: 1.0 })
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

## Tips

- Set `preventDefault` to avoid scrolling/back/forward during gameplay.
- Enable `pointerLock` to capture mouse for FPS-style look.
- Use `Axis2D` for combined WASD vectors and `Axis1D` for single axes.
- Use `Chord` for simultaneous keys and `Sequence` for combos.
