Purpose

- Modular TypeScript game engine, publishable to npm, broad use-cases.
- Keep code clean, maintainable, understandable. Prefer clarity over cleverness.

Design docs

- Design/architecture plans go in the design-docs/ directory and can be written in simple markdown files.
- Before implementing significant features or changes, create a design doc and seek feedback from the user.
- Iterate on design docs based on feedback prior to implementation.
- Once a design is approved, you can proceed with implementation, using the design doc as a reference.

Repo facts

- TypeScript everywhere; strict mode at public boundaries.
- Docs: apps/docs/ (VitePress) with guides/ and learn/; keep current with code changes.
- Tests are colocated with sources (foo.ts, foo.test.ts).
- Focused directories: group similar things; prefer depth over width when it aids comprehension.

Architecture

- Layered design:
    - Top: human-readable orchestration; no impl details.
    - Middle: domain logic and reusable patterns; clear interfaces.
    - Bottom: implementation (IO, adapters, platform).
- Use patterns when they reduce coupling/complexity (Strategy, Factory, Adapter, Observer, Command). Explain non-obvious choices briefly in comments.
- Functional components/entities:
    - Public APIs follow a function-first style (similar to React FCs).
    - Favor pure functions, explicit inputs/outputs, injected deps.

Refactoring policy

- Embrace aggressive refactors: rename/move files, functions, and modules; restructure layers and APIs.
- No backward-compatibility requirements at this stage.
- Prefer breaking changes that simplify architecture and move the design forward.
- When breaking: update tests, JSDoc, and apps/docs/ (guides/ and learn/).

Public API rules

- Small, stable surfaces; export factories and pure helpers.
- Avoid exporting mutable classes unless clearly beneficial.
- Every exported symbol must have JSDoc with params/returns and a minimal runnable example when relevant.

Testing

- Everything has automated tests and coverage.
- Colocated tests: \*.test.ts
- Mock external IO at boundaries; keep tests fast and deterministic.
- Command to test a subpackage:
  npm test -w packages/{packageName} --silent
- Add/update tests with any code change.

Documentation

- Prefer extensive JSDoc coverage; mandatory for anything public-facing. JSDoc should include `@param`, `@returns`, `@example`, and any other relevant tags.
- Update apps/docs/ when APIs/behavior change.
- Keep guides/ and learn/ current; mirror public API examples from JSDoc.
- For new modules, include: overview, quickstart, limitations/trade-offs.

Coding standards

- Explicit types at public boundaries.
- Enforce layer boundaries: depend downward through interfaces only.
- Keep files focused; split when responsibilities multiply.
- Prefer function-first designs; use classes only with clear encapsulation wins.

Linting and formatting

- After changes in a subpackage:
  npm lint:fix
- Fix all lint and type errors before commit.

Dev workflow

- Implement within the correct layer; write/update colocated tests.
- Keep directory grouping coherent; choose deeper structure to reduce cross-cutting imports.
- Update JSDoc and examples for public API changes.
- Update apps/docs/ guides/ learn/ in the same PR when behavior or APIs change.
- Verify:
    - Tests: npm test -w packages/{packageName} --silent
    - Lint: npm lint:fix

PR instructions

- Title: [packages/{packageName}] Short, imperative summary
- Before pushing: run npm lint:fix (in subpackage) and npm test -w packages/{packageName} --silent
- Call out breaking changes and architectural boundary updates.
- Link to updated docs pages when applicable.

Directory conventions (example)

- packages/
    - rendering/
        - src/
            - public/ // exported APIs (functional components/entities)
            - domain/ // core logic, patterns
            - infra/ // adapters, IO, platform specifics
            - utils/ // pure helpers
            - index.ts
            - foo.ts
            - foo.test.ts
        - package.json
- apps/
    - docs/
        - guides/
        - learn/

Release and publish checklist

- package.json: correct name, version, main/module/types/exports.
- Remove private: true for publishable packages.
- Public APIs documented; examples compile.
- Tests pass locally for the package and its dependents.
- Changelog or brief release notes when meaningful.

Non-goals

- No cross-layer imports that violate boundaries.
- No wide, flat directories when deeper structure improves clarity.
- No merges without tests, JSDoc, and docs updates.
