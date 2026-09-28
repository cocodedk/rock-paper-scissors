# 07: publish the page on GitHub Pages, in the cocode.dk frame

## Goal

The game is published at https://cocodedk.github.io/rock-paper-scissors/ with the cocode.dk
family header and footer, and the repository explains itself in a short README.

## Behaviour

- `index.html` loads the cocode.dk frame in its head:
  `<link rel="stylesheet" href="https://brand.cocode.dk/v1.css">` and
  `<script type="module" src="https://brand.cocode.dk/v1.js"></script>`,
  and has `<meta name="description" content="Two computer players, 🤖 and 👾, play rock paper scissors by themselves, one round a second.">`.
- The first element in the body is
  `<cocode-head project="Rock paper scissors" accent="#7048e8" on-accent="#ffffff" links="Source:https://github.com/cocodedk/rock-paper-scissors"><a href="https://cocode.dk">cocode.dk</a></cocode-head>`
  and the last element before the page's own scripts is
  `<cocode-foot project="Rock paper scissors" repo="cocodedk/rock-paper-scissors"><a href="https://cocode.dk">Made by Babak</a></cocode-foot>`.
  The frame is decoration: without network or JavaScript its links show instead, and the game
  plays exactly as before, from `file://` too.
- `.github/workflows/pages.yml`, named `Deploy Pages`, runs on push to main and on
  workflow_dispatch, with permissions `contents: read`, `pages: write`, `id-token: write`,
  concurrency group `pages` with `cancel-in-progress: false`, and one job `deploy` in the
  `github-pages` environment. Its steps: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v4`;
  a step copying only `index.html`, `game.js` and `llms.txt` into `_site`;
  `actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0`;
  `actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0` with path `_site`;
  `actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1` with id `deployment`.
- `README.md`: a title, one paragraph saying what the game is, the line
  `Play it: https://cocodedk.github.io/rock-paper-scissors/`, how to run the tests (`node --test`),
  and that it was built by graph-loop's lean loop (https://github.com/cocodedk/graph-loop) from the
  specs in `docs/lean/`.
- Nothing else changes.

## Done when

`node --test` passes, and its tests prove: index.html loads v1.css and v1.js from brand.cocode.dk,
has the description, the cocode-head and cocode-foot elements with exactly these attributes and
children, and still loads game.js with a plain script tag; pages.yml has the triggers,
permissions, concurrency, pinned actions and copies exactly index.html, game.js and llms.txt;
README.md has the play link and the test command.

## Out of scope

Anything else: no other files, no styling, no change to the game.
