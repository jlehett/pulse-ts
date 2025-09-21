Purpose
- This repo is a modular TypeScript game engine intended for npm publication and a wide range of use-cases.
- Keep code clean, maintainable, understandable. Prefer clarity over cleverness.

Repo facts
- Language: TypeScript.
- Docs app: apps/docs/ (VitePress) with guides/ and learn/ subdirs; keep these current with code changes.
- Tests are colocated with source files (e.g., foo.ts and foo.test.ts in the same directory).
- Focused directory structure: group similar things; prefer depth over width when it improves comprehension.

Architecture
- Layered design.
  - Top layer: human-readable orchestration, near plain English; no implementation details.
  - Middle layers: domain logic and reusable patterns; stable boundaries, clear interfaces.
  - Bottom layer: implementation details (IO, platform, adapters).
- Use design patterns where they reduce complexity and coupling (examples: Strategy, Factory, Adapter, Observer, Command). Justify pattern choice in code comments when non-obvious.
- Functional components/entities:
  - Public APIs should lean into a functional style similar to React function components.
  - Favor pure functions and explicit inputs/outputs. Avoid hidden state; prefer injected dependencies.
  - Example shape:
    - createX(opts): returns an object of pure functions and data, or a function (system) that processes ECS-like state.
    - Systems process immutable snapshots or controlled mutations behind interfaces.

Public API rules
- Stable, small surface areas. Export factories and pure helpers; avoid exporting classes with mutable internals unless required.
- Each exported symbol must have JSDoc with param/returns and runnable example when relevant.
- Avoid breaking changes. If unavoidable, document migration steps in apps/docs/guides/.

Testing
- Everything must have automated tests and coverage.
- Colocated tests next to sources: *.test.ts
- Prefer fast, deterministic tests. Mock external IO at boundaries.
- Command to test a subpackage:
  npm test -w packages/{packageName} --silent
- Add/update tests with code changes.

Documentation
- Update VitePress content in apps/docs/ when APIs or behavior change.
- Keep guides/ and learn/ current; add short examples mirroring public API JSDocs.
- When adding a new module, include:
  - High-level overview (what/why)
  - Quickstart code snippet

Coding standards
- TypeScript strict mode. Prefer explicit types on public boundaries.
- JSDoc required for all public exports. Include examples and notes about performance or pitfalls.
- Enforce layered boundaries: top layers may depend on lower layers via interfaces only; never import upward.
- Keep files focused. If a file exceeds one responsibility, split it.
- Prefer function-first design; use classes only for clear encapsulation benefits.

Linting and formatting
- Run after changes inside the subpackage:
  npm lint:fix
- Fix all lint and type errors before commit.

Dev workflow
- Implement feature in the appropriate layer; write or update tests alongside the code.
- Keep directory grouping coherent. When in doubt, create a deeper folder to reduce cross-cutting imports.
- Ensure JSDocs and examples are added/updated for public API changes.
- Update apps/docs/ guides/ learn/ as part of the same PR when behavior or APIs change.
- Verify commands:
  - Test subpackage: npm test -w packages/{packageName} --silent
  - Lint fix in subpackage: npm lint:fix

PR instructions
- Title format: [packages/{packageName}] Short, imperative summary
- Before pushing:
  - npm lint:fix (in the subpackage)
  - npm test -w packages/{packageName} --silent
- Include notes on architectural impact if boundaries changed.
- Link to updated docs pages when applicable.

Directory conventions (example)
- packages/
  - rendering/
    - src/
      - public/        // exported APIs (functional components/entities)
      - domain/        // core logic, patterns
      - infra/         // adapters, IO, platform specifics
      - utils/         // pure helpers
      - index.ts
      - foo.ts
      - foo.test.ts
    - package.json
- apps/
  - docs/
    - guides/
    - learn/

Release and publish (checklist)
- Package.json has correct name, version, main/module/types/exports fields.
- No private: true for publishable packages.
- Public APIs documented; examples compile.
- Tests pass locally for the package and dependents.
- Changelog entry or release notes included when meaningful.

Non-goals
- Do not introduce cross-layer imports that violate boundaries.
- Do not add wide, flat directories when deeper structure improves clarity.
- Do not merge code without tests, JSDoc, and docs updates.

