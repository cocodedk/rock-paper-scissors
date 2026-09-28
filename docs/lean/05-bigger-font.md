# 05: bigger text

## Goal

All text on the page is easier to read: one and a half times the browser's default size.

## Behaviour

- One inline `<style>` rule in `index.html` sets the page's font size to 150% of the
  browser default, and everything on the page, the rounds included, scales with it.
- Nothing else changes: no external stylesheet, no other styling, and the text, emoji,
  timing, WebMCP tools and loading from `file://` stay as specs 01 to 04 describe them.

## Done when

`node --test` passes, and its tests prove that `index.html` sets the page's font size to 150%
in an inline style rule and loads no external stylesheet.

## Out of scope

Any other change to the page.
