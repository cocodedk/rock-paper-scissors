# 02: show each pick with its hand sign

## Goal

Each pick on the page shows its hand-sign emoji beside its word, so a round reads at a glance.

## Behaviour

- Rock is ✊ (U+270A), paper is ✋ (U+270B), scissors is ✌️ (U+270C U+FE0F).
- A round reads, for example: `Player 1: ✊ rock, Player 2: ✌️ scissors. Player 1 wins.`
  The emoji comes first, then the word, in the latest round and in the last 10 rounds alike.
- Nothing else changes: the score line, the round count, the timing, the WebMCP tools and
  loading from `file://` stay as spec 01 describes them.
- This replaces spec 01's "no emoji" rule for the picks, and only for the picks; the owner
  decided it on 28 September 2026. There are still no images, canvas, SVG or icons.

## Done when

`node --test` passes, and its tests prove that a round's text shows each pick as its emoji
followed by its word, for all three picks, in the latest round and in the history.

## Out of scope

Any other change to the page.
