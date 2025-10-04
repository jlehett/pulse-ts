[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / VirtualInput

# Class: VirtualInput

Defined in: [packages/input/src/public/virtual.ts:15](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/public/virtual.ts#L15)

Virtual input helper for tests and bots. Does not attach to DOM.

## Example

```ts
import { VirtualInput } from '@pulse-ts/input';
const vi = new VirtualInput(service);
vi.press('jump');
vi.axis2D('move', { x: 1, y: 0 });
```

## Constructors

### Constructor

> **new VirtualInput**(`service`): `VirtualInput`

Defined in: [packages/input/src/public/virtual.ts:30](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/public/virtual.ts#L30)

Create a virtual input injector bound to an `InputService`.

#### Parameters

##### service

[`InputService`](InputService.md)

The target input service to inject into.

#### Returns

`VirtualInput`

#### Example

```ts
import { InputService, VirtualInput } from '@pulse-ts/input';
const svc = new InputService();
const vi = new VirtualInput(svc);
vi.press('jump');
svc.commit();
console.log(svc.action('jump').pressed); // true
```

## Methods

### axis1D()

> **axis1D**(`action`, `value`): `void`

Defined in: [packages/input/src/public/virtual.ts:64](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/public/virtual.ts#L64)

Inject a per-frame 1D axis value.

#### Parameters

##### action

`string`

Axis name.

##### value

`number`

Numeric value to add this frame.

#### Returns

`void`

***

### axis2D()

> **axis2D**(`action`, `axes`): `void`

Defined in: [packages/input/src/public/virtual.ts:55](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/public/virtual.ts#L55)

Inject per-frame 2D axis deltas.

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

### press()

> **press**(`action`, `sourceId`): `void`

Defined in: [packages/input/src/public/virtual.ts:37](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/public/virtual.ts#L37)

Press an action.

#### Parameters

##### action

`string`

Action name.

##### sourceId

`string` = `'virt'`

Optional virtual source id for debugging.

#### Returns

`void`

***

### release()

> **release**(`action`, `sourceId`): `void`

Defined in: [packages/input/src/public/virtual.ts:46](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/public/virtual.ts#L46)

Release an action.

#### Parameters

##### action

`string`

Action name.

##### sourceId

`string` = `'virt'`

Optional virtual source id used in press().

#### Returns

`void`
