---
paths:
  - "demos/arena/src/nodes/*HudNode.ts"
  - "demos/arena/src/nodes/TouchControlsNode.ts"
---
# HUD Nodes Must Accept playerId Prop

## Problem

In online mode, the joiner plays as player 1 (not player 0). HUD nodes that hardcode `getDashCooldownProgress(0)` or similar per-player state reads will show the wrong player's data for the joiner.

## Convention

Any HUD or UI node that reads per-player shared state (dash cooldown, score highlights, etc.) must:

1. Accept an optional `playerId` prop (defaulting to `0`)
2. Use that prop when reading from shared stores
3. Be passed the local player ID from `ArenaNode`

### Correct
```typescript
export interface MyHudNodeProps {
    playerId?: number;
}
export function MyHudNode(props?: Readonly<MyHudNodeProps>) {
    const id = props?.playerId ?? 0;
    const progress = getDashCooldownProgress(id);
}
```

### Incorrect
```typescript
export function MyHudNode() {
    const progress = getDashCooldownProgress(0); // Broken for joiner (player 1)
}
```

## Why This Matters

- In solo and local mode, the human is always player 0, so hardcoding works by coincidence
- In online mode, the joiner is player 1 — the bug only manifests for one side of the connection
- The fix is simple but easy to forget when adding new HUD elements

## Affected Nodes

- `TouchControlsNode` — dash button fill indicator
- `DashCooldownHudNode` — desktop cooldown bar
