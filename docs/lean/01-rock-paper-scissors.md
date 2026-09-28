# 01: rock paper scissors that plays itself

## Goal

A web page where two computer players play rock paper scissors against each other, round
after round, with no person playing and no graphics: only text.

## Behaviour

- Two players, named "Player 1" and "Player 2". Each round, each picks rock, paper or
  scissors at random, independently.
- Rock beats scissors, scissors beats paper, paper beats rock. The same pick is a draw.
- The game starts by itself when the page opens and plays one round every second, for as
  long as the page is open. There are no buttons and no input.
- The page shows, as plain text:
  - the latest round, for example `Player 1: rock, Player 2: scissors. Player 1 wins.`
  - the score: Player 1 wins, Player 2 wins, draws
  - the number of rounds played
  - the last 10 rounds, newest first
- Text only: no images, canvas, SVG, emoji, icons or animation. Browser default styles are fine.
- It works when `index.html` is opened straight from disk (`file://`): plain `<script src>`
  tags, no ES modules, no fetch, no server, no dependencies, no build step.
- WebMCP, the owner's rule for every page: when `document.modelContext` exists, the page calls
  `document.modelContext.registerTool(tool)` once per tool, where a tool is
  `{ name, description, execute, annotations: { readOnlyHint: true } }` and `execute` is an
  async function returning a JSON-serialisable value. Two tools:
  - `describe`: returns one sentence saying what is on the page.
  - `get_score`: returns `{ rounds, player1, player2, draws }`, all numbers.
  Each call is wrapped so that a refusal (a rejected promise or a throw) never stops the game.
  When `document.modelContext` does not exist, the page does nothing about WebMCP.

## Files

- `index.html`: the page.
- `game.js`: the rules, the score and the loop, usable from the page and from Node
  (`module.exports` when `module` exists).
- `test/game.test.js`: the tests, with `node:test` and `node:assert` only.

## Done when

`node --test` passes, and its tests prove:

1. The result of all nine pairs of picks.
2. A round with a fixed random source gives the expected picks and result.
3. The score and the round count after a fixed sequence of rounds.
4. The history keeps only the last 10 rounds, newest first.
5. The loop starts by itself and plays one round per tick, using a fake timer.
6. `index.html` loads `game.js` with a plain script tag and contains no `img`, `canvas` or
   `svg` element.
7. With a fake `document.modelContext`, both tools are registered and answer as described;
   with none, nothing breaks; a registry that rejects does not stop the game.

## Out of scope

Human players, buttons, sound, styling beyond browser defaults, a server, and browser
automation in the suite.
