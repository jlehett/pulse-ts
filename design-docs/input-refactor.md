# @pulse-ts/input – Refactor Proposal

Author: Codex CLI
Status: Draft for review
Scope: packages/input

## Purpose

Make the input package easier to understand, maintain, and extend while preserving its small, function‑first public API. Tighten typing at public boundaries, improve internal structure readability, and ensure comprehensive tests and documentation.

## Current State (Summary)

- Public API
  - `installInput(world, opts)` convenience installer and DOM providers (keyboard, pointer)
  - `InputService` (world‑scoped): collects provider events, applies bindings, computes snapshots on `commit()`
  - `InputCommitSystem` (frame.early) calls `commit()` once per frame
  - Declarative bindings helpers: `Key`, `Axis1D`, `Axis2D`, `PointerMovement`, `PointerWheelScroll`, `PointerButton`, `Chord`, `Sequence`
  - Hooks: `useInput`, `useAction`, `useAxis1D`, `useAxis2D`, `usePointer`
  - Testing helper: `VirtualInput`

- Internal structure
  - Binding compilation in `BindingRegistry`
  - Internal helpers for state, sequences, pointer scaling, axis composition
  - Providers: DOM keyboard, DOM pointer, gamepad stub

- Tests: good coverage across service, bindings, providers, install, hooks, and virtual input
  - Notable strengths: sequence/chord logic, pointer deltas, wheel pulse lifetimes

## Problems / Opportunities

- `InputService.commit()` handles many responsibilities in one method; it’s correct but dense to read.
- Provider lifecycle lacks a way to unregister a provider after registration (useful for dynamic UIs/tests).
- Public boundary typing could be a touch stronger (e.g., `attach(world: any)` can be `attach(world: World)`).
- JSDoc is solid overall, but a few public entry points can benefit from compact runnable examples and clarifications (e.g., `actionEvent`, provider management).

## Goals

1) Clarity: split `commit()` logic into small named private methods without changing behavior.
2) Extensibility: add `unregisterProvider()` to allow provider removal/cleanup.
3) Type strength: align `attach(world: World)` signature with base class.
4) Documentation: expand JSDoc on key public surfaces with minimal examples; add “subscribing to action events” to guides.
5) Tests: add targeted tests for the new provider API and an event emission edge that isn’t explicitly covered.

## Non‑Goals

- No rework of the binding expression format.
- No new device mappings (gamepad remains a safe stub).
- No cross‑layer boundary changes (keep public/domain/infra layout).

## Proposed Changes

1) InputService refactor
   - Keep public API stable; no renames.
   - Extract the following from `commit()` into private helpers:
     - `commitChordStates(frameId)`
     - `commitSequencePulses(frameId)`
     - `commitDigitalActions(frameId)`
     - `commitAxes1DFromKeys(frameId)`
     - `commitPointerVec2()`
     - `commitWheel(frameId)`
     - `commitInjectedAxes1D(frameId)`
     - `commitDerivedVec2()`
     - `finalizeSequences()`
   - Change signature to `attach(world: World): void` and import `World` type from core public API.
   - Add `unregisterProvider(p: InputProvider): void` that calls `p.stop()` if attached and removes it from the list.
   - Improve JSDoc on key public methods to include compact examples (`setBindings`, `mergeBindings`, `action`, `axis`, `vec2`, `pointerState`, `registerProvider`, `unregisterProvider`, `actionEvent`).

2) Tests
   - New: `unregisterProvider` stops updates and prevents further effects.
   - New: `actionEvent` emits for Axis1D from key pairs when crossing 0 ↔ 1 boundaries.
   - Keep all existing tests green; no behavior changes intended.

3) Documentation
   - Guides: add a short “Subscribing to action events” section showing `actionEvent.on` usage.
   - Ensure new `unregisterProvider` is discoverable in API docs via JSDoc.

## Backward Compatibility

- No breaking runtime changes intended. `attach` type signature strengthens typing only.
- New method `unregisterProvider` is additive.

## Alternatives Considered

- Splitting `InputService` into multiple classes (e.g., separate “snapshot computer”). Rejected for now to keep user mental model simple; existing internal helpers plus method extraction should be sufficient.

## Implementation Plan

1) Refactor `InputService` commit path into private helpers; keep logic identical.
2) Add `unregisterProvider(p)` and tests.
3) Strengthen `attach(world: World)` typing.
4) JSDoc improvements on public methods and types (examples, param clarity).
5) Docs: update `apps/docs/guides/input-bindings.md` with action events snippet.
6) Verify: `npm test -w packages/input --silent` and `npm lint:fix`.

## Test Additions (Details)

- `InputService unregisterProvider`
  - Register a fake provider; commit increments; unregister; further commits don’t call `update` and no effects leak.
- `Axis1D event emission`
  - Bind Axis1D to a key; press → expect `pressed`; release → expect `released`.

## Rollout

- Land refactor + tests + doc updates in one PR for traceability.
- Note in PR description that this is a non‑breaking refactor with additive API.

