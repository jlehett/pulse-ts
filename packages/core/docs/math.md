# Math Utilities

Pulse includes optimized math utilities for 3D game development. These are designed for performance and ease of use, providing the essential operations you need for transforms, physics, and spatial calculations.

## Vec3 (3D Vectors)

The `Vec3` class represents 3D vectors and points. All operations are optimized and minimize allocations.

### Creating Vectors

```typescript
import { Vec3 } from '@pulse-ts/core';

// Create from components
const v1 = new Vec3(1, 2, 3);

// Create from another vector
const v2 = new Vec3(v1);

// Create common vectors
const zero = Vec3.zero();    // (0, 0, 0)
const one = Vec3.one();      // (1, 1, 1)
const up = Vec3.up();        // (0, 1, 0)
const right = Vec3.right();  // (1, 0, 0)
const forward = Vec3.forward(); // (0, 0, 1)
```

### Basic Operations

```typescript
const a = new Vec3(1, 2, 3);
const b = new Vec3(4, 5, 6);

// Component access
console.log(a.x, a.y, a.z); // 1, 2, 3

// Copy
const c = a.clone();

// Set values
a.set(7, 8, 9);

// Check equality
if (Vec3.equals(a, b)) {
  console.log('Vectors are equal');
}
```

### Arithmetic Operations

```typescript
const a = new Vec3(1, 2, 3);
const b = new Vec3(4, 5, 6);

// Addition
const sum = Vec3.add(a, b);        // (5, 7, 9)
a.add(b);                          // Modifies a: (5, 7, 9)

// Subtraction
const diff = Vec3.subtract(a, b);  // (-3, -3, -3)
a.subtract(b);                     // Modifies a

// Scalar multiplication
const scaled = Vec3.multiply(a, 2); // (2, 4, 6)
a.multiply(2);                     // Modifies a

// Scalar division
const divided = Vec3.divide(a, 2);  // (0.5, 1, 1.5)
a.divide(2);                       // Modifies a
```

### Vector Operations

```typescript
const a = new Vec3(1, 2, 3);
const b = new Vec3(4, 5, 6);

// Dot product
const dot = Vec3.dot(a, b); // 1*4 + 2*5 + 3*6 = 32

// Cross product
const cross = Vec3.cross(a, b); // (-3, 6, -3)

// Magnitude (length)
const length = Vec3.magnitude(a); // sqrt(1² + 2² + 3²) = sqrt(14)

// Squared magnitude (faster, no sqrt)
const sqrLength = Vec3.sqrMagnitude(a); // 14

// Distance between points
const dist = Vec3.distance(a, b);

// Angle between vectors (radians)
const angle = Vec3.angle(a, b);
```

### Normalization

```typescript
const a = new Vec3(3, 4, 0);

// Normalize (make unit length)
const normalized = Vec3.normalize(a); // (0.6, 0.8, 0)

// Check if normalized
if (Vec3.isNormalized(a)) {
  console.log('Vector is unit length');
}

// Safe normalization (handles zero vectors)
const safeNormalized = Vec3.safeNormalize(a);
```

### Interpolation

```typescript
const start = new Vec3(0, 0, 0);
const end = new Vec3(10, 0, 0);

// Linear interpolation
const halfway = Vec3.lerp(start, end, 0.5); // (5, 0, 0)

// Unclamped lerp (can exceed 0-1 range)
const beyond = Vec3.lerpUnclamped(start, end, 1.5); // (15, 0, 0)

// Move towards (with max distance)
const moved = Vec3.moveTowards(start, end, 2); // (2, 0, 0)
```

### Utility Functions

```typescript
const a = new Vec3(1, 2, 3);
const b = new Vec3(4, 5, 6);

// Minimum components
const min = Vec3.min(a, b); // (1, 2, 3)

// Maximum components
const max = Vec3.max(a, b); // (4, 5, 6)

// Clamp components to range
const clamped = Vec3.clamp(a, new Vec3(0, 0, 0), new Vec3(2, 2, 2)); // (1, 2, 2)

// Absolute value
const abs = Vec3.abs(new Vec3(-1, 2, -3)); // (1, 2, 3)

// Floor/ceiling
const floored = Vec3.floor(new Vec3(1.7, 2.3, 3.9)); // (1, 2, 3)
const ceiled = Vec3.ceil(new Vec3(1.1, 2.9, 3.0));   // (2, 3, 3)

// Round to nearest
const rounded = Vec3.round(new Vec3(1.4, 1.6, 2.5)); // (1, 2, 3)
```

