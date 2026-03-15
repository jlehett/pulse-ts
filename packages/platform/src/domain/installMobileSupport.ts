/**
 * Configuration for {@link installMobileSupport}.
 */
export interface MobileSupportOptions {
    /** Request fullscreen on first touch. Default: `true`. */
    fullscreen?: boolean;
    /** Lock orientation. `'landscape'` | `'portrait'` | `'any'`. Default: `'any'`. */
    orientation?: 'landscape' | 'portrait' | 'any';
    /** Show a PWA install prompt banner. Default: `false`. */
    installPrompt?: boolean;
    /** `localStorage` key used to persist install-prompt dismissal. */
    installPromptDismissKey?: string;
}

const DEFAULT_OPTIONS: Required<MobileSupportOptions> = {
    fullscreen: true,
    orientation: 'any',
    installPrompt: false,
    installPromptDismissKey: 'pulse-install-prompt-dismissed',
};

/**
 * Initialize mobile support utilities. Sets up fullscreen on first touch,
 * orientation locking with a rotate overlay, and PWA install prompt.
 * Returns a cleanup function that tears down all listeners and overlays.
 *
 * This function operates at the browser level and is not tied to any
 * World lifecycle. Call it before world creation.
 *
 * @param options - Configuration for mobile support features.
 * @returns A cleanup function that removes all listeners and DOM elements.
 *
 * @example
 * ```ts
 * import { installMobileSupport } from '@pulse-ts/platform';
 *
 * const cleanup = installMobileSupport({
 *     fullscreen: true,
 *     orientation: 'landscape',
 *     installPrompt: true,
 * });
 *
 * // Later, when tearing down:
 * cleanup();
 * ```
 */
export function installMobileSupport(
    options?: MobileSupportOptions,
): () => void {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const cleanups: Array<() => void> = [];

    if (opts.fullscreen) {
        cleanups.push(setupFullscreen());
    }

    if (opts.orientation !== 'any') {
        cleanups.push(setupOrientationLock(opts.orientation));
    }

    if (opts.installPrompt) {
        cleanups.push(setupInstallPrompt(opts.installPromptDismissKey));
    }

    return () => {
        for (const fn of cleanups) fn();
    };
}

// ---------------------------------------------------------------------------
// Fullscreen on first touch
// ---------------------------------------------------------------------------

function setupFullscreen(): () => void {
    let removed = false;

    const handler = () => {
        const el = document.documentElement as HTMLElement & {
            webkitRequestFullscreen?: () => Promise<void>;
        };
        const request =
            el.requestFullscreen?.bind(el) ??
            el.webkitRequestFullscreen?.bind(el);
        request?.();
        document.removeEventListener('touchstart', handler);
        removed = true;
    };

    document.addEventListener('touchstart', handler, { once: true });

    return () => {
        if (!removed) {
            document.removeEventListener('touchstart', handler);
        }
    };
}

// ---------------------------------------------------------------------------
// Orientation lock + rotate overlay
// ---------------------------------------------------------------------------

function setupOrientationLock(target: 'landscape' | 'portrait'): () => void {
    // Only apply orientation lock on mobile/tablet devices
    const isTouchDevice =
        'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return () => {};

    // Try the Screen Orientation API
    const lockOrientation = () => {
        screen.orientation?.lock?.(target).catch(() => {
            /* ignore — lock may not be available outside fullscreen */
        });
    };
    lockOrientation();

    // Create a rotate overlay for when the orientation is wrong
    const overlay = document.createElement('div');
    overlay.setAttribute('data-pulse-rotate-overlay', '');
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '999999',
        background: 'rgba(0,0,0,0.92)',
        color: '#fff',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: '2rem',
    } as CSSStyleDeclaration);
    overlay.textContent =
        target === 'landscape'
            ? 'Please rotate your device to landscape'
            : 'Please rotate your device to portrait';
    document.body.appendChild(overlay);

    const update = () => {
        const isLandscape = globalThis.innerWidth > globalThis.innerHeight;
        const isCorrect = target === 'landscape' ? isLandscape : !isLandscape;
        overlay.style.display = isCorrect ? 'none' : 'flex';
    };

    globalThis.addEventListener('resize', update);
    update();

    return () => {
        globalThis.removeEventListener('resize', update);
        screen.orientation?.unlock?.();
        overlay.remove();
    };
}

// ---------------------------------------------------------------------------
// PWA install prompt
// ---------------------------------------------------------------------------

function setupInstallPrompt(dismissKey: string): () => void {
    // Check if already dismissed
    try {
        if (localStorage.getItem(dismissKey)) return () => {};
    } catch {
        /* localStorage may be unavailable */
    }

    let deferredEvent: (BeforeInstallPromptEvent & Event) | null = null;
    let banner: HTMLElement | null = null;

    const onBeforeInstall = (e: Event) => {
        e.preventDefault();
        deferredEvent = e as BeforeInstallPromptEvent & Event;
        showBanner();
    };

    globalThis.addEventListener(
        'beforeinstallprompt',
        onBeforeInstall as EventListener,
    );

    function showBanner() {
        banner = document.createElement('div');
        banner.setAttribute('data-pulse-install-banner', '');
        Object.assign(banner.style, {
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            zIndex: '999998',
            background: '#222',
            color: '#fff',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '0.95rem',
        } as CSSStyleDeclaration);

        const text = document.createElement('span');
        text.textContent = 'Install this app for the best experience';

        const actions = document.createElement('span');

        const installBtn = document.createElement('button');
        installBtn.textContent = 'Install';
        Object.assign(installBtn.style, {
            background: '#4a9eff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.4rem 1rem',
            cursor: 'pointer',
            marginRight: '0.5rem',
            fontSize: '0.9rem',
        } as CSSStyleDeclaration);
        installBtn.addEventListener('click', () => {
            deferredEvent?.prompt?.();
            removeBanner();
        });

        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Not now';
        Object.assign(dismissBtn.style, {
            background: 'transparent',
            color: '#aaa',
            border: '1px solid #555',
            borderRadius: '4px',
            padding: '0.4rem 1rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
        } as CSSStyleDeclaration);
        dismissBtn.addEventListener('click', () => {
            try {
                localStorage.setItem(dismissKey, '1');
            } catch {
                /* ignore */
            }
            removeBanner();
        });

        actions.appendChild(installBtn);
        actions.appendChild(dismissBtn);
        banner.appendChild(text);
        banner.appendChild(actions);
        document.body.appendChild(banner);
    }

    function removeBanner() {
        banner?.remove();
        banner = null;
    }

    return () => {
        globalThis.removeEventListener(
            'beforeinstallprompt',
            onBeforeInstall as EventListener,
        );
        removeBanner();
    };
}

/**
 * Non-standard `BeforeInstallPromptEvent` interface available in
 * Chromium-based browsers.
 */
interface BeforeInstallPromptEvent {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
