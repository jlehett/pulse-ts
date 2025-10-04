[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / VirtualInput

# Class: VirtualInput

Defined in: packages/input/src/public/virtual.ts:15

Virtual input helper for tests and bots. Does not attach to DOM.

Example
```ts
import { VirtualInput } from '@pulse-ts/input';
const vi = new VirtualInput(service);
vi.press('jump');
vi.axis2D('move', { x: 1, y: 0 });
```

## Constructors

### Constructor

> **new VirtualInput**(`service`): `VirtualInput`

Defined in: packages/input/src/public/virtual.ts:16

#### Parameters

##### service

[`InputService`](InputService.md)

#### Returns

`VirtualInput`

## Methods

### axis2D()

> **axis2D**(`action`, `axes`): `void`

Defined in: packages/input/src/public/virtual.ts:41

Inject a axis 2D action.

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

### press()

> **press**(`action`, `sourceId`): `void`

Defined in: packages/input/src/public/virtual.ts:23

Press an action.

#### Parameters

##### action

`string`

The action to press.

##### sourceId

`string` = `'virt'`

#### Returns

`void`

***

### release()

> **release**(`action`, `sourceId`): `void`

Defined in: packages/input/src/public/virtual.ts:32

Release an action.

#### Parameters

##### action

`string`

The action to release.

##### sourceId

`string` = `'virt'`

The source ID.

#### Returns

`void`
