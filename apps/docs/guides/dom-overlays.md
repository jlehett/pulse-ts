# DOM Overlays

The `@pulse-ts/dom` package provides a lightweight JSX-based system for building game UI overlays — HUDs, menus, tooltips, modals, and any in-game DOM element.

## Overview

- **No virtual DOM** — JSX runs once at mount, creating real DOM nodes directly.
- **Reactive bindings** — Function values in props/style are dirty-checked each frame. Static values are applied once.
- **Functional components** — Plain functions returning JSX, with full access to pulse-ts hooks.
- **Built-in primitives** — `Overlay`, `Row`, `Column`, `Button` for common layout patterns.

## Setup

Configure TSX support in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@pulse-ts/dom"
  }
}
```

No per-file pragma needed. All `.tsx` files will use the pulse-ts JSX runtime.

## Quick Start

```tsx
import { useOverlay, Column, Button } from '@pulse-ts/dom';

function PauseMenuNode() {
    useOverlay(
        <Column center gap={16}>
            <h1 style={{ color: '#fff', font: 'bold 32px monospace' }}>PAUSED</h1>
            <Button onClick={() => resume()}>Resume</Button>
            <Button onClick={() => quit()}>Quit</Button>
        </Column>,
    );
}
```

## Reactive Bindings

Any prop, style property, or text child can be a function. These are evaluated each frame with dirty-checking — the DOM is only mutated when the value changes.

```tsx
// Reactive text content
<span>{() => `Score: ${gameState.scores[0]}`}</span>

// Reactive style property
<div style={{ width: () => `${progress * 100}%` }} />

// Reactive visibility
<Row visible={() => gameState.phase !== 'intro'}>
    ...content...
</Row>
```

## Built-in Primitives

### `Overlay`

Root-level positioned container, covering the full parent with `pointer-events: none`.

```tsx
<Overlay>
    <span style={{ color: '#fff' }}>HUD Content</span>
</Overlay>
```

### `Row`

Flex row with `gap`, `center`, and `justify` props.

```tsx
<Row gap={12} center>
    <span>Left</span>
    <span>Right</span>
</Row>
```

### `Column`

Flex column with `gap`, `center`, and `align` props.

```tsx
<Column gap={8} center>
    <span>Top</span>
    <span>Bottom</span>
</Column>
```

### `Button`

Styled button with built-in hover/press feedback and an `accent` color prop.

```tsx
<Button onClick={() => startGame()} accent="#48c9b0">
    Start Game
</Button>
```

## Functional Components

Components are plain functions that take props and return JSX. They are called once at mount time. Since they run during pulse-ts node setup, all hooks are available.

```tsx
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
```

## Lifecycle

Elements are automatically cleaned up when the owning pulse-ts node is destroyed. No manual cleanup is needed.

```tsx
function HudNode() {
    // Mounted when HudNode is created, removed when HudNode is destroyed
    useOverlay(
        <div style={{ color: '#fff' }}>HUD</div>,
    );
}
```

## Limitations

- **Not a UI framework** — No state management, no event system, no virtual DOM. This is a thin declarative layer over DOM construction.
- **No re-rendering** — The component function runs once. There is no reconciliation pass.
- **No conditional rendering** — Use the `visible` prop for show/hide. For mount/unmount, use `useConditionalChild` with separate nodes.
