---
paths:
  - "packages/input/src/domain/services/Input.ts"
---
# InputService Commit Pipeline Ordering

## Critical Ordering Constraint

The input commit pipeline runs in a **fixed order** that determines priority and effectiveness for vec2 actions (bound via `Axis2D()`):

1. **`commitAxes1DFromKeys`** — Derives binary -1/0/+1 from key state for internal 1D sub-axes
   Named: `__axis:{actionName}:{componentKey}` (e.g., `__axis:p1Move:x`)

2. **`commitPointerVec2`** — Snapshots accumulated pointer movement (`vec2AccumFrame` → `vec2State`), clears accum

3. **`commitInjectedAxes1D`** — Overwrites key-derived 1D values with explicitly injected 1D values
   This runs **after** key derivation but **before** vec2 composition

4. **`commitDerivedVec2`** — Composes 1D sub-axes into vec2 state
   **Unconditionally overwrites** any prior `vec2State` — injection via `injectAxis2D()` does not work here

5. **`applyVec2Holds`** — Applies persistent `holdAxis2D` overrides
   Runs **last** and takes final priority (e.g., virtual joystick support)

## API Implications

- **`injectAxis2D('p1Move', ...)`** does NOT override vec2 actions with Axis2D bindings — `commitDerivedVec2` always rewrites the injected value
- **`injectAxis1D('__axis:p1Move:x', ...)`** works but couples to private naming convention (`__axis:${actionName}:${componentKey}`)
- **`holdAxis2D('p1Move', ...)`** is the correct API for persistent analog overrides — guaranteed to take priority

## Naming Convention

Internal 1D sub-axis names are set in `BindingRegistry.addAxis2D()`:

```
__axis:${actionName}:${componentKey}
```

Example: action `p1Move` bound with `Axis2D()` creates `__axis:p1Move:x` and `__axis:p1Move:y`.

## Do Not Reorder

The stages depend on this order. Reordering requires careful analysis of hold logic and pointer state.
