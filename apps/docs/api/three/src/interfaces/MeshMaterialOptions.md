[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / MeshMaterialOptions

# Interface: MeshMaterialOptions

Defined in: packages/three/src/public/useMesh.ts

Material options forwarded to the underlying Three.js material.

All properties are optional and backward-compatible. String enums are used
for Three.js constants so callers never need to import `THREE.*` values.

## Properties

### color?

> `optional` **color**: `number`

Mesh color (hex). Defaults to `0xcccccc`.

### roughness?

> `optional` **roughness**: `number`

Surface roughness `[0, 1]`. Defaults to `1`.

### metalness?

> `optional` **metalness**: `number`

Metalness `[0, 1]`. Defaults to `0`.

### emissive?

> `optional` **emissive**: `number`

Emissive color (hex).

### emissiveIntensity?

> `optional` **emissiveIntensity**: `number`

Emissive intensity. Defaults to `1`.

### transparent?

> `optional` **transparent**: `boolean`

Whether the material is transparent. Defaults to `false`.

### opacity?

> `optional` **opacity**: `number`

Opacity `[0, 1]`. Only effective when `transparent` is true. Defaults to `1`.

### map?

> `optional` **map**: `Texture`

Color (diffuse) texture map.

### normalMap?

> `optional` **normalMap**: `Texture`

Normal map texture.

### normalScale?

> `optional` **normalScale**: `[number, number]`

Normal map scale as `[x, y]` tuple. Converted to `THREE.Vector2` internally. Defaults to `[1, 1]`.

### emissiveMap?

> `optional` **emissiveMap**: `Texture`

Emissive map texture.

### roughnessMap?

> `optional` **roughnessMap**: `Texture`

Roughness map texture.

### metalnessMap?

> `optional` **metalnessMap**: `Texture`

Metalness map texture.

### alphaMap?

> `optional` **alphaMap**: `Texture`

Alpha map texture. Controls per-pixel opacity.

### envMap?

> `optional` **envMap**: `Texture`

Environment map texture.

### side?

> `optional` **side**: `'front'` | `'back'` | `'double'`

Which faces to render. Defaults to `'front'`.

### depthWrite?

> `optional` **depthWrite**: `boolean`

Whether to write to the depth buffer. Defaults to `true`.

### blending?

> `optional` **blending**: `'normal'` | `'additive'` | `'multiply'`

Blending mode. Defaults to `'normal'`.

### materialType?

> `optional` **materialType**: `MaterialType`

Which Three.js material class to use. Defaults to `'standard'`.
