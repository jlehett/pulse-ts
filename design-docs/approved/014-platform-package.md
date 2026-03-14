# Approved: Mobile Device Utilities Package (`@pulse-ts/platform`)

> Browser/device utilities for mobile support — device detection, fullscreen, orientation locking, and PWA install prompts.

**Origin:** Engine Improvements #14 (Mobile Device Utilities).

---

## Summary

A new `@pulse-ts/platform` package with utilities for mobile game support:

1. **`isMobile()`** — Detect if the device is touch-primary (mobile/tablet).
2. **`installMobileSupport()`** — One-call setup for fullscreen, orientation locking, and PWA install prompt.

---

## Problem

The arena demo has 4 separate files implementing mobile device support (`isMobileDevice.ts`, `autoFullscreen.ts`, `landscapeEnforcer.ts`, `installPrompt.ts`). These are not game-specific — any mobile-targeted game needs the same utilities. Currently each game must copy them.

---

## API

### `isMobile`

```typescript
/**
 * Detect if the device is touch-primary (mobile/tablet).
 *
 * @returns True if the device is likely a mobile/tablet.
 *
 * @example
 * if (isMobile()) {
 *     three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
 * }
 */
function isMobile(): boolean;
```

### `installMobileSupport`

```typescript
interface MobileSupportOptions {
    /** Request fullscreen on first touch. Default: true. */
    fullscreen?: boolean;
    /** Lock orientation. 'landscape' | 'portrait' | 'any'. Default: 'any'. */
    orientation?: 'landscape' | 'portrait' | 'any';
    /** Show PWA install prompt. Default: false. */
    installPrompt?: boolean;
    /** localStorage key for dismissing install prompt. */
    installPromptDismissKey?: string;
}

/**
 * Initialize mobile support utilities. Sets up fullscreen on first touch,
 * orientation locking with a rotate overlay, and PWA install prompt.
 * Returns a cleanup function that tears down all listeners and overlays.
 *
 * @param options - Configuration for mobile support features.
 * @returns Cleanup function.
 *
 * @example
 * import { installMobileSupport } from '@pulse-ts/platform';
 *
 * const cleanup = installMobileSupport({
 *     fullscreen: true,
 *     orientation: 'landscape',
 *     installPrompt: true,
 * });
 */
function installMobileSupport(options?: MobileSupportOptions): () => void;
```

---

## Usage Example

```typescript
import { isMobile, installMobileSupport } from '@pulse-ts/platform';

// Set up mobile support before world creation
installMobileSupport({
    fullscreen: true,
    orientation: 'landscape',
    installPrompt: true,
});

// Query throughout the app
if (isMobile()) {
    three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
}
```

---

## Design Decisions

- **Dedicated package** — Keeps `@pulse-ts/core` lean. `@pulse-ts/platform` is a natural home for future platform concerns (device capabilities, performance tier detection, PWA utilities, etc.).
- **Opt-in features** — Each feature (fullscreen, orientation, install prompt) is independently togglable. No mandatory bundle.
- **Returns cleanup function** — Allows tearing down listeners and overlays if needed (e.g., switching between game and non-game UI).
- **Not tied to the World lifecycle** — Called before world creation, operates at the browser level.
