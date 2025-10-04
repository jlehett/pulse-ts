[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputService

# Class: InputService

Defined in: [packages/input/src/domain/services/Input.ts:48](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L48)

World-scoped input service: collects device events, applies bindings,
and exposes stable per-frame snapshots.

Commit pipeline order (per frame):
1) Providers update (poll)
2) Chords evaluated → digital sources updated
3) Sequence pulses applied (pressed for one frame)
4) Digital actions computed (keys/buttons/sequences/chords)
5) Axes1D from keys computed (e.g., WASD components)
6) Pointer vec2 accumulated and snapshotted
7) Wheel axis applied (auto-released next frame)
8) Pointer snapshot finalized (delta, wheel, buttons, locked)
9) Injected 1D axes applied and auto-released
10) Derived vec2 from 1D composed
11) Sequence pulses cleared

## Example

```ts
import { World } from '@pulse-ts/core';
import { InputService } from '@pulse-ts/input';
const world = new World();
const svc = world.provideService(new InputService({ preventDefault: true }));
svc.setBindings({ jump: { type: 'key', code: 'Space' } });
svc.handleKey('Space', true);
svc.commit();
console.log(svc.action('jump').pressed); // true
```

## Extends

- `Service`

## Constructors

### Constructor

> **new InputService**(`opts`): `InputService`

Defined in: [packages/input/src/domain/services/Input.ts:111](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L111)

#### Parameters

##### opts

[`InputOptions`](../type-aliases/InputOptions.md) = `{}`

#### Returns

`InputService`

#### Overrides

`Service.constructor`

## Properties

### actionEvent

> `readonly` **actionEvent**: `TypedEvent`\<[`ActionEvent`](../type-aliases/ActionEvent.md)\>

Defined in: [packages/input/src/domain/services/Input.ts:107](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L107)

Event fired when an action changes its pressed/released state during commit.
Useful for event-driven input handling.

#### Example

```ts
const svc = new InputService();
svc.setBindings({ jump: { type: 'key', code: 'Space' } });
const off = svc.actionEvent.on(({ name, state }) => {
  if (name === 'jump' && state.pressed) console.log('JUMP!');
});
// later: off();
```

***

### options

> `readonly` **options**: `Readonly`\<[`InputOptions`](../type-aliases/InputOptions.md)\>

Defined in: [packages/input/src/domain/services/Input.ts:51](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L51)

## Methods

### action()

> **action**(`name`): [`ActionState`](../type-aliases/ActionState.md)

Defined in: [packages/input/src/domain/services/Input.ts:328](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L328)

Get current `ActionState` for an action.

#### Parameters

##### name

`string`

Action name.

#### Returns

[`ActionState`](../type-aliases/ActionState.md)

The current state (default zeros if unknown).

***

### attach()

> **attach**(`world`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:122](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L122)

Attach the service to a world.

#### Parameters

##### world

`World`

The world to attach to.

#### Returns

`void`

#### Overrides

`Service.attach`

***

### axis()

> **axis**(`name`): `number`

Defined in: [packages/input/src/domain/services/Input.ts:345](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L345)

Get numeric axis value.

#### Parameters

##### name

`string`

Axis name.

#### Returns

`number`

Axis numeric value.

***

### commit()

> **commit**(): `void`

Defined in: [packages/input/src/domain/services/Input.ts:305](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L305)

Commit provider updates and compute per-frame snapshots.
Call once per frame (done automatically by `InputCommitSystem`).

#### Returns

`void`

***

### detach()

> **detach**(): `void`

Defined in: [packages/input/src/domain/services/Input.ts:131](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L131)

Detach the service from a world.

#### Returns

`void`

#### Overrides

`Service.detach`

***

### handleKey()

> **handleKey**(`code`, `down`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:195](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L195)

Handle a keyboard event.

#### Parameters

##### code

`string`

KeyboardEvent.code (e.g., `KeyW`, `Space`).

##### down

`boolean`

True on keydown, false on keyup.

#### Returns

`void`

***

### handlePointerButton()

> **handlePointerButton**(`button`, `down`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:220](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L220)

Handle a pointer button event.

#### Parameters

##### button

`number`

