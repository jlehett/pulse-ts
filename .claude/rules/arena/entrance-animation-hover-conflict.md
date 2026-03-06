---
paths:
  - "demos/arena/src/overlayAnimations.ts"
  - "demos/arena/src/**/*Menu*.ts"
  - "demos/arena/src/menu.ts"
---
# Entrance Animation + Hover Scale Conflict

## The Problem

`applyButtonHoverScale(btn)` captures `base = btn.style.transform` at call time. If `applyStaggeredEntrance` was called on the same button beforehand, `base` captures the entrance animation's intermediate `translateY(20px)` state — not the final resting transform.

This causes:
- Hover applies `translateY(20px) scale(1.05)` — button shifts down AND scales
- Pointerleave restores `translateY(20px)` — button stays shifted permanently

## The Rule

**Never pass individual buttons to `applyStaggeredEntrance` if those same buttons use `applyButtonHoverScale`.** Instead, animate their container element.

### Correct
```typescript
const buttonCol = createColumn(btn1, btn2, btn3);
applyStaggeredEntrance([heading, buttonCol], 80);  // animate container
applyButtonHoverScale(btn1);  // captures clean empty transform
```

### Incorrect
```typescript
applyStaggeredEntrance([heading, btn1, btn2, btn3], 80);  // poisons transforms
applyButtonHoverScale(btn1);  // captures stale translateY(20px)
```

## Why

`applyStaggeredEntrance` → `applyEntrance` synchronously sets `el.style.transform = 'translateY(20px)'` before the rAF transition runs. `applyButtonHoverScale` is called in the same synchronous block, so it sees the intermediate transform.

## See Also

- `demos/arena/src/menu.ts` — Main menu correctly animates `buttonRow`, not individual buttons
- `demos/arena/src/soloMenu.ts` — Fixed to animate `buttonCol` container
