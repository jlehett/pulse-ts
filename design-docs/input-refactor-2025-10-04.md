# Input Package Refactor (2025-10-04)

Purpose
- Make `@pulse-ts/input` easy to understand, maintain, and extend.
- Ensure comprehensive automated tests and JSDoc-driven documentation.
- Align structure with repo’s layered architecture and public API principles.

Out of Scope (for this pass)
- Full gamepad mapping and deadzone curves (keep minimal stub).
- Gesture recognition and touch multi-pointer abstractions.
- Breaking changes to core world/service lifecycle semantics.

Current State (summary)
- Structure: `bindings/`, `providers/`, `services/`, `systems/`, `fc/`, `index.ts`.
- InputService aggregates devices, binding registry compiles declarative bindings; DOM providers for keyboard, pointer; `VirtualInput` helper.
- Public API: index re-exports install, service/system, hooks, binding factories, and types.
- Tests: none in `packages/input`.
- Docs: a guide for bindings; typedoc configured but JSDoc examples are sparse.

Problems
- No automated tests → risk of regressions when extending providers/bindings.
- JSDoc lacks runnable examples to mirror in docs.
- Directory structure not fully following layered convention; public boundary not explicit.
- `VirtualInput` used via deep import (`@pulse-ts/input/providers/virtual`) → brittle public surface.

Goals and Non-Goals
- Goal: Clarify architecture and file layout using layered structure.
- Goal: Small, clear public API with function-first helpers; everything exported has JSDoc + example.
- Goal: High-confidence test suite covering bindings compilation, service commit semantics, DOM providers wiring, and hooks.
- Non-goal: New features (gestures, full gamepad), or API breakage beyond export path cleanup.

Proposed Structure
- `src/public/` (top layer)
  - `install.ts` (installer)
  - `hooks.ts` (FC hooks)
  - `index.ts` (re-exports)
  - `virtual.ts` (VirtualInput; exported for tests/bots)
- `src/domain/` (core logic)
  - `bindings/` → `types.ts`, `expr.ts`, `registry.ts`
  - `services/Input.ts`
  - `systems/commit.ts`
- `src/infra/` (adapters/IO)
  - `providers/domKeyboard.ts`
  - `providers/domPointer.ts`
  - `providers/gamepad.ts` (stub)

Public API (unchanged symbols; cleaner paths)
- Factories: `Key`, `Axis1D`, `Axis2D`, `PointerMovement`, `PointerWheelScroll`, `Chord`, `Sequence`.
- Service/System: `InputService`, `InputCommitSystem`.
- Installer + Hooks: `installInput`, `useInput`, `useAction`, `useAxis1D`, `useAxis2D`, `usePointer`.
- Types: `ActionState`, `Vec`, `PointerSnapshot`, `InputOptions`, `InputProvider`.
- New: `VirtualInput` exported from root to avoid deep import.

Testing Plan (colocated, fast, deterministic)
- `domain/bindings/registry.test.ts`:
  - Compiles key, axis1d, axis2d, pointerMove (modifiers), wheel, chord, sequence; validate getters.
- `domain/services/Input.test.ts`:
  - Digital press/hold/release; axis1d and axis2d from key pairs; pointer movement and wheel mapping; chords and sequences; per-frame reset; `actionEvent` emissions; `VirtualInput` injection.
- `infra/providers/domKeyboard.test.ts` and `infra/providers/domPointer.test.ts`:
  - Stub `EventTarget` to dispatch minimal events and assert service receives translated calls.
- `public/install.test.ts` and `public/hooks.test.ts`:
  - `installInput` registers service/system and providers when target present.
  - Hooks read back values inside a mounted FC using `@pulse-ts/core` world.

Documentation Plan
- Add JSDoc with runnable examples to all exported symbols.
- Update `apps/docs/guides/input-bindings.md` to import `VirtualInput` from `@pulse-ts/input` (no deep import) and ensure code matches JSDoc examples.
- Rely on Typedoc to generate `apps/docs/api/input/src/*` entries from public exports.

Migration/Compatibility
- No runtime behavior changes intended; index re-exports preserve symbol names.
- Export `VirtualInput` at package root; update docs accordingly. Deep import still works via re-export shim if necessary (optional).

Risks
- Path refactor can cause brittle import mistakes → mitigated by colocated tests and running lint/typecheck.
- DOM tests in JSDOM: wheel/pointer events differ across environments → use controlled stubs for EventTarget to avoid reliance on browser quirks.

Acceptance Criteria
- All tests pass: `npm test -w packages/input --silent`.
- Lint/typecheck clean: `npm lint:fix` in repo root.
- JSDoc examples compile and mirror in `apps/docs/guides`.

Open Questions
- Should we expose a `GamepadProvider` registration helper publicly now or keep it internal until mapping story is defined?
- Do we want a `testing` subpath export for `VirtualInput` instead of root?

