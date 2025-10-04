[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputService

# Class: InputService

Defined in: [packages/input/src/domain/services/Input.ts:28](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L28)

World-scoped input service: collects device events, applies bindings,
and exposes stable per-frame snapshots.

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

Defined in: [packages/input/src/domain/services/Input.ts:74](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L74)

#### Parameters

##### opts

[`InputOptions`](../type-aliases/InputOptions.md) = `{}`

#### Returns

`InputService`

#### Overrides

`Service.constructor`

## Properties

### actionEvent

> `readonly` **actionEvent**: `TypedEvent`\<\{ `name`: `string`; `state`: [`ActionState`](../type-aliases/ActionState.md); \}\>

Defined in: [packages/input/src/domain/services/Input.ts:67](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L67)

***

### options

> `readonly` **options**: `Readonly`\<[`InputOptions`](../type-aliases/InputOptions.md)\>

Defined in: [packages/input/src/domain/services/Input.ts:31](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L31)

## Methods

### action()

> **action**(`name`): [`ActionState`](../type-aliases/ActionState.md)

Defined in: [packages/input/src/domain/services/Input.ts:368](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L368)

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

Defined in: [packages/input/src/domain/services/Input.ts:85](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L85)

Attach the service to a world.

#### Parameters

##### world

`any`

The world to attach to.

#### Returns

`void`

#### Overrides

`Service.attach`

***

### axis()

> **axis**(`name`): `number`

Defined in: [packages/input/src/domain/services/Input.ts:385](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L385)

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

Defined in: [packages/input/src/domain/services/Input.ts:233](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L233)

Commit provider updates and compute per-frame snapshots.
Call once per frame (done automatically by `InputCommitSystem`).

#### Returns

`void`

***

### detach()

> **detach**(): `void`

Defined in: [packages/input/src/domain/services/Input.ts:94](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L94)

Detach the service from a world.

#### Returns

`void`

#### Overrides

`Service.detach`

***

### handleKey()

> **handleKey**(`code`, `down`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:134](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L134)

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

Defined in: [packages/input/src/domain/services/Input.ts:152](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L152)

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

Defined in: [packages/input/src/domain/services/Input.ts:167](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L167)

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

Defined in: [packages/input/src/domain/services/Input.ts:200](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L200)

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

### injectAxis2D()

> **injectAxis2D**(`action`, `axes`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:221](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L221)

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

Defined in: [packages/input/src/domain/services/Input.ts:212](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L212)

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

Defined in: [packages/input/src/domain/services/Input.ts:125](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L125)

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

Defined in: [packages/input/src/domain/services/Input.ts:415](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L415)

Get the pointer snapshot for this frame.

#### Returns

[`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

Pointer snapshot.

***

### registerProvider()

> **registerProvider**(`p`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:107](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L107)

Register an input provider.

#### Parameters

##### p

[`InputProvider`](../interfaces/InputProvider.md)

Provider implementing `InputProvider`.

#### Returns

`void`

***

### setBindings()

> **setBindings**(`b`): `void`

Defined in: [packages/input/src/domain/services/Input.ts:117](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L117)

Replace existing bindings with the given expressions.

#### Parameters

##### b

[`ExprBindings`](../type-aliases/ExprBindings.md)

Map of action name to binding expression (or array).

#### Returns

`void`

***

### vec2()

> **vec2**(`name`): [`Vec`](../type-aliases/Vec.md)

Defined in: [packages/input/src/domain/services/Input.ts:394](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/domain/services/Input.ts#L394)

Get 2D axis value object.

#### Parameters

##### name

`string`

Axis2D name.

#### Returns

[`Vec`](../type-aliases/Vec.md)

Record with axis component values.
