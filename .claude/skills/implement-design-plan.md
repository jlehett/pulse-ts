---
name: implement-design-plan
decision: Implements PR-sized work from an approved design doc. Selects the design doc to implement, derives the next slice of work, branches off the design doc's implementation branch, and iterates through subagent sign-off (code-reviewer → bug-hunter → refactorer → test-author → docs-writer) until ready to open a PR.
---

When beginning implementation work for this project, follow this process.

Process:

0) Choose the design doc to implement
  - Ask the user which design doc in `design-docs/` we should implement.
  - If the user provides a path, use it. If multiple candidates exist, ask the user to pick one.

1) Determine the next PR-sized slice of work
  - Read the chosen design doc.
  - Identify the "next slice" to implement (the smallest coherent increment described by the plan).
  - Define a crisp scope:
    - What code changes will be made and where
    - What tests will be added/updated
    - What "done" means for this slice
  - Confirm any open questions called out by the design doc that block implementation, and resolve them with the user.

2) Create a new branch for this slice (must be based on the latest branch named in the design doc)
  - Find the branch name recorded in the design doc (e.g., under "Implementation branch").
  - Ensure you branch from the latest state of that branch (not a stale local copy).
  - Commands:
    - `git fetch origin`
    - `git checkout <design-branch>`
    - `git pull --ff-only origin <design-branch>`
    - `git checkout -b <slice-branch>`
  - Slice branch naming:
    - Use short, kebab-case, descriptive names.
    - Prefer: `feat/<area>-<slice>` or `chore/<area>-<slice>` or `fix/<area>-<slice>`.
    - Keep the slice branch clearly related to the design branch intent.

3) Implement and iterate until all subagents sign off
  - Loop until all steps pass and the work is ready for PR.

    Loop steps:

    3.1) Implement (main agent)
      - Implement only what is required for the chosen PR-sized slice.
      - Follow layered architecture boundaries:
        - Top: orchestration (human-readable)
        - Middle: domain logic + patterns
        - Bottom: infra/adapters/IO
      - Keep files focused; split when responsibilities multiply.
      - Use explicit types at public boundaries.
      - Prefer function-first APIs; avoid exporting mutable classes unless clearly beneficial.

    3.2) Review (code-reviewer subagent)
      - Invoke code-reviewer subagent
      - If code-reviewer reports anything, fix them and repeat from 3.1.

    3.3) Adversarial review (bug-hunter subagent)
      - Invoke bug-hunter subagent.
      - If bug-hunter reports any issues, fix them and repeat from 3.1.

    3.4) Cleanup (refactorer subagent)
      - Invoke refactorer subagent.
      - Apply refactors that preserve behavior and improve structure.
      - If refactor introduces new concerns, repeat from 3.2.

    3.5) Tests (test-author subagent)
      - Invoke test-author subagent.
      - Add/update colocated tests (*.test.ts) for all changed behavior.
      - Keep tests fast and deterministic; mock external IO at boundaries.
      - If tests require code adjustments for testability, implement them and repeat from 3.2.

    3.6) Run automated tests (must be reen)
      - Run the relevant package tests:
        - `npm test -w packages/{packageName} --silent`
      - Fix any failures and repeat from 3.2.
      - Do not proceed until tests pass.

    3.7) Documentation (docs-writer subagent)
      - Invoke docs-writer subagent.
      - Update JSDoc for public APIs and apps/docs/ (guides/ and learn/) as needed.
      - Ensure examples are minimal and runnable.
      - If docs changes reveal missing behavior/tests, implement fixes and repeat from 3.2.

4) Finalize for PR
  - Confirm:
    - Tests pass for the package and any impacted dependents (if applicable)
    - Lint/type errors are clean (run `npm lint:fix` if required by workflow)
    - Design doc remains consistent with what was implemented in this slice
  - Tell the user the work is complete and ready to open a PR.
  - Provide a concise summary:
    - What changed (high level)
    - Files/areas touched
    - How to test
    - Any follow-ups (next slice suggestions)

Output format requirements:
- Always start by asking which design doc to implement.
- Always state the selected "next slice" scope before coding.
- Always report subagent findings and what changed in response.
- Always end with "Ready to create a PR" once all sign-offs and tests are complete.

Rules:
- Branch must be created from the latest version of the branch recorded in the design doc.
- Do not skip subagents or reorder the sign-off sequence.
- If any subagent finds issues, iterate until resolved.
- Do not proceed to docs until tests are green.