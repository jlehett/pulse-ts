[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputService

# Class: InputService

Defined in: packages/input/src/domain/services/Input.ts:27

World-scoped input service: collects device events, applies bindings, and exposes stable per-frame snapshots.

Example
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

Defined in: packages/input/src/domain/services/Input.ts:73

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

Defined in: packages/input/src/domain/services/Input.ts:66

***

### options

> `readonly` **options**: `Readonly`\<[`InputOptions`](../type-aliases/InputOptions.md)\>

Defined in: packages/input/src/domain/services/Input.ts:30

## Methods

### action()

> **action**(`name`): [`ActionState`](../type-aliases/ActionState.md)

Defined in: packages/input/src/domain/services/Input.ts:366

Get the action state for a given action name.

#### Parameters

##### name

`string`

The name of the action.

#### Returns

[`ActionState`](../type-aliases/ActionState.md)

The action state.

***

### attach()

> **attach**(`world`): `void`

Defined in: packages/input/src/domain/services/Input.ts:84

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

Defined in: packages/input/src/domain/services/Input.ts:383

Get the axis state for a given axis name.

#### Parameters

##### name

`string`

The name of the axis.

#### Returns

`number`

The axis state.

***

### commit()

> **commit**(): `void`

Defined in: packages/input/src/domain/services/Input.ts:231

Commit the input.

#### Returns

`void`

***

### detach()

> **detach**(): `void`

Defined in: packages/input/src/domain/services/Input.ts:93

Detach the service from a world.

#### Returns

`void`

#### Overrides

`Service.detach`

***

### handleKey()

> **handleKey**(`code`, `down`): `void`

Defined in: packages/input/src/domain/services/Input.ts:133

Handle a key.

#### Parameters

##### code

`string`

The code of the key.

##### down

`boolean`

Whether the key is down.

#### Returns

`void`

***

### handlePointerButton()

> **handlePointerButton**(`button`, `down`): `void`

Defined in: packages/input/src/domain/services/Input.ts:151

Handle a pointer button.

#### Parameters

##### button

`number`

The button to handle.

##### down

`boolean`

Whether the button is down.

#### Returns

`void`

***

### handlePointerMove()

> **handlePointerMove**(`x`, `y`, `dx`, `dy`, `locked`, `buttons`): `void`

Defined in: packages/input/src/domain/services/Input.ts:166

Handle a pointer move.

#### Parameters

##### x

`number`

The x coordinate.

##### y

`number`

The y coordinate.

##### dx

`number`

The x delta.

##### dy

`number`

The y delta.

##### locked

`boolean`

Whether the pointer is locked.

##### buttons

`number`

The buttons.

#### Returns

`void`

***

### handleWheel()

> **handleWheel**(`dx`, `dy`, `dz`): `void`

Defined in: packages/input/src/domain/services/Input.ts:199

Handle a wheel.

#### Parameters

##### dx

`number`

The x delta.

##### dy

`number`

The y delta.

##### dz

`number`

The z delta.

#### Returns

`void`

***

### injectAxis2D()

> **injectAxis2D**(`action`, `axes`): `void`

Defined in: packages/input/src/domain/services/Input.ts:220

Inject an axis 2D action (per-frame delta).

#### Parameters

##### action

`string`

The action to inject.

##### axes

[`Vec`](../type-aliases/Vec.md)

The axes to inject.

#### Returns

`void`

***

### injectDigital()

> **injectDigital**(`action`, `sourceId`, `down`): `void`

Defined in: packages/input/src/domain/services/Input.ts:211

Inject a digital action.

#### Parameters

##### action

`string`

The action to inject.

##### sourceId

`string`

The source ID.

##### down

`boolean`

Whether the action is down.

#### Returns

`void`

***

### mergeBindings()

> **mergeBindings**(`b`): `void`

Defined in: packages/input/src/domain/services/Input.ts:124

Merge the bindings.

#### Parameters

##### b

[`ExprBindings`](../type-aliases/ExprBindings.md)

The bindings to merge.

#### Returns

`void`

***

### pointerState()

> **pointerState**(): [`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

Defined in: packages/input/src/domain/services/Input.ts:413

Get the pointer state.

#### Returns

[`PointerSnapshot`](../type-aliases/PointerSnapshot.md)

The pointer state.

***

### registerProvider()

> **registerProvider**(`p`): `void`

Defined in: packages/input/src/domain/services/Input.ts:106

Register a provider.

#### Parameters

##### p

[`InputProvider`](../interfaces/InputProvider.md)

The provider to register.

#### Returns

`void`

***

### setBindings()

> **setBindings**(`b`): `void`

Defined in: packages/input/src/domain/services/Input.ts:116

Set the bindings.

#### Parameters

##### b

[`ExprBindings`](../type-aliases/ExprBindings.md)

The bindings to set.

#### Returns

`void`

***

### vec2()

> **vec2**(`name`): [`Vec`](../type-aliases/Vec.md)

Defined in: packages/input/src/domain/services/Input.ts:392

Get the axis 2D state for a given axis 2D name.

#### Parameters

##### name

`string`

The name of the axis 2D.

#### Returns

[`Vec`](../type-aliases/Vec.md)

The axis 2D state.
