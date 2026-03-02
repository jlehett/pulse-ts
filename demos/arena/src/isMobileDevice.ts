/**
 * Detect whether the current device is a mobile/tablet (touch-primary).
 *
 * Uses the `pointer: coarse` media query as the primary signal — this
 * correctly identifies phones and tablets while excluding touch-enabled
 * laptops (which report `pointer: fine` for their primary input).
 * Falls back to `navigator.maxTouchPoints > 0` when `matchMedia` is
 * unavailable.
 *
 * @returns `true` on phones and tablets, `false` on desktop/laptop.
 *
 * @example
 * ```ts
 * if (isMobileDevice()) {
 *     // show touch controls
 * }
 * ```
 */
export function isMobileDevice(): boolean {
    if (typeof navigator === 'undefined') return false;

    // Primary check: coarse pointer = finger-based input device
    if (typeof window.matchMedia === 'function') {
        return window.matchMedia('(pointer: coarse)').matches;
    }

    // Fallback for environments without matchMedia
    return navigator.maxTouchPoints > 0;
}
