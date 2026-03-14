# Approved: Color Format Utility (`color`)

> Create a color from a hex number with automatic format conversion to hex string, RGB, RGBA, and component access.

**Origin:** Engine Improvements #21 (`defineTheme`), simplified to a standalone utility.

---

## Summary

A `color` utility function in `@pulse-ts/core` that takes a hex number and returns an object with all common color format conversions. Lives alongside the math utilities (lerp, damp, etc.).

---

## Problem

The arena demo scatters the same colors across 7+ files in different formats: `0x48c9b0` (hex number for Three.js), `'#48c9b0'` (CSS hex string), `'rgba(72, 201, 176, 0.5)'` (CSS rgba). Converting between formats is done manually and inconsistently. A single source of truth with derived formats eliminates this fragmentation.

---

## API

```typescript
interface Color {
    /** Original hex number (e.g., 0x48c9b0). */
    readonly num: number;
    /** CSS hex string (e.g., '#48c9b0'). */
    readonly hex: string;
    /** CSS rgb string (e.g., 'rgb(72, 201, 176)'). */
    readonly rgb: string;
    /** Red component (0–255). */
    readonly r: number;
    /** Green component (0–255). */
    readonly g: number;
    /** Blue component (0–255). */
    readonly b: number;
    /** CSS rgba string with specified alpha. */
    rgba(alpha: number): string;
}

/**
 * Create a color from a hex number with automatic format conversion.
 *
 * @param hex - Color as a hex number (e.g., 0x48c9b0).
 * @returns A Color object with all common format conversions.
 *
 * @example
 * const p1 = color(0x48c9b0);
 * p1.hex;       // '#48c9b0'
 * p1.num;       // 0x48c9b0
 * p1.rgb;       // 'rgb(72, 201, 176)'
 * p1.rgba(0.5); // 'rgba(72, 201, 176, 0.5)'
 * p1.r;         // 72
 * p1.g;         // 201
 * p1.b;         // 176
 *
 * @example
 * // Centralize colors in a constants file
 * export const PLAYER_COLORS = [color(0x48c9b0), color(0xe74c3c)];
 *
 * // Use anywhere — pick the format you need
 * const meshColor = PLAYER_COLORS[playerId].num;     // Three.js
 * const cssColor = PLAYER_COLORS[playerId].hex;      // DOM styling
 * const fadeColor = PLAYER_COLORS[playerId].rgba(0.5); // Overlay flash
 */
function color(hex: number): Color;
```

---

## Design Decisions

- **No theme system** — Colors are just values. Users centralize them however they want (constants file, config object, etc.). No context, no providers, no runtime swapping.
- **Hex number input** — Three.js uses hex numbers (`0xRRGGBB`) as its color format. Starting from the hex number means the Three.js value is the source of truth.
- **Lazy or eager format derivation** — Implementation detail. Formats can be computed eagerly at creation (simple) or lazily on first access (marginally more efficient if not all formats are used). Either is fine given the low call frequency.
- **Lives with math utilities** — Color is a data transformation utility, like `lerp` or `clamp`. Same conceptual layer in `@pulse-ts/core`.
