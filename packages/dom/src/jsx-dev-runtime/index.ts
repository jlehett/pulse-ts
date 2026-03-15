/**
 * JSX dev-runtime entry point for `@pulse-ts/dom`.
 *
 * Re-exports the production JSX factory as `jsxDEV`, which bundlers
 * (Vite, esbuild) use in development mode when `jsx: "react-jsx"` is set.
 *
 * @packageDocumentation
 */
export { jsx as jsxDEV, Fragment } from '../jsx-runtime';
export type { PulseElement } from '../jsx-runtime';
