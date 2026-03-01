---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Convention Discovery in Bug Fixes

After completing a bug fix, **always pause and reflect**: Did the root cause reveal an undocumented convention, implicit contract, or cross-cutting pattern?

## The Pattern

Bug fixes are high-value learning opportunities. The root cause often exposes:
- Non-obvious conventions (e.g., inverted contact normal directions)
- Implicit contracts spanning multiple functions
- Cross-cutting patterns that future code will inherit
- Pitfalls that similar code elsewhere may contain

## Action

When you discover such a convention during debugging:

1. **Recognize it**: Ask yourself: "Is this a general pattern that other code needs to follow?"
2. **Document it**: Trigger the `codebase-notes` skill to record the discovery
3. **Record what, where, and why**:
   - What is the convention?
   - Which files/functions depend on it?
   - What happens if it's violated?

## Example

If you find a bug caused by an inverted contact normal direction:
- Don't just fix the immediate bug
- Trigger `codebase-notes` to document that contact normals follow a specific convention
- Record which functions depend on this convention
- Note what the convention is and why it matters

This prevents the same mistake in future refactors or new features.
