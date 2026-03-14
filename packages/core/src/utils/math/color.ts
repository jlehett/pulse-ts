/**
 * A color value with automatic format conversion.
 *
 * Created via {@link color}. Provides access to the same color in
 * multiple common formats: hex number, CSS hex string, CSS rgb/rgba
 * strings, and individual channel values.
 */
export interface Color {
    /** Original hex number (e.g., `0x48c9b0`). */
    readonly num: number;
    /** CSS hex string (e.g., `'#48c9b0'`). */
    readonly hex: string;
    /** CSS rgb string (e.g., `'rgb(72, 201, 176)'`). */
    readonly rgb: string;
    /** Red component (0–255). */
    readonly r: number;
    /** Green component (0–255). */
    readonly g: number;
    /** Blue component (0–255). */
    readonly b: number;
    /**
     * CSS rgba string with the specified alpha.
     *
     * @param alpha - Opacity value (0–1).
     * @returns CSS rgba string (e.g., `'rgba(72, 201, 176, 0.5)'`).
     */
    rgba(alpha: number): string;
}

/**
 * Create a color from a hex number with automatic format conversion.
 *
 * Takes a hex number (the format used by Three.js) and returns a
 * {@link Color} object that provides all common format conversions:
 * CSS hex string, rgb/rgba strings, and individual channel values.
 *
 * @param hex - Color as a hex number (e.g., `0x48c9b0`).
 * @returns A {@link Color} object with all common format conversions.
 *
 * @example
 * ```ts
 * import { color } from '@pulse-ts/core';
 *
 * const p1 = color(0x48c9b0);
 * p1.hex;       // '#48c9b0'
 * p1.num;       // 0x48c9b0
 * p1.rgb;       // 'rgb(72, 201, 176)'
 * p1.rgba(0.5); // 'rgba(72, 201, 176, 0.5)'
 * p1.r;         // 72
 * p1.g;         // 201
 * p1.b;         // 176
 * ```
 *
 * @example
 * ```ts
 * // Centralize colors in a constants file
 * export const PLAYER_COLORS = [color(0x48c9b0), color(0xe74c3c)];
 *
 * // Use anywhere — pick the format you need
 * const meshColor = PLAYER_COLORS[playerId].num;       // Three.js
 * const cssColor = PLAYER_COLORS[playerId].hex;        // DOM styling
 * const fadeColor = PLAYER_COLORS[playerId].rgba(0.5); // Overlay flash
 * ```
 */
export function color(hex: number): Color {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    const hexStr = `#${hex.toString(16).padStart(6, '0')}`;
    const rgbStr = `rgb(${r}, ${g}, ${b})`;

    return {
        num: hex,
        hex: hexStr,
        rgb: rgbStr,
        r,
        g,
        b,
        rgba(alpha: number): string {
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },
    };
}
