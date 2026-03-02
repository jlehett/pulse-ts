/** LocalStorage key used to suppress the prompt after dismissal. */
const DISMISSED_KEY = 'pulse-install-prompt-dismissed';

/**
 * Detect whether the current browser is Safari on iOS (not already in
 * standalone/PWA mode).
 *
 * @returns `true` when the page is running in mobile Safari's normal
 *          browsing mode (not added to home screen).
 */
export function isIosSafari(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
    const isStandalone =
        ('standalone' in navigator &&
            (navigator as unknown as { standalone: boolean }).standalone) ||
        (typeof window.matchMedia === 'function' &&
            window.matchMedia('(display-mode: standalone)').matches);
    return isIos && isSafari && !isStandalone;
}

/**
 * Show a one-time "Add to Home Screen" prompt for iOS Safari users.
 *
 * The prompt explains that adding the game to the home screen enables
 * fullscreen mode. It is displayed once per device — after the user
 * dismisses it, a localStorage flag prevents it from reappearing.
 *
 * On non-iOS browsers or when already in standalone mode, this is a no-op.
 *
 * @returns A cleanup function that removes the prompt element.
 *
 * @example
 * ```ts
 * const cleanup = showInstallPrompt();
 * ```
 */
export function showInstallPrompt(): () => void {
    if (!isIosSafari()) return () => {};

    // Don't show again if previously dismissed
    try {
        if (localStorage.getItem(DISMISSED_KEY)) return () => {};
    } catch {
        // localStorage unavailable — show prompt anyway
    }

    const banner = document.createElement('div');
    Object.assign(banner.style, {
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: '10000',
        padding: '16px 20px',
        backgroundColor: 'rgba(10, 10, 26, 0.95)',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
    } as Partial<CSSStyleDeclaration>);

    const text = document.createElement('div');
    Object.assign(text.style, {
        font: '14px sans-serif',
        color: '#ccc',
        textAlign: 'center',
        lineHeight: '1.5',
    } as Partial<CSSStyleDeclaration>);
    text.innerHTML =
        'For fullscreen: tap <strong style="color:#fff">Share</strong> ' +
        '→ <strong style="color:#fff">Add to Home Screen</strong>';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, {
        font: 'bold 18px sans-serif',
        color: '#888',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 8px',
        flexShrink: '0',
    } as Partial<CSSStyleDeclaration>);

    function dismiss(): void {
        banner.remove();
        try {
            localStorage.setItem(DISMISSED_KEY, '1');
        } catch {
            // localStorage unavailable — prompt will reappear next visit
        }
    }

    closeBtn.addEventListener('click', dismiss);

    banner.appendChild(text);
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);

    return () => {
        banner.remove();
    };
}
