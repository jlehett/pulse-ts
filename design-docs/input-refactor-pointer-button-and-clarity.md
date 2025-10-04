# Input Refactor: Pointer, Button, and Clarity

Status: Proposal (seeking feedback)

Owners: input package maintainers

Last updated: 2025-10-04

## Purpose

Make `@pulse-ts/input` easier to understand, maintain, and extend while keeping the public API small and function‑first. This proposal focuses on clarity around pointer and button semantics, minor ergonomics, and internal structure. It keeps behavior familiar and adds a small capability.

## Goals

- Clarify pointer and button behavior and defaults.
- Keep the public surface small and JSDoc‑documented with runnable examples.
- Maintain fast, deterministic tests with high coverage.
- Improve internal structure to make responsibilities obvious and files focused.
- Add a small capability for broader use‑cases without complicating the API.

## Non‑Goals

- Full gamepad mapping support (keep the current stub; out of scope).
- Input rebinding UI or persistence.
- Complex state machines for combos beyond current `Chord` and `Sequence`.

## Current State (summary)

- Layers OK: public API (install, hooks, factories) → domain (service, registry) → infra (DOM providers).
- Public API is function‑first and fairly small.
- JSDoc coverage is good; guides exist. Some doc wording on defaults is misleading.
- `InputService` is a single large file handling:
  - digital actions aggregation (keys, buttons, chords, sequences)
  - axes (1D from keys, 2D compose, pointer deltas, wheel)
  - per‑frame commit and snapshots
- `BindingRegistry` compiles expressions into lookup tables. Pointer movement is limited to a single action internally (`pointerMoveAction?: string`).

## Problems and Opportunities

1) Defaults clarity
   - JSDoc for `InputOptions.preventDefault` and `pointerLock` mentions defaults=true, but `installInput` currently treats them as false unless provided.

2) Pointer movement limitation
   - Only a single action can be bound to pointer movement. Many games separate “look” vs. “aim/look-slow” or expose alternate bindings (e.g., different sensitivity). Supporting multiple actions broadens use‑cases with low complexity.

3) Internal structure
   - `InputService` mixes several responsibilities. Splitting pointer and sequence helpers into small, private modules improves readability without changing the public API.

4) Test ergonomics
   - `VirtualInput` lacks a simple 1D axis helper; adding `axis1D(name, value)` improves tests and bots.

## Proposed Changes

1) Documented defaults (no behavior change)
   - Clarify in JSDoc: `preventDefault` and `pointerLock` default to false in `installInput` (recommend explicitly setting them in examples). Ensure guides reflect this.

2) Multiple PointerMovement actions (minor capability)
   - Change `BindingRegistry` to store a list of pointer‑movement actions instead of a single one.
   - In `InputService.commit()`, apply pointer deltas to all bound actions, honoring each action’s invert/scale modifiers.
   - Public API unchanged. Existing configs with a single `PointerMovement(...)` keep working.

3) Internal code organization (no API change)
   - Extract small private helpers from `InputService` into `domain/services/internal/` (e.g., `computeState.ts`, `sequence.ts`, `pointer.ts`) to reduce file size and make intent clear. Keep imports private to the service.

4) Virtual input ergonomics (minor addition)
   - Add `VirtualInput.axis1D(name: string, value: number)` as a thin wrapper around `InputService.injectDigital`/`computeState` via `injectAxis2D` parity.

## Public API Impact

- Backward compatible for existing consumers.
- New ability: multiple `PointerMovement(...)` bindings; values are accumulated into separate vec2 actions per binding.
- New method on `VirtualInput`: `axis1D(name, value)`.
- JSDoc corrected to state defaults are false unless explicitly set in `installInput`.

## Migration

- No required migration for existing users.
- Optional: projects relying on pointer movement can add a second action if desired.

## Tests

- Add tests:
  - BindingRegistry: compiles multiple pointer movement actions with distinct modifiers.
  - InputService: pointer deltas apply to all pointer movement actions.
  - VirtualInput: `axis1D` sets numeric axis for a frame.
- Keep existing tests unchanged; all should continue to pass.

## Documentation

- Update JSDoc for `InputOptions` to correct defaults.
- Guides: explicitly set `preventDefault` and `pointerLock` in examples; add a short note that defaults are false.
- API docs will pick up the JSDoc changes via Typedoc.
- Add a short “Multiple pointer movement bindings” section in the input bindings guide with a tiny code sample.

## Alternatives Considered

- Keep single pointer movement action: simplest but limits flexibility. The change to multiple is small and contained.
- Broader decomposition (splitting `InputService` into multiple classes): rejected for now to avoid fragmentation of the public concept; lightweight internal helpers are enough.

## Open Questions

- Do we want throttling or smoothing for pointer deltas in the service? (Out of scope here; leave to consumers.)
- Any need to support absolute pointer position as an axis action? (Currently provided via `usePointer()` snapshot.)

## Plan & Sequencing

1) Correct JSDoc defaults (types.ts) and guides text.
2) Implement multiple pointer‑movement bindings in registry + service with tests.
3) Add `VirtualInput.axis1D` + tests.
4) Factor small internal helpers to reduce `InputService` size (no behavior change).
5) Run lint and tests for the package, update docs as needed.

Please review the scope and decisions, especially (2). If agreeable, I’ll implement in a focused PR and update tests and docs accordingly.

