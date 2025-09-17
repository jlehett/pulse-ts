[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Quat

# Class: Quat

Defined in: [core/src/math/quat.ts:6](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L6)

A quaternion.

## Constructors

### Constructor

> **new Quat**(`x`, `y`, `z`, `w`): `Quat`

Defined in: [core/src/math/quat.ts:7](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L7)

#### Parameters

##### x

`number` = `0`

##### y

`number` = `0`

##### z

`number` = `0`

##### w

`number` = `1`

#### Returns

`Quat`

## Properties

### w

> **w**: `number` = `1`

Defined in: [core/src/math/quat.ts:11](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L11)

***

### x

> **x**: `number` = `0`

Defined in: [core/src/math/quat.ts:8](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L8)

***

### y

> **y**: `number` = `0`

Defined in: [core/src/math/quat.ts:9](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L9)

***

### z

> **z**: `number` = `0`

Defined in: [core/src/math/quat.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L10)

## Methods

### clone()

> **clone**(): `Quat`

Defined in: [core/src/math/quat.ts:17](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L17)

Returns a clone of the quaternion.

#### Returns

`Quat`

***

### copy()

> **copy**(`q`): `this`

Defined in: [core/src/math/quat.ts:47](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L47)

Copies the values of the given quaternion.

#### Parameters

##### q

`Quat`

#### Returns

`this`

***

### normalize()

> **normalize**(): `this`

Defined in: [core/src/math/quat.ts:35](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L35)

Normalizes the quaternion.

#### Returns

`this`

***

### set()

> **set**(`x`, `y`, `z`, `w`): `this`

Defined in: [core/src/math/quat.ts:24](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L24)

Sets the quaternion to the given values.

#### Parameters

##### x

`number`

##### y

`number`

##### z

`number`

##### w

`number`

#### Returns

`this`

***

### multiply()

> `static` **multiply**(`a`, `b`, `out`): `Quat`

Defined in: [core/src/math/quat.ts:58](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L58)

Multiplies two quaternions.

#### Parameters

##### a

`Quat`

##### b

`Quat`

##### out

`Quat` = `...`

#### Returns

`Quat`

***

### rotateVector()

> `static` **rotateVector**(`q`, `v`, `out`): [`Vec3`](Vec3.md)

Defined in: [core/src/math/quat.ts:77](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L77)

Rotates a vector by the quaternion.

#### Parameters

##### q

`Quat`

##### v

[`Vec3`](Vec3.md)

##### out

[`Vec3`](Vec3.md) = `...`

#### Returns

[`Vec3`](Vec3.md)

***

### slerp()

> `static` **slerp**(`a`, `b`, `t`): `Quat`

Defined in: [core/src/math/quat.ts:98](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L98)

Spherically interpolates between two quaternions.

#### Parameters

##### a

`Quat`

##### b

`Quat`

##### t

`number`

#### Returns

`Quat`

***

### slerpInto()

> `static` **slerpInto**(`a`, `b`, `t`, `out`): `Quat`

Defined in: [core/src/math/quat.ts:129](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/math/quat.ts#L129)

Spherically interpolates between two quaternions and stores the result in the given output quaternion.

#### Parameters

##### a

`Quat`

##### b

`Quat`

##### t

`number`

##### out

`Quat`

#### Returns

`Quat`
