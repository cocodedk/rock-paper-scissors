# 04: each player shows an emoji

## Goal

Each player is shown by an emoji before its name, wherever the page names a player.

## Behaviour

- Player 1 is 🤖 (U+1F916) and Player 2 is 👾 (U+1F47E).
- Wherever a player's name appears, its emoji comes first, then the name:
  - a round: `🤖 Player 1: ✊ rock, 👾 Player 2: ✌️ scissors. 🏆 🤖 Player 1 wins.`
  - a draw: `🤖 Player 1: ✋ paper, 👾 Player 2: ✋ paper. 🤝 Draw.`
  - the score: `Score: 🤖 Player 1 wins 2, 👾 Player 2 wins 0, draws 2`
- The same text shows in the latest round and in the last 10 rounds.
- Nothing else changes: the picks' and results' emoji, the round count, the timing, the
  WebMCP tools and loading from `file://` stay as specs 01 to 03 describe them.

## Done when

`node --test` passes, and its tests prove that every place naming a player shows its emoji
first: the round text for both players, the winner in a result, and the score line.

## Out of scope

Any other change to the page.