Button index (0,1,2,...).

##### down

`boolean`

True on down, false on up.

#### Returns

`void`

***

### handlePointerMove()

> **handlePointerMove**(`x`, `y`, `dx`, `dy`, `locked`, `buttons`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:235](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L235)

Handle a pointer movement.

#### Parameters

##### x

`number`

Client X.

##### y

`number`

Client Y.

##### dx

`number`

Delta X (movementX preferred when locked).

##### dy

`number`

Delta Y (movementY preferred when locked).

##### locked

`boolean`

Whether pointer lock is active.

##### buttons

`number`

Bitmask of currently held buttons.

#### Returns

`void`

***

### handleWheel()

> **handleWheel**(`dx`, `dy`, `dz`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:261](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L261)

Handle a wheel delta.

#### Parameters

##### dx

`number`

Wheel X delta.

##### dy

`number`

Wheel Y delta.

##### dz

`number`

Wheel Z delta.

#### Returns

`void`

***

### injectAxis1D()

> **injectAxis1D**(`action`, `value`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:296](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L296)

Inject a 1D axis value for this frame (virtual/testing input).
Subsequent calls in the same frame accumulate.

#### Parameters

##### action

`string`

Axis name.

##### value

`number`

Numeric value to add for this frame.

#### Returns

`void`

***

### injectAxis2D()

> **injectAxis2D**(`action`, `axes`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:282](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L282)

Inject an Axis2D per-frame delta (virtual/testing input).

#### Parameters

##### action

`string`

Axis2D action name.

##### axes

[`Vec`](../type-aliases/Vec.md)

Object with numeric components to accumulate this frame.

#### Returns

`void`

***

### injectDigital()

> **injectDigital**(`action`, `sourceId`, `down`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:273](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L273)

Inject a digital action (virtual/testing input). Adds/removes a source id.

#### Parameters

##### action

`string`

Action name.

##### sourceId

`string`

Stable source id (e.g., `virt:bot1`).

##### down

`boolean`

True to press, false to release.

#### Returns

`void`

***

### mergeBindings()

> **mergeBindings**(`b`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:186](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L186)

Merge (append/override) bindings into the current mapping.

#### Parameters

##### b

[`ExprBindings`](../type-aliases/ExprBindings.md)

Partial bindings to merge.

#### Returns

`void`

***

### pointerState()

> **pointerState**(): [`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

Defined in: [packages/input/src/domain/services/Input.ts:375](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L375)

Get the pointer snapshot for this frame.

#### Returns

[`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

Pointer snapshot.

***

### registerProvider()

> **registerProvider**(`p`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:144](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L144)

Register an input provider.

#### Parameters

##### p

[`InputProvider`](../interfaces/InputProvider.md)

Provider implementing `InputProvider`.

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [packages/input/src/domain/services/Input.ts:391](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L391)

Reset transient input state and snapshots.
Useful on level reload or between tests without replacing the service instance.

#### Returns

`void`

#### Example

```ts
const svc = new InputService();
// ...use input...
svc.reset();
// states return to defaults
```

***

### setBindings()

> **setBindings**(`b`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:178](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L178)

Replace existing bindings with the given expressions.

#### Parameters

##### b

[`ExprBindings`](../type-aliases/ExprBindings.md)

Map of action name to binding expression (or array).

#### Returns

`void`

***

### unregisterProvider()

> **unregisterProvider**(`p`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:163](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L163)

Unregister a previously registered input provider.
If attached, the provider is stopped and removed.

#### Parameters

##### p

[`InputProvider`](../interfaces/InputProvider.md)

Provider instance to remove.

#### Returns

`void`

#### Example

```ts
const kbd = new DOMKeyboardProvider(svc);
svc.registerProvider(kbd);
// later
svc.unregisterProvider(kbd);
```

***

### vec2()

> **vec2**(`name`): [`Vec`](../type-aliases/Vec.md)

Defined in: [packages/input/src/domain/services/Input.ts:354](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/services/Input.ts#L354)

Get 2D axis value object.

#### Parameters

##### name

`string`

Axis2D name.

#### Returns

[`Vec`](../type-aliases/Vec.md)

Record with axis component values.
