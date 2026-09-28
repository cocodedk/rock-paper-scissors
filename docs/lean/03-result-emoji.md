# 03: show each round's result with an emoji

## Goal

Each round's result shows an emoji before its words, like the picks do since spec 02.

## Behaviour

- A win is 🏆 (U+1F3C6): `Player 1: ✊ rock, Player 2: ✌️ scissors. 🏆 Player 1 wins.`
- A draw is 🤝 (U+1F91D): `Player 1: ✋ paper, Player 2: ✋ paper. 🤝 Draw.`
- The same text shows in the latest round and in the last 10 rounds.
- Nothing else changes: the score line, the round count, the picks' emoji, the timing, the
  WebMCP tools and loading from `file://` stay as specs 01 and 02 describe them.

## Done when

`node --test` passes, and its tests prove that a win shows 🏆 before its words for either
player, and a draw shows 🤝 before "Draw.", in the latest round and in the history.

## Out of scope

Any other change to the page.
