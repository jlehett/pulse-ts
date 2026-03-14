# Guide: Mobile Support with @pulse-ts/platform

Detect mobile devices and set up fullscreen, orientation locking, and PWA install prompts with a single call.

## Install

```bash
npm install @pulse-ts/platform
```

## Quick start

```ts
import { isMobile, installMobileSupport } from '@pulse-ts/platform';

// Set up mobile support before world creation
const cleanup = installMobileSupport({
    fullscreen: true,
    orientation: 'landscape',
    installPrompt: true,
});

// Query device type anywhere in your app
if (isMobile()) {
    three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
}
```

## API

### `isMobile()`

Returns `true` if the device is likely a mobile or tablet, using a combination of user-agent detection and touch capability checks.

```ts
if (isMobile()) {
    // Reduce quality for mobile
    three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
}
```

### `installMobileSupport(options?)`

One-call setup for common mobile game requirements. Returns a cleanup function.

```ts
const cleanup = installMobileSupport({
    fullscreen: true,          // Request fullscreen on first touch (default: true)
    orientation: 'landscape',  // Lock orientation: 'landscape' | 'portrait' | 'any' (default: 'any')
    installPrompt: true,       // Show PWA install banner (default: false)
    installPromptDismissKey: 'my-app-install-dismissed', // localStorage key for dismissal
});

// Tear down when leaving the game
cleanup();
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fullscreen` | `boolean` | `true` | Request fullscreen on first touch. |
| `orientation` | `'landscape' \| 'portrait' \| 'any'` | `'any'` | Lock screen orientation and show a rotate overlay when wrong. |
| `installPrompt` | `boolean` | `false` | Capture the `beforeinstallprompt` event and show an install banner. |
| `installPromptDismissKey` | `string` | `'pulse-install-prompt-dismissed'` | `localStorage` key to persist user dismissal. |

## Features

### Fullscreen on first touch

When `fullscreen: true`, the first `touchstart` event triggers `requestFullscreen()` on the document element. The listener is automatically removed after the first touch.

### Orientation lock

When `orientation` is `'landscape'` or `'portrait'`:

1. Attempts to lock orientation via the Screen Orientation API.
2. Displays a full-screen rotate overlay when the device is in the wrong orientation.
3. The overlay automatically hides when the orientation is correct.

### PWA install prompt

When `installPrompt: true`:

1. Captures the browser's `beforeinstallprompt` event.
2. Displays a bottom banner with "Install" and "Not now" buttons.
3. Dismissal is persisted to `localStorage` using the configured key.

## Limitations

- `isMobile()` uses user-agent sniffing combined with touch detection. It may not cover all edge cases (e.g., desktop browsers with touch screens return `false`).
- Orientation lock via the Screen Orientation API requires fullscreen mode in most browsers.
- The PWA install prompt (`beforeinstallprompt`) is only available in Chromium-based browsers.
