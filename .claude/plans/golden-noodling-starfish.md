# Plan: Tie Replay Camera — Midpoint Follow with Dynamic Zoom

## Context

Tie detection and authoritative scoring (TICKET-090) are already implemented. During a tie replay, the camera currently follows the first knocked-out player (same as normal replays). The user wants tie replays to instead follow the **midpoint between both players**, dynamically zooming to keep both in frame throughout.

## Current Camera Behavior (CameraRigNode.ts)

During replay, the camera:
1. Determines a `followId` (scorer or loser based on hit timing)
2. Calls `getReplayPosition(followId)` to get a single player's position
3. Places the camera at `(followX, REPLAY_CAMERA_HEIGHT - hitZoom, followZ + FOLLOW_DIST)`
4. Looks at `(followX, followY, followZ)`
5. Zooms out to overhead once the loser falls below `REPLAY_LOSER_FALLEN_Y`

All smoothed via exponential interpolation.

## Design

When `gameState.isTie` is true during an active replay, override the follow logic:

1. **Follow target = midpoint** of both players' replay positions
2. **Camera height = dynamic** based on the distance between the two players — farther apart means higher camera to keep both in frame
3. **Look-at = midpoint** position
4. **Skip scorer/loser follow-switching** — the midpoint is always the target
5. **Fall zoom-out** still applies, but triggered by *either* player falling below the threshold

### Dynamic Height Formula

```
separation = distance between P0 and P1 (XZ plane)
extraHeight = max(0, separation - BASE_SEPARATION) * HEIGHT_PER_UNIT
cameraHeight = REPLAY_CAMERA_HEIGHT + extraHeight
```

Constants:
- `REPLAY_TIE_BASE_SEPARATION = 6` — distance at which no extra zoom is needed
- `REPLAY_TIE_HEIGHT_PER_UNIT = 0.8` — height gained per unit of separation beyond base

This keeps both players in the camera's field of view as they drift apart.

## File Changes

### `demos/arena/src/nodes/CameraRigNode.ts`

- Add two constants: `REPLAY_TIE_BASE_SEPARATION = 6`, `REPLAY_TIE_HEIGHT_PER_UNIT = 0.8`
- Inside `if (isReplayActive())` block, add a branch for `gameState.isTie`:
  - Get both positions: `getReplayPosition(0)` and `getReplayPosition(1)`
  - Compute midpoint: `midX = (p0[0]+p1[0])/2`, `midZ = (p0[2]+p1[2])/2`, `midY = (p0[1]+p1[1])/2`
  - Compute XZ separation: `Math.sqrt((p0[0]-p1[0])^2 + (p0[2]-p1[2])^2)`
  - Compute dynamic height: `REPLAY_CAMERA_HEIGHT + max(0, sep - BASE_SEP) * HEIGHT_PER_UNIT`
  - Apply hit-proximity zoom normally (subtract `REPLAY_HIT_ZOOM * hitProx`)
  - Fall zoom-out: use the lower of the two Y positions as the "loser" Y
  - Set `targetX = midX`, `targetY = dynamicHeight`, `targetZ = midZ + FOLLOW_DIST`
  - Set look-at to `(midX, midY, midZ)`
- The existing else branch handles normal (non-tie) replays unchanged

### `demos/arena/src/nodes/CameraRigNode.test.ts`

- Add tests for the new tie-replay constants

## Verification

1. `npm test -w demos/arena --silent` — all tests pass
2. `npx eslint demos/arena/src/nodes/CameraRigNode.ts` — lint clean
3. Manual: trigger simultaneous KO → camera follows midpoint, zooms out as players separate
