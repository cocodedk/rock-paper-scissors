# 06: the score line shows the result emoji

## Goal

The score line uses the same result emoji as the rounds, so the whole page reads the same way.

## Behaviour

- The score line reads, for example:
  `Score: 🤖 Player 1 🏆 wins 2, 👾 Player 2 🏆 wins 0, 🤝 draws 2`
  Each player's wins show 🏆 (U+1F3C6) before "wins"; the draws show 🤝 (U+1F91D) before "draws".
- Nothing else changes: the rounds, the round count, the font size, the timing, the WebMCP
  tools and loading from `file://` stay as specs 01 to 05 describe them.

## Done when

`node --test` passes, and its tests prove the score line's exact text for a known score.

## Out of scope

Any other change to the page.
