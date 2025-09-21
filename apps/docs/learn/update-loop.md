# Update Loop

Pulse separates simulation from rendering for consistency and responsiveness.

## Two kinds of updates

- **Fixed**: runs at a fixed timestep (default 60Hz). Use for physics, game logic, networking.
- **Frame**: runs once per rendered frame. Use for animation, UI, camera.

```ts
function Example() {
  useFixedUpdate((dt) => {
    // simulation
  });

  useFrameUpdate((dt) => {
    // visuals
  });
}
```

## Phases

Each kind has Early → Update → Late. Use Early for input/prep, Late for post-processing.

## Timing

- Hook `dt` values are in seconds.
- World config like `fixedStepMs` is in milliseconds.

### Control

- `pause()` / `resume()` stop and start stepping without tearing down state.
- `setTimeScale(f)` scales both frame and fixed time (e.g., slow-mo).

