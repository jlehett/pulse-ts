---
name: plan-next-work
description: Plans the next piece of work end-to-end. Picks the next task, creates a fresh branch off main, and produces/updates a design doc via the design-doc-planner subagent until the user approves. Ensures the design doc records the working branch name.
---

When planning what should be worked on next for the project, use the following process.

Process:

1) Identify what to work on next
  - Review recent context from the conversation and/or repo state (if available).
  - Propose 1-3 candidate tasks with a short rationale for each.
  - Choose the highest-leverage tasks with a short rationale for each.
  - Define the task scope as a crisp deliverable (what changes, where, and what "done" means).

2) Create a new branch for the work (must be based on latest main)
  - Ensure you are branching from the latest `main`.
  - Commands:
    - `git checkout main`
    - `git fetch origin`
    - `git pull --ff-only origin main`
    - `git checkout -b <branch-name>`
  - Branch naming:
    - Use a short, kebab-case, descriptive name.
    - Prefer: `feat/<area>-<summary>` or `chore/<area>-<summary>` or `fix/<area>-<summary>`.

3) Ensure a design doc exists and is approved (delegate to design-doc-planner subagent)
  - Invoke the design-doc-planner subagent.
  - The subagent must:
    - Determine whether an existing design doc in `design-docs/` should be updated or whether a new one should be created.
    - Produce/update the design doc draft following the project's design doc template.
    - Ask the user for approval and iterate based on feedback.
  - Do not proceed to implementation planning beyond doc-level PR slicing until the user approves the design doc.

4) Record the branch name inside the design doc
  - After the branch is created (step 2), ensure the design doc explicitly states the working branch name.
  - Add a small section near the top (preferred) or in an appendix, for example:

    ## Implementation branch
    - Branch: `<branch-name>`

Output format requirements:
- Always show the chosen task, the final branch name, and the design doc path.
- Always end by asking the user for design approval if approval has not yet been granted.
- Once approval is granted, summarize the approved design in 5-10 bullets and list the proposed PR-sized steps.

Rules:
- Branches must be created from the latest `main` (do no branch from a stale local main).
- The design doc must exist and be approved.
- The design doc must include the branch name exactly as created.