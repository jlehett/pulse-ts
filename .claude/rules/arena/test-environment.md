# Arena Demo Test Environment

**Paths:** `demos/arena/**/*.test.ts`

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

## Test File Organization

- Colocate tests with sources: `src/foo.ts` → `src/foo.test.ts`
- One test file per source module
