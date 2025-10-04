# [packages/input] Refactor Proposal (vNext)

Author: Codex CLI
Status: Draft – seeking feedback

## Purpose

Make the input package easier to understand, maintain, and extend without widening the public API surface. Keep the mental model simple, preserve the layer boundaries, and ensure comprehensive tests and docs.

## Goals

- Clarity: small, named, single-purpose helpers; explicit data flow.
- Maintainability: reduce incidental coupling; tighten types at boundaries.
- Extensibility: make it easy to add new binding kinds/providers (e.g., gamepad) later.
- Quality: high‑coverage tests, up‑to‑date JSDoc and guides.

## Non‑Goals

- Implement full gamepad mapping or new binding kinds in this pass.
- Introduce breaking public API changes to end users. Minor internal renames are OK.

## Current Architecture (summary)

- public/
  - install.ts: convenience installer that wires providers + commit system
  - hooks.ts: function‑first read accessors for actions/axes/pointer
  - virtual.ts: testing/bot helper (injects virtual input)
- domain/
  - bindings/: types, expression builders (Key/Axis/Pointer/Chord/Sequence), registry compiler
  - services/Input.ts: world‑scoped stateful input service
  - systems/commit.ts: runs commit at frame.early
  - services/internal/: pure helpers (state, sequence, pointer, axes, chords)
- infra/providers/: DOM keyboard/pointer and a stub gamepad poller

This layering largely matches our repo standards. Tests cover most features and the docs include a user guide plus API pages.

## Pain Points / Opportunities

- InputService is clear, but still carries multiple concerns (digital, axes, pointer, chords/sequences). It already uses internal helpers; a little more structure + naming can improve readability.
- Some internal types live in helpers (e.g., pointer vec2 modifiers). Co‑locating these types with bindings would make intent clearer.
- No way to reset state on level reload/tests without re‑creating the service.
- Action event payload type isn’t exported as a named alias.

## Proposed Changes

1) InputService ergonomics
- Add `reset()` to clear transient accumulators and action state without replacing the service instance.
- Add a tiny `getFrameId()` private helper to centralize world frame access.

2) Type clarity at the bindings boundary
- Promote `PointerVec2Modifiers` to `bindings/types.ts` as `PointerVec2Modifiers` so both the registry and service refer to the same explicit shape.
- Export `ActionEvent` type alias: `{ name: string; state: ActionState }`.

3) Internal organization & naming (no behavior changes)
- Keep `commit*` methods, but document the commit pipeline order in InputService JSDoc so contributors can reason about pulses (wheel, sequences) and derived states (vec2 from 1D) at a glance.
- Minor variable name cleanups (`axis1Accum` → `axis1AccumFrame`, etc.) where they improve immediate comprehension.

4) Tests
- Add tests for `reset()` to ensure all relevant maps/sets and snapshots return to neutral.
- Add a test that validates commit pipeline order: wheel produces a press, then auto‑release next frame.
- Keep existing tests intact; update only if names/exports move.

5) Docs
- JSDoc: ensure all exported symbols have examples (ActionEvent, reset()).
- Guides: add a small “Resetting input state” section and explicitly document the commit pipeline and typical usage (call once per frame at `frame.early`).

## Public API Impact

- Additions only:
  - `InputService.reset()`
  - `export type ActionEvent = { name: string; state: ActionState }`
  - `export type PointerVec2Modifiers` (moved from internal helper to bindings types)

No breaking changes proposed for this pass.

## Implementation Plan

1. Move `PointerVec2Modifiers` type to `bindings/types.ts`; update imports.
2. Add `ActionEvent` type alias and export from public index.
3. Add `reset()` and `getFrameId()` to `InputService`; tighten JSDoc and clarify the commit pipeline order in class doc.
4. Variable naming cleanups where they materially improve clarity (scoped).
5. Tests: add reset() tests and a commit‑order test (wheel press→release cadence).
6. Docs:
   - Update JSDoc examples for new exports.
   - Update guides with a “Resetting state” tip and pipeline paragraph.

## Open Questions

- Do we want to also rename internal members (e.g., `axis1Accum` → `axis1AccumFrame`) in this pass, or keep diffs minimal and only introduce `reset()` and the moved types?
- Is exporting the `InputService` class still desired long‑term, or should we steer folks to function‑first setup via `installInput` and keep the class as a power‑user escape hatch?

## Rollout & Verification

- Run `npm test -w packages/input --silent` locally.
- Lint: `npm lint:fix` in the package.
- Verify docs build: `npm run docs` at repo root (if configured) and spot‑check updated pages.

