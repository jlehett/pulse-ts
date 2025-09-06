# Math (Vec3, Quat)

Core includes small math types used by components and systems. They are minimal and allocation-conscious.

## Vec3

```ts
import { Vec3 } from '@pulse-ts/core';

const a = new Vec3(1, 0, 0);
const b = new Vec3(0, 1, 0);

const c = Vec3.lerp(a, b, 0.5); // (0.5, 0.5, 0)
Vec3.lerpInto(a, b, 0.25, a);   // mutate into a

a.multiply(new Vec3(2, 2, 2));  // component-wise multiply
a.normalize();
```

## Quat

```ts
import { Quat, Vec3 } from '@pulse-ts/core';

const r = new Quat();
const v = new Vec3(1, 0, 0);
Quat.rotateVector(r, v);     // rotate vector by quaternion

const a = new Quat(0, 0, 0, 1);
const b = new Quat(0, 1, 0, 0);
const mid = Quat.slerp(a, b, 0.5);
const out = new Quat();
Quat.slerpInto(a, b, 0.25, out);
```

