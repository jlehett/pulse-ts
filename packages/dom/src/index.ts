/**
 * @packageDocumentation
 * Lightweight JSX-based DOM overlay system for game UI.
 *
 * Features:
 * - **JSX runtime** — one-time DOM construction, no virtual DOM, no diffing
 * - **Reactive bindings** — function values dirty-checked each frame
 * - **Built-in primitives** — `Overlay`, `Row`, `Column`, `Button`
 * - **Functional components** — plain functions with full pulse-ts hook access
 * - **TSX support** — via `tsconfig.json` `jsxImportSource`, no per-file pragma
 *
 * Quick start:
 * ```tsx
 * import { useOverlay, Column, Button } from '@pulse-ts/dom';
 *
 * function PauseMenu() {
 *     useOverlay(
 *         <Column center gap={16}>
 *             <h1 style={{ color: '#fff' }}>PAUSED</h1>
 *             <Button onClick={() => resume()}>Resume</Button>
 *         </Column>,
 *     );
 * }
 * ```
 */
export * from './public';

// Re-export JSX runtime types for consumers
export type {
    PulseElement,
    PulseChild,
    DomFC,
    ReactiveValue,
} from './domain/types';
export { Fragment } from './domain/types';
export { createElement } from './domain/createElement';
