/**
 * Enforce landscape orientation on mobile devices.
 *
 * Uses a two-pronged approach:
 * 1. **Orientation Lock API** — Attempts `screen.orientation.lock('landscape')`
 *    whenever fullscreen is entered. Silently falls back when unsupported.
 * 2. **Portrait overlay** — Shows a "Please rotate your device" overlay when
 *    the device is in portrait mode and orientation lock is unavailable.
 *
 * Only activates on touch-capable devices. Desktop is unaffected.
 *
 * @returns A cleanup function that removes event listeners and the overlay.
 *
 * @example
 * ```ts
 * const cleanup = initLandscapeEnforcer();
 * // later, if needed:
 * cleanup();
 * ```
 */
export function initLandscapeEnforcer(): () => void {
    // Gate: only run on touch-capable (mobile) devices
    if (typeof navigator === 'undefined' || navigator.maxTouchPoints <= 0) {
        return () => {};
    }

    let orientationLocked = false;

    // ── Orientation Lock API ──

    function tryLockOrientation(): void {
        if (!screen.orientation?.lock) return;
        screen.orientation
            .lock('landscape')
            .then(() => {
                orientationLocked = true;
                updateOverlay();
            })
            .catch(() => {
                // Silently ignore — not supported or not in fullscreen
            });
    }

    function onFullscreenChange(): void {
        if (document.fullscreenElement) {
            tryLockOrientation();
        } else {
            orientationLocked = false;
            updateOverlay();
        }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);

    // Try immediately in case we're already fullscreen
    tryLockOrientation();

    // ── Portrait overlay ──

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '9999',
        display: 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        backgroundColor: 'rgba(10, 10, 26, 0.95)',
    } as Partial<CSSStyleDeclaration>);

    const icon = document.createElement('div');
    Object.assign(icon.style, {
        fontSize: '64px',
        lineHeight: '1',
    } as Partial<CSSStyleDeclaration>);
    icon.textContent = '\u{1F4F1}'; // 📱 mobile phone emoji

    const message = document.createElement('div');
    Object.assign(message.style, {
        font: 'bold clamp(18px, 5vw, 28px) sans-serif',
        color: '#fff',
        textAlign: 'center',
        padding: '0 24px',
    } as Partial<CSSStyleDeclaration>);
    message.textContent = 'Please rotate your device to landscape';

    const hint = document.createElement('div');
    Object.assign(hint.style, {
        font: 'clamp(12px, 3vw, 16px) sans-serif',
        color: '#888',
        textAlign: 'center',
        padding: '0 24px',
    } as Partial<CSSStyleDeclaration>);
    hint.textContent = 'This game is best played in landscape orientation';

    overlay.appendChild(icon);
    overlay.appendChild(message);
    overlay.appendChild(hint);
    document.body.appendChild(overlay);

    // ── Orientation detection ──

    const portraitQuery = window.matchMedia('(orientation: portrait)');

    function updateOverlay(): void {
        const isPortrait = portraitQuery.matches;
        // Show overlay when in portrait AND orientation isn't locked
        const show = isPortrait && !orientationLocked;
        overlay.style.display = show ? 'flex' : 'none';
    }

    portraitQuery.addEventListener('change', updateOverlay);
    updateOverlay();

    // ── Cleanup ──

    return () => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        portraitQuery.removeEventListener('change', updateOverlay);
        overlay.remove();
    };
}
