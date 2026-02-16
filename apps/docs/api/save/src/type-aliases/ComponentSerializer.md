[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [save/src](../README.md) / ComponentSerializer

# Type Alias: ComponentSerializer\<T\>

> **ComponentSerializer**\<`T`\> = `object`

Defined in: packages/save/src/public/types.ts:48

A serializer for a component.

## Example

```ts
import { registerComponentSerializer } from '@pulse-ts/save';
import { Component, attachComponent } from '@pulse-ts/core';
class Health extends Component { constructor(public hp = 100) { super(); } }
registerComponentSerializer(Health, {
  id: 'game:health',
  serialize(_owner, h) { return { hp: h.hp }; },
  deserialize(owner, data: any) { attachComponent(owner, Health).hp = Number(data?.hp ?? 0); },
});
```

## Type Parameters

### T

`T` *extends* `Component`

## Properties

### id

> **id**: `string`

Defined in: packages/save/src/public/types.ts:50

Stable identifier for this component type in save files.

## Methods

### deserialize()

> **deserialize**(`owner`, `data`): `void`

Defined in: packages/save/src/public/types.ts:57

Apply the serialized data back onto the component.

#### Parameters

##### owner

`Node`

##### data

`unknown`

#### Returns

`void`

***

### serialize()

> **serialize**(`owner`, `comp`): `unknown`

Defined in: packages/save/src/public/types.ts:55

Serialize the component into JSON-safe data.
Return undefined to skip writing this component.

#### Parameters

##### owner

`Node`

##### comp

`T`

#### Returns

`unknown`
