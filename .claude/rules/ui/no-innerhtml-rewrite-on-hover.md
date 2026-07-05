# Never Rewrite innerHTML From Hover Handlers

## The Problem

A `mouseenter`/`mouseleave` handler that rewrites the element's own
`innerHTML` (or `style.cssText` wholesale, when combined with child
replacement) destroys the child node currently under the cursor. The
browser then recomputes hover for the recreated children and re-fires
enter/leave, whose handler rewrites again — an infinite enter/leave storm.

**Symptom:** `mousedown`/`mouseup`/`click` never dispatch on the element
(the pressed target is detached mid-gesture), so buttons look hoverable but
are unclickable with real input. Synthetic `el.click()` still works, which
makes the bug invisible to naive DOM tests.

Found in Overclock's map screen (`demos/overclock/src/ui/map.ts`): node
hover called a render function that rebuilt each hex node's innerHTML.

## The Rule

- Build interactive elements' DOM **once**.
- Hover/selection feedback mutates **individual style properties**
  (`transform`, `filter`, `opacity`, `zIndex`) or attributes on stable
  children (`setAttribute('stroke', ...)`) — never `innerHTML`, never
  full `style.cssText` replacement while hovered.
- The `hover()` helper in `demos/overclock/src/ui/dom.ts` is safe: it only
  toggles style properties.

## Verifying

Drive the UI with trusted input (Playwright `page.mouse.click`), not
`el.click()`. If a capture-phase listener logs repeated `mouseenter` with
no `click`, this bug is present.
