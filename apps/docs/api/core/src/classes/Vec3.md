[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Vec3

# Class: Vec3

Defined in: [packages/core/src/utils/math/vec3.ts:4](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L4)

A 3-dimensional vector.

## Constructors

### Constructor

> **new Vec3**(`x`, `y`, `z`): `Vec3`

Defined in: [packages/core/src/utils/math/vec3.ts:5](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L5)

#### Parameters

##### x

`number` = `0`

##### y

`number` = `0`

##### z

`number` = `0`

#### Returns

`Vec3`

## Properties

### x

> **x**: `number` = `0`

Defined in: [packages/core/src/utils/math/vec3.ts:6](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L6)

***

### y

> **y**: `number` = `0`

Defined in: [packages/core/src/utils/math/vec3.ts:7](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L7)

***

### z

> **z**: `number` = `0`

Defined in: [packages/core/src/utils/math/vec3.ts:8](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L8)

## Methods

### addScaled()

> **addScaled**(`v`, `s`): `this`

Defined in: [packages/core/src/utils/math/vec3.ts:52](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L52)

Adds a scaled vector to the vector.

#### Parameters

##### v

`Vec3`

##### s

`number`

#### Returns

`this`

***

### clone()

> **clone**(): `Vec3`

Defined in: [packages/core/src/utils/math/vec3.ts:14](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L14)

Returns a clone of the vector.

#### Returns

`Vec3`

***

### copy()

> **copy**(`v`): `this`

Defined in: [packages/core/src/utils/math/vec3.ts:42](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L42)

Copies the values of the given vector.

#### Parameters

##### v

`Vec3`

#### Returns

`this`

***

### multiply()

> **multiply**(`v`): `this`

Defined in: [packages/core/src/utils/math/vec3.ts:62](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L62)

Multiplies the vector by the given vector.

#### Parameters

##### v

`Vec3`

#### Returns

`this`

***

### normalize()

> **normalize**(): `this`

Defined in: [packages/core/src/utils/math/vec3.ts:31](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L31)

Normalizes the vector.

#### Returns

`this`

***

### set()

> **set**(`x`, `y`, `z`): `this`

Defined in: [packages/core/src/utils/math/vec3.ts:21](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L21)

Sets the vector to the given values.

#### Parameters

##### x

`number`

##### y

`number`

##### z

`number`

#### Returns

`this`

***

### lerp()

> `static` **lerp**(`a`, `b`, `t`): `Vec3`

Defined in: [packages/core/src/utils/math/vec3.ts:72](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L72)

Linearly interpolates between two vectors.

#### Parameters

##### a

`Vec3`

##### b

`Vec3`

##### t

`number`

#### Returns

`Vec3`

***

### lerpInto()

> `static` **lerpInto**(`a`, `b`, `t`, `out`): `Vec3`

Defined in: [packages/core/src/utils/math/vec3.ts:83](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/utils/math/vec3.ts#L83)

Linearly interpolates between two vectors and stores the result in the given output vector.

#### Parameters

##### a

`Vec3`

##### b

`Vec3`

##### t

`number`

##### out

`Vec3`

#### Returns

`Vec3`
