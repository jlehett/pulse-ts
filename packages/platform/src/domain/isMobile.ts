/**
 * Detect if the current device is touch-primary (mobile/tablet).
 *
 * Uses a combination of user-agent sniffing and touch capability detection
 * to determine whether the device is likely a mobile or tablet.
 *
 * @returns `true` if the device is likely a mobile or tablet.
 *
 * @example
 * ```ts
 * import { isMobile } from '@pulse-ts/platform';
 *
 * if (isMobile()) {
 *     three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
 * }
 * ```
 */
export function isMobile(): boolean {
    if (typeof navigator === 'undefined') return false;

    const hasTouch =
        'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;

    const mobileUaPattern =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUa = mobileUaPattern.test(navigator.userAgent);

    return hasTouch && isMobileUa;
}