## Quat (Quaternions)

The `Quat` class represents 3D rotations using quaternions. Quaternions avoid gimbal lock and provide smooth interpolation.

### Creating Quaternions

```typescript
import { Quat } from '@pulse-ts/core';

// Identity rotation (no rotation)
const identity = Quat.identity();

// From Euler angles (degrees or radians)
const fromEuler = Quat.fromEuler(Math.PI/2, 0, 0); // 90° around X

// From axis-angle
const axis = new Vec3(0, 1, 0); // Y axis
const fromAxisAngle = Quat.fromAxisAngle(axis, Math.PI/2);

// From rotation matrix (advanced)
const fromMatrix = Quat.fromMatrix(rotationMatrix);

// Look at target
const position = new Vec3(0, 0, 0);
const target = new Vec3(0, 0, 1);
const up = new Vec3(0, 1, 0);
const lookAt = Quat.lookAt(position, target, up);
```

### Basic Operations

```typescript
const q1 = Quat.fromEuler(0, Math.PI/2, 0);
const q2 = Quat.fromEuler(0, 0, Math.PI/4);

// Copy
const q3 = q1.clone();

// Set to identity
q1.setIdentity();

// Check equality
if (Quat.equals(q1, q2)) {
  console.log('Quaternions are equal');
}
```

### Rotation Operations

```typescript
const rotation = Quat.fromEuler(0, Math.PI/2, 0);

// Rotate a vector
const vector = new Vec3(1, 0, 0);
const rotated = Quat.rotateVector(rotation, vector);

// Get rotation axis and angle
const axis = Quat.getAxis(rotation);
const angle = Quat.getAngle(rotation);

// Convert to Euler angles
const euler = Quat.toEuler(rotation); // Vec3 with x, y, z angles

// Convert to axis-angle
const axisAngle = Quat.toAxisAngle(rotation); // { axis: Vec3, angle: number }
```

### Quaternion Arithmetic

```typescript
const q1 = Quat.fromEuler(0, Math.PI/2, 0);
const q2 = Quat.fromEuler(0, 0, Math.PI/4);

// Multiplication (combine rotations)
const combined = Quat.multiply(q1, q2); // Apply q2, then q1

// Inverse (opposite rotation)
const inverse = Quat.inverse(q1);

// Conjugate (same as inverse for unit quaternions)
const conjugate = Quat.conjugate(q1);
```

### Interpolation

```typescript
const start = Quat.fromEuler(0, 0, 0);
const end = Quat.fromEuler(0, Math.PI, 0);

// Spherical linear interpolation (smooth rotation)
const halfway = Quat.slerp(start, end, 0.5);

// Normalized linear interpolation (faster, less smooth)
const nlerp = Quat.nlerp(start, end, 0.5);

// Unclamped versions
const slerpUnclamped = Quat.slerpUnclamped(start, end, 1.5);
const nlerpUnclamped = Quat.nlerpUnclamped(start, end, 1.5);
```

### Advanced Operations

```typescript
const q = Quat.fromEuler(Math.PI/4, Math.PI/3, Math.PI/6);

// Normalize (ensure unit length)
const normalized = Quat.normalize(q);

// Check if normalized
if (Quat.isNormalized(q)) {
  console.log('Quaternion is unit length');
}

// Get magnitude
const magnitude = Quat.magnitude(q);

// Dot product
const dot = Quat.dot(q1, q2);

// Exponential and logarithm (advanced)
const exp = Quat.exp(q);
const log = Quat.log(q);

// Power (raise to scalar power)
const powered = Quat.pow(q, 2);
```

## Common Math Patterns

### Movement and Physics

```typescript
function PhysicsObject() {
  const transform = useComponent(Transform);
  const [velocity, setVelocity] = useState('velocity', new Vec3());

  useFixedUpdate((dt) => {
    // Apply gravity
    const gravity = new Vec3(0, -9.81, 0);
    setVelocity(prev => Vec3.add(prev, Vec3.multiply(gravity, dt)));

    // Apply velocity to position
    const deltaPos = Vec3.multiply(velocity, dt);
    transform.localPosition.add(deltaPos);

    // Apply drag
    setVelocity(prev => Vec3.multiply(prev, 0.99));
  });
}
```

### Camera Controls

