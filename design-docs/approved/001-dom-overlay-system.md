# Approved: DOM Overlay System (`@pulse-ts/dom`)

> Lightweight JSX-based DOM overlay system for game UI — HUDs, menus, tooltips, modals, and all in-game DOM elements.

**Origin:** Engine Improvements #1 (`useOverlay`), expanded through design discussion into a full package.

---

## Summary

A new `@pulse-ts/dom` package that provides:

1. A **lightweight JSX runtime** — one-time DOM construction, no virtual DOM, no diffing, no reconciliation.
2. **Reactive bindings** — function values for text content, style properties, and visibility, dirty-checked each frame.
3. **Built-in layout primitives** — `Row`, `Column`, `Button`, `Overlay` shipped as functional components.
4. **Functional components** — plain functions returning JSX, with full access to pulse-ts hooks (`useFrameUpdate`, `useStore`, `useDestroy`, etc.).
5. **TSX support** — configured project-wide via `tsconfig.json`, no per-file pragma needed.

---

## Problem

Every node that renders DOM UI (12+ in the arena demo) repeats identical boilerplate: get the renderer container, create elements, style them, append them, and register `useDestroy` cleanup. Multi-element overlays (pause menu, match-over screen, score HUD) duplicate 40-50 lines of DOM construction, layout, and visibility management each. There is no composability, no reuse, and no declarative way to describe overlay UI.

---

## Design Principles

- **Runs once at mount** — JSX factory creates real DOM nodes directly. No re-rendering, no reconciliation.
- **Reactive where needed** — Function values (for text, style, visibility) are registered as frame-update bindings with dirty-checking. Static values are applied once.
- **Components are just functions** — No special component registration. A component is a function that takes props and returns JSX. Since it runs during pulse-ts node setup, all pulse-ts hooks are available.
- **Not a UI framework** — No state management, no event system, no virtual DOM. This is a thin layer that makes DOM construction declarative and composable within the pulse-ts lifecycle.

---

## TSX Configuration

Set once in `tsconfig.json` — applies to all `.tsx` files in the project:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pulse-ts/dom"
  }
}
```

No per-file pragma needed. If a project ever needs React JSX alongside pulse-ts JSX, the per-file `/** @jsxImportSource */` pragma can override on a per-file basis.

---

## API

### `useOverlay`

Entry point for mounting an overlay DOM tree onto the renderer container. Handles parenting and `useDestroy` cleanup automatically.

```tsx
import { useOverlay } from '@pulse-ts/dom';

// Simple single-element overlay
const el = useOverlay(
    <div style={{ font: 'bold 48px monospace', color: '#fff' }}>
        {() => `${gameState.countdownValue}`}
    </div>,
);

// Multi-element overlay with composition
useOverlay(
    <Column center gap={16}>
        <h1 style={{ color: '#fff' }}>GAME OVER</h1>
        <Button onClick={handleRematch}>Rematch</Button>
    </Column>,
);
```

### Built-in Primitives

Shipped as functional components:

- **`Overlay`** — Root-level positioned container (absolute, pointer-events none).
- **`Row`** — Flex row with `gap`, `center`, `justify` props.
- **`Column`** — Flex column with `gap`, `center`, `align` props.
- **`Button`** — Styled button with built-in press/hover feedback.

```tsx
<Column center gap={16}>
    <Row gap={12}>
        <Button onClick={handleRematch} accent="#48c9b0">Rematch</Button>
        <Button onClick={handleMenu}>Main Menu</Button>
    </Row>
</Column>
```

### Reactive Bindings

Any prop value can be a function — it will be evaluated each frame with dirty-checking (DOM only updates when the value changes):

```tsx
// Reactive text content
<span>{() => `Score: ${gameState.scores[0]}`}</span>

// Reactive style property
<div style={{ width: () => `${progress * 100}%` }} />

// Reactive visibility
<Row visible={() => gameState.phase !== 'intro'}>
    ...
</Row>
```

### Functional Components

A component is a plain function that takes props and returns JSX. Called once at mount time. Has full access to pulse-ts hooks since it runs during node setup.

```tsx
// Pure layout component
function ScoreCard({ label, getScore, color }: {
    label: string;
    getScore: () => number;
    color: string;
}) {
    return (
        <Column gap={4} style={{ padding: '8px 16px', borderLeft: `3px solid ${color}` }}>
            <span style={{ font: '12px monospace', color: '#888' }}>{label}</span>
            <span style={{ font: 'bold 32px monospace', color }}>
                {() => `${getScore()}`}
            </span>
        </Column>
    );
}

// Component with internal behavior (uses pulse-ts hooks)
function DashCooldownIndicator({ playerId, color }: {
    playerId: number;
    color: string;
}) {
    const cooldown = useStore(DashCooldownStore);

    return (
        <div style={{ width: '60px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
            <div style={{
                height: '100%',
                backgroundColor: color,
                borderRadius: '3px',
                width: () => `${cooldown.progress[playerId] * 100}%`,
            }} />
        </div>
    );
}
```

### Full Example: Score HUD Node

```tsx
/** ScoreHudNode.tsx */
import { useOverlay } from '@pulse-ts/dom';
import { useContext } from '@pulse-ts/core';
import { GameCtx } from '../contexts/GameCtx';

function ScoreCard({ label, getScore, color }: {
    label: string;
    getScore: () => number;
    color: string;
}) {
    return (
        <Column gap={4} style={{ padding: '8px 16px', borderLeft: `3px solid ${color}` }}>
            <span style={{ font: '12px monospace', color: '#888' }}>{label}</span>
            <span style={{ font: 'bold 32px monospace', color }}>
                {() => `${getScore()}`}
            </span>
        </Column>
    );
}

export function ScoreHudNode() {
    const gameState = useContext(GameCtx);

    useOverlay(
        <Row center gap={24} visible={() => gameState.phase !== 'intro'}>
            <ScoreCard label="P1" getScore={() => gameState.scores[0]} color="#48c9b0" />
            <span style={{ font: 'bold 20px monospace', color: '#666' }}>vs</span>
            <ScoreCard label="P2" getScore={() => gameState.scores[1]} color="#e74c3c" />
        </Row>,
    );
}
```

---

## Performance

- **Mount cost:** One-time DOM construction. JSX factory calls are simple `document.createElement` + `appendChild`. No virtual DOM overhead.
- **Per-frame cost:** Only reactive bindings are evaluated each frame. Each binding: call function → compare to previous value → skip DOM mutation if unchanged. Typical overlay has 3-10 bindings — negligible cost.
- **No re-rendering:** The component function runs once. There is no reconciliation pass. DOM mutations are surgical — only the specific property that changed is updated.

---

## Package Scope

This package replaces what was originally proposed as just `useOverlay` (improvement #1), and also absorbs:
- **#6 (`useButton`)** — `Button` is a built-in primitive.
- **#24 (`useModal`)** — Can be implemented as a functional component composing `Overlay` + backdrop.
- **#28 (`useEntrance`)** — Entrance animations can be a prop on any component.

The DOM package provides the foundation that makes these higher-level patterns composable rather than requiring separate hooks.
