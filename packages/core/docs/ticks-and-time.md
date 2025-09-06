# Ticks & Time

This page summarizes the update model and practical interpolation tips.

## Update kinds and phases

- Kinds: `fixed` (constant timestep) and `frame` (variable per rendered frame).
- Phases: `early`, `update`, `late` in that order.

Fixed steps may execute multiple times in a single frame to catch up (capped by `maxFixedStepsPerFrame`). Between fixed steps, the engine computes an ambient alpha exposed by `world.getAmbientAlpha()` during frame updates.

## Registering work

Use FC hooks for convenience, or register programmatically via `world.registerTick(node, kind, phase, fn, order?)`.

Lower `order` runs earlier within a phase; newly registered ticks are appended to run starting the next frame for stability.

## Interpolation with Transform

Before each fixed step, the world snapshots every transform's previous local TRS. You can query interpolated TRS for visuals:

```ts
const t = attachComponent(node, Transform);
// frame pass
const alpha = world.getAmbientAlpha();
const trs = t.getWorldTRS(undefined, alpha);
```

When `alpha` is `0`, world TRS queries are cached using ancestry/local versioning to avoid recomposition unless needed.

## Time scaling and pausing

```ts
world.setTimeScale(0.25); // quarter speed
world.pause();
world.resume();
```


