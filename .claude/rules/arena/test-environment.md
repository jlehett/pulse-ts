---
paths:
  - "demos/arena/**/*.test.ts"
---
# Arena Demo Test Environment

## Test Runner & Transform

- Uses **Jest** (not Vitest) — configured in `demos/arena/jest.config.mjs`
- Babel transform: `@babel/preset-env` + `@babel/preset-typescript`
- **Do NOT import test globals** (`describe`, `it`, `expect`, `jest`) — they are available without imports
- **Do NOT import from 'vitest'** — Jest and Vitest APIs differ; Arena uses Jest

## Running Tests

```bash
npm test -w demos/arena --silent
```

## jsdom Environment Quirks

The jsdom test environment has **no built-in `window.matchMedia`**.

### Correct: Assign directly
```typescript
window.matchMedia = jest.fn().mockReturnValue({
  matches: false,
  media: '(max-width: 768px)',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});
```

### Incorrect: Do NOT use `jest.spyOn(window, 'matchMedia')`
This will fail because the property does not exist on the jsdom window object.

## `import.meta.env` Is Not Available in Jest

Babel/Jest cannot parse `import.meta` syntax (`SyntaxError: Cannot use 'import.meta' outside a module`). Modules that use `import.meta.env.BASE_URL` or similar Vite-specific APIs must isolate the access behind a thin wrapper module that can be mocked in tests.

### Pattern: Wrapper Module

```typescript
// baseUrl.ts — thin wrapper, isolates import.meta from Jest
export function getBaseUrl(): string {
    return import.meta.env.BASE_URL;
}
```

```typescript
// myModule.test.ts — mock the wrapper
jest.mock('./baseUrl', () => ({
    getBaseUrl: () => '/demos/arena/',
}));
```

### Vite `define` Constants (e.g., `__APP_VERSION__`)

Bare identifier constants injected via Vite's `define` config (like `__APP_VERSION__`) are not available in Jest by default. Use the `globals` option in `jest.config.mjs`:

```js
globals: {
    __APP_VERSION__: 'test-abc',
},
```

## Test File Organization

- Colocate tests with sources: `src/foo.ts` → `src/foo.test.ts`
- One test file per source module
