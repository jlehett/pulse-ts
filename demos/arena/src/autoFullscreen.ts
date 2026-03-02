import { isMobileDevice } from './isMobileDevice';

/**
 * Request fullscreen on the user's first touch interaction.
 *
 * Only activates on touch-capable (mobile) devices. The Fullscreen API
 * requires a user-initiated gesture, so this hooks into the first
 * `touchstart` event. If the request fails (unsupported browser or
 * denied permission), the game continues normally.
 *
 * Once fullscreen is entered, the {@link initLandscapeEnforcer | landscape enforcer}
 * will automatically attempt to lock orientation via the `fullscreenchange` event.
 *
 * @returns A cleanup function that removes the one-shot listener if it
 *          hasn't fired yet.
 *
 * @example
 * ```ts
 * const cleanup = initAutoFullscreen();
 * // later, if needed:
 * cleanup();
 * ```
 */
export function initAutoFullscreen(): () => void {
    // Gate: only run on mobile/tablet devices
    if (!isMobileDevice()) {
        return () => {};
    }

    let removed = false;

    function onFirstTouch(): void {
        if (removed) return;
        removed = true;
        document.removeEventListener('touchstart', onFirstTouch, true);

        if (!document.documentElement.requestFullscreen) return;

        document.documentElement.requestFullscreen().catch(() => {
            // Silently ignore — browser denied or unsupported
        });
    }

    document.addEventListener('touchstart', onFirstTouch, {
        once: true,
        capture: true,
        passive: true,
    });

    return () => {
        if (!removed) {
            removed = true;
            document.removeEventListener('touchstart', onFirstTouch, true);
        }
    };
}
