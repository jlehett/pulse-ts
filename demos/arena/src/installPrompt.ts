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
 * Check whether the prompt was previously dismissed.
 *
 * @returns `true` if the user has already dismissed the install prompt.
 */
function wasDismissed(): boolean {
    try {
        return localStorage.getItem(DISMISSED_KEY) !== null;
    } catch {
        return false;
    }
}

/**
 * Mark the prompt as dismissed so it won't appear again.
 */
function markDismissed(): void {
    try {
        localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
        // localStorage unavailable — prompt will reappear next visit
    }
}

/**
 * Create the install prompt banner DOM element.
 *
 * @param messageHtml - The HTML content for the banner message.
 * @param actions - Optional extra buttons (e.g. "Install" for Android).
 * @returns The banner element and a dismiss function.
 */
function createBanner(
    messageHtml: string,
    actions?: HTMLElement[],
): { banner: HTMLElement; dismiss: () => void } {
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
    text.innerHTML = messageHtml;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715';
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
        markDismissed();
    }

    closeBtn.addEventListener('click', dismiss);

    banner.appendChild(text);
    if (actions) {
        actions.forEach((a) => banner.appendChild(a));
    }
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);

    return { banner, dismiss };
}

/**
 * Show a platform-appropriate "install as app" prompt for fullscreen support.
 *
 * - **iOS Safari**: Shows a banner explaining how to use Share → Add to Home Screen.
 * - **Android Chrome**: Listens for the `beforeinstallprompt` event and shows
 *   a banner with an "Install" button that triggers the native install flow.
 * - **Other browsers / already installed**: No-op.
 *
 * The prompt is displayed once per device — after the user dismisses it,
 * a localStorage flag prevents it from reappearing.
 *
 * @returns A cleanup function that removes the prompt and event listeners.
 *
 * @example
 * ```ts
 * const cleanup = showInstallPrompt();
 * ```
 */
export function showInstallPrompt(): () => void {
    if (wasDismissed()) return () => {};

    // ── iOS Safari: manual instructions ──

    if (isIosSafari()) {
        const { banner } = createBanner(
            'For fullscreen: tap <strong style="color:#fff">Share</strong> ' +
                '\u2192 <strong style="color:#fff">Add to Home Screen</strong>',
        );
        return () => {
            banner.remove();
        };
    }

    // ── Android / Chrome: beforeinstallprompt ──

    let deferredPrompt: BeforeInstallPromptEvent | null = null;
    let bannerEl: HTMLElement | null = null;
    let dismissFn: (() => void) | null = null;

    function onBeforeInstallPrompt(e: Event): void {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;

        if (wasDismissed()) return;

        const installBtn = document.createElement('button');
        installBtn.textContent = 'Install';
        Object.assign(installBtn.style, {
            font: 'bold 14px sans-serif',
            color: '#fff',
            backgroundColor: '#48c9b0',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 16px',
            cursor: 'pointer',
            flexShrink: '0',
        } as Partial<CSSStyleDeclaration>);

        installBtn.addEventListener('click', () => {
            deferredPrompt?.prompt();
            deferredPrompt?.userChoice.then(() => {
                deferredPrompt = null;
                dismissFn?.();
            });
        });

        const result = createBanner(
            'Install as app for the best fullscreen experience',
            [installBtn],
        );
        bannerEl = result.banner;
        dismissFn = result.dismiss;
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => {
        window.removeEventListener(
            'beforeinstallprompt',
            onBeforeInstallPrompt,
        );
        bannerEl?.remove();
    };
}

/**
 * The `beforeinstallprompt` event interface fired by Chromium browsers
 * when the page meets PWA install criteria.
 */
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
