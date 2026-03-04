# Arena AI Behavior: Edge Safety & Advanced Mechanics

**Paths:** `demos/arena/src/ai/AiService.ts`, `demos/arena/src/nodes/RemotePlayerNode.ts`

## Spin: Overlay vs Rotation

The spin mechanic must **ADD a circular offset to the direction vector**, NOT rotate the entire accumulated direction.

### The Problem

Rotating the direction (using cos/sin matrix rotation on `dirX`/`dirZ`) randomizes the chase direction, causing the AI to move in unpredictable directions unrelated to the opponent:

```typescript
// WRONG: rotates entire direction, breaks chase logic
const angle = spinPhase + time;
const rotX = dirX * Math.cos(angle) - dirZ * Math.sin(angle);
const rotZ = dirX * Math.sin(angle) + dirZ * Math.cos(angle);
// Result: AI spirals in random directions, not toward opponent
```

### The Solution: Additive Overlay

Add circular offset components as **additive terms** to the accumulated direction. The AI spirals **TOWARD** the opponent rather than spinning aimlessly:

```typescript
// CORRECT: adds circular motion, preserves chase intent
const angle = spinPhase + time;
const circularX = Math.cos(angle) * spinStrength;
const circularZ = Math.sin(angle) * spinStrength;

dirX += circularX;
dirZ += circularZ;
// Normalize to prevent magnitude inflation
const mag = Math.sqrt(dirX * dirX + dirZ * dirZ);
if (mag > 0) {
  dirX /= mag;
  dirZ /= mag;
}
```

### Why This Works

- **Preserves chase intent:** The accumulated `dirX`/`dirZ` still points toward the opponent
- **Adds spiral motion:** The circular offset creates a helical approach path
- **Avoids randomization:** The opponent's location still drives the primary direction

## Copycat: Mirror Intent, Not World-Space Direction

The copycat behavior must decompose the opponent's velocity into **radial** (toward/away from arena center) and **tangential** components, then apply the **same intent** from the mimic's own position.

### The Problem

Copying world-space velocity directly causes the mimic to move in the opponent's direction, which on a circular arena means moving **AWAY from center** when the opponent moves toward center (if they're on opposite sides):

```typescript
// WRONG: direct world-space copy breaks on circular arena
const opponentVelocity = opponent.getVelocity();
mimic.setVelocity(opponentVelocity.clone());
// If opponent is on east moving north (toward center), and mimic is on west,
// mimic also moves north (away from center) — opposite intent!
```

### The Solution: Decompose and Re-apply

1. Decompose opponent velocity into **radial** and **tangential** components relative to arena center
2. **Reflect** the radial component relative to the mimic's own center vector
3. Copy the **tangential** component directly

```typescript
// CORRECT: mirror intent from mimic's own perspective
const opponentPos = opponent.getPosition();
const mimicPos = mimic.getPosition();
const arenaCenter = new Vector3(0, 0, 0);

// Opponent's radial vector (from center to opponent)
const opponentRadial = opponentPos.clone().sub(arenaCenter).normalize();

// Decompose opponent velocity
const opponentVel = opponent.getVelocity();
const radialComponent = opponentRadial.dot(opponentVel);
const tangentialVel = opponentVel.clone().sub(
  opponentRadial.multiplyScalar(radialComponent)
);

// Mimic's radial vector (from center to mimic)
const mimicRadial = mimicPos.clone().sub(arenaCenter).normalize();

// Re-apply with mimic's perspective:
// - If opponent moved radially inward (negative), mimic also moves inward (negative in mimic's frame)
// - This requires reflecting the sign relative to mimic's radial direction
const mimicRadialComponent = -radialComponent; // Flip: what's inward for opponent is same direction for mimic

const newVelocity = tangentialVel.add(
  mimicRadial.multiplyScalar(mimicRadialComponent)
);
mimic.setVelocity(newVelocity);
```

### Why This Works

- **Preserves intent:** If the opponent moves toward center, the mimic also moves toward center
- **Handles opposite positions:** Radial reflection ensures the mimic's "toward center" matches the opponent's "toward center," even when positioned on opposite sides
- **Preserves tangential motion:** Circular/orbital motion is copied directly, since tangent direction is independent of position

### When to Apply

- Any copycat-style AI behavior that mirrors opponent movement
- Circular/arena-constrained environments where radial intent matters
- Avoid for open-space mimicry (world-space copy is fine there)
