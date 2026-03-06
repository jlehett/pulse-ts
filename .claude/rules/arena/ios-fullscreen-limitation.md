---
paths:
  - "demos/arena/src/**/*"
---
# iOS Safari Fullscreen API Limitation

## The Problem

iOS Safari does **NOT** support the standard Fullscreen API for web pages:
- `document.documentElement.requestFullscreen()` **fails silently** on iPhone/iPad
- The API works only on `<video>` elements via native playback controls
- Result: no fullscreen support without a workaround

## The Workaround: PWA Mode

Use `manifest.json` + meta tags to enable fullscreen when installed to home screen:

```json
{
  "display": "fullscreen"
}
```

```html
<meta name="apple-mobile-web-app-capable" content="yes">
```

When launched from the home screen, the app runs in **fullscreen mode** (no URL bar, no tabs).

## Arena Implementation

1. **Detection** (`src/installPrompt.ts`):
   - `isIosSafari()` checks UA for iPhone/iPad/iPod + Safari
   - Excludes CriOS, FxiOS, OPiOS (Chrome/Firefox/Opera on iOS)
   - Excludes standalone mode (`window.navigator.standalone === true`)
   - **Guard** `typeof window.matchMedia === 'function'` — jsdom has no matchMedia

2. **Prompt** (`src/installPrompt.ts`):
   - One-time "Add to Home Screen" install suggestion
   - Dismissed via localStorage: `pulse-install-prompt-dismissed`

3. **Android/Chrome**:
   - Standard Fullscreen API works via `autoFullscreen.ts`

## Related Files

- `demos/arena/public/manifest.json` — PWA config
- `demos/arena/index.html` — apple-mobile-web-app-capable meta
- `demos/arena/src/installPrompt.ts` — iOS detection + prompt
- `demos/arena/src/autoFullscreen.ts` — Standard API for non-iOS
