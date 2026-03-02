---
id: TICKET-074
epic: EPIC-011
title: Fix pause button font rendering (monospace serifs)
status: todo
priority: medium
created: 2026-03-02
updated: 2026-03-02
labels:
  - ui
  - arena
  - bug
---

## Description

The pause button in TouchControlsNode uses `"II"` text rendered in `bold 18px monospace`.
Monospace fonts have serifs on the `I` characters (top and bottom horizontal lines), making
the pause icon look like a Roman numeral II instead of two vertical pause bars.

Fix by switching to a sans-serif font (e.g. `Arial, sans-serif`) for the pause button text,
or by using a Unicode character / CSS pseudo-elements to render proper pause bars without
serifs.

## Acceptance Criteria

- [ ] Pause button displays two clean vertical bars without serif decorations
- [ ] Visual appearance matches a standard pause icon
- [ ] Works consistently across major browsers (Chrome, Firefox, Safari)

## Notes

- **2026-03-02**: Ticket created.