```typescript
function OrbitCamera({ target }: { target: Node }) {
  const transform = useComponent(Transform);
  const [distance, setDistance] = useState('distance', 10);
  const [yaw, setYaw] = useState('yaw', 0);
  const [pitch, setPitch] = useState('pitch', Math.PI/6);

  useFrameUpdate((dt) => {
    // Mouse look
    const mouseDelta = getMouseDelta();
    setYaw(prev => prev + mouseDelta.x * 0.01);
    setPitch(prev => Math.max(-Math.PI/2, Math.min(Math.PI/2, prev + mouseDelta.y * 0.01)));

    // Calculate camera position
    const targetPos = getComponent(target, Transform).worldPosition;
    const offset = new Vec3(
      Math.cos(pitch) * Math.cos(yaw) * distance,
      Math.sin(pitch) * distance,
      Math.cos(pitch) * Math.sin(yaw) * distance
    );

    transform.localPosition.copy(Vec3.add(targetPos, offset));

    // Look at target
    const lookDirection = Vec3.subtract(targetPos, transform.worldPosition);
    Vec3.normalize(lookDirection, lookDirection);
    transform.localRotation = Quat.lookAt(Vec3.zero(), lookDirection, Vec3.up());
  });
}
```

### Collision Detection

```typescript
function SphereCollision(a: Vec3, b: Vec3, radiusA: number, radiusB: number) {
  const distance = Vec3.distance(a, b);
  return distance < (radiusA + radiusB);
}

function AABBCollision(
  posA: Vec3, sizeA: Vec3,
  posB: Vec3, sizeB: Vec3
) {
  const aMin = Vec3.subtract(posA, Vec3.multiply(sizeA, 0.5));
  const aMax = Vec3.add(posA, Vec3.multiply(sizeA, 0.5));
  const bMin = Vec3.subtract(posB, Vec3.multiply(sizeB, 0.5));
  const bMax = Vec3.add(posB, Vec3.multiply(sizeB, 0.5));

  return (
    aMin.x <= bMax.x && aMax.x >= bMin.x &&
    aMin.y <= bMax.y && aMax.y >= bMin.y &&
    aMin.z <= bMax.z && aMax.z >= bMin.z
  );
}
```

### Pathfinding Helpers

```typescript
function MoveTowards(current: Vec3, target: Vec3, speed: number, dt: number) {
  const direction = Vec3.subtract(target, current);
  const distance = Vec3.magnitude(direction);

  if (distance < 0.01) return current; // Already at target

  Vec3.normalize(direction, direction);
  const moveDistance = Math.min(speed * dt, distance);
  return Vec3.add(current, Vec3.multiply(direction, moveDistance));
}

function PredictPosition(position: Vec3, velocity: Vec3, time: number) {
  return Vec3.add(position, Vec3.multiply(velocity, time));
}
```

### Smooth Following

```typescript
function SmoothFollow(current: Vec3, target: Vec3, smoothTime: number, dt: number) {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  const change = Vec3.subtract(current, target);
  const temp = Vec3.add(target, Vec3.multiply(change, exp));

  return {
    position: temp,
    velocity: Vec3.multiply(Vec3.subtract(temp, current), -omega * exp)
  };
}
```

## Performance Tips

### Minimize Allocations

```typescript
// ✅ Good: Reuse vectors
const tempVec = new Vec3();
function update() {
  Vec3.set(tempVec, 1, 2, 3);
  // Use tempVec...
}

// ❌ Bad: Create new vectors every frame
function update() {
  const tempVec = new Vec3(1, 2, 3); // Allocates every frame!
}
```

### Use In-Place Operations

```typescript
// ✅ Good: Modify existing vectors
const velocity = new Vec3();
function update(dt: number) {
  velocity.multiply(0.99); // Drag
  velocity.y -= 9.81 * dt; // Gravity
  position.add(Vec3.multiply(velocity, dt));
}

// ❌ Bad: Create intermediate vectors
function update(dt: number) {
  const drag = Vec3.multiply(velocity, 0.99);
  const gravity = Vec3.add(drag, new Vec3(0, -9.81 * dt, 0));
  position.add(gravity);
}
```

### Cache Calculations

```typescript
// ✅ Good: Cache expensive operations
let cachedForward: Vec3;
function getForward() {
  if (!cachedForward) {
    cachedForward = Quat.rotateVector(rotation, Vec3.forward());
  }
  return cachedForward;
}

// Update cache when rotation changes
function setRotation(newRotation: Quat) {
  rotation = newRotation;
  cachedForward = undefined; // Invalidate cache
}
```

The math utilities provide the foundation for all spatial calculations in Pulse. They're optimized for performance while remaining easy to use. Understanding these operations will help you build efficient and accurate game mechanics!
