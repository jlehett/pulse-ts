# Input Package Refactor: Pointer Button Binding + Clarity

Status: Draft
Owner: input package
Date: 2025-10-04

## Goals

- Improve clarity and completeness of the input binding model.
- Add a first-class binding for pointer/mouse buttons.
- Reduce duplication in `InputService.commit()` while keeping logic explicit.
- Raise test coverage with focused, fast unit tests.
- Update guides/JSDoc to reflect the public API.

## Current State

- Keyboard, Axis1D/Axis2D, pointer movement, wheel, chords, and sequences are supported and tested.
- `InputService` already supports pointer button events (`handlePointerButton`) and `BindingRegistry` has a `buttonBindings` map, but there is no public binding expression or compiler path to populate it.
- `commit()` repeats the same ActionState transition logic across digital, axis1d, and wheel.

## Proposed Changes

1) Public binding for pointer buttons
   - Add `PointerButtonBinding` type and an `expr` helper `PointerButton(button: number)`.
   - Compiler: extend `BindingRegistry` to compile this into `buttonBindings` so `handlePointerButton()` works end-to-end.
   - JSDoc and examples for the helper and type.

2) Small `InputService` clarity refactor
   - Extract a small helper `computeState(prev, nextValue, frameId)` to unify transition logic for analog/digital values.
   - No functional behavior changes.

3) Tests
   - Registry compiles `PointerButton` → `getActionsForButton`.
   - `InputService` responds to pointer button down/up (`pressed`/`released`).
   - `VirtualInput` basic press/release and `axis2D` injection.
   - `GamepadProvider.update()` no-op safety test (stub remains minimal).

4) Docs
   - Expand the guide with a pointer button example.
   - Ensure JSDoc examples for new helper and affected APIs.

## Out of Scope

- Gamepad input mapping and bindings (kept as stub).
- Gesture/multi-touch specifics.

## Trade-offs

- Keeping `BindingRegistry` simple and explicit avoids over-general abstraction but duplicates a small amount of field wiring.
- The `computeState` helper centralizes pressed/released transitions without hiding logic.

## Migration

- No breaking changes. New helper is additive.

## Verification

- `npm test -w packages/input --silent` passes.
- `npm lint:fix -w packages/input` produces no warnings.
- Examples in docs compile in TypeScript snippets.

