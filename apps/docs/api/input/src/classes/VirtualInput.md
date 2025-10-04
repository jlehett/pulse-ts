[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / VirtualInput

# Class: VirtualInput

Defined in: [packages/input/src/public/virtual.ts:15](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/public/virtual.ts#L15)

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

Defined in: [packages/input/src/public/virtual.ts:16](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/public/virtual.ts#L16)

#### Parameters

##### service

[`InputService`](InputService.md)

#### Returns

`VirtualInput`

## Methods

### axis2D()

> **axis2D**(`action`, `axes`): `void`

Defined in: [packages/input/src/public/virtual.ts:41](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/public/virtual.ts#L41)

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

Defined in: [packages/input/src/public/virtual.ts:23](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/public/virtual.ts#L23)

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

Defined in: [packages/input/src/public/virtual.ts:32](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/public/virtual.ts#L32)

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
