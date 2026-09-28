const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const game = require('../game.js');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

function sequence(values) {
  let i = 0;
  return () => values[i++];
}

// Loads game.js as the browser does: no `module`, a document and a timer.
function loadInPage(modelContext) {
  const el = { textContent: '' };
  const ticks = [];
  const document = { getElementById: (id) => (id === 'game' ? el : null) };
  if (modelContext) document.modelContext = modelContext;
  const setInterval = (fn, ms) => ticks.push({ fn, ms });
  vm.runInNewContext(source, { document, setInterval });
  return { el, ticks };
}

const json = (value) => JSON.parse(JSON.stringify(value));

test('the result of all nine pairs of picks', () => {
  const cases = [
    ['rock', 'rock', 'draw'],
    ['rock', 'paper', 'player2'],
    ['rock', 'scissors', 'player1'],
    ['paper', 'rock', 'player1'],
    ['paper', 'paper', 'draw'],
    ['paper', 'scissors', 'player2'],
    ['scissors', 'rock', 'player2'],
    ['scissors', 'paper', 'player1'],
    ['scissors', 'scissors', 'draw'],
  ];
  for (const [a, b, expected] of cases) assert.strictEqual(game.result(a, b), expected, a + ' vs ' + b);
});

test('a round with a fixed random source gives the expected picks and result', () => {
  const g = game.createGame(sequence([0, 0.9]));
  const round = g.playRound();
  assert.deepStrictEqual(round, { player1: 'rock', player2: 'scissors', result: 'player1' });
  assert.strictEqual(game.describeRound(round), '🤖 Player 1: ✊ rock, 👾 Player 2: ✌️ scissors. 🏆 🤖 Player 1 wins.');
});

test('each result shows its emoji before its words, in the latest round and the history', () => {
  // rock/scissors, rock/paper, paper/paper
  const g = game.createGame(sequence([0, 0.9, 0, 0.5, 0.5, 0.5]));
  for (let i = 0; i < 3; i++) g.playRound();
  const draw = '🤖 Player 1: ✋ paper, 👾 Player 2: ✋ paper. 🤝 Draw.';
  const p2 = '🤖 Player 1: ✊ rock, 👾 Player 2: ✋ paper. 🏆 👾 Player 2 wins.';
  const p1 = '🤖 Player 1: ✊ rock, 👾 Player 2: ✌️ scissors. 🏆 🤖 Player 1 wins.';
  const lines = game.render(g).split('\n');
  assert.strictEqual(lines[0], 'Latest round: ' + draw);
  assert.deepStrictEqual(lines.slice(5), [draw, p2, p1]);
  for (const [values, text] of [[[0, 0.9], p1], [[0, 0.5], p2]]) {
    const one = game.createGame(sequence(values));
    one.playRound();
    assert.strictEqual(game.render(one).split('\n')[0], 'Latest round: ' + text);
  }
});

test('each pick shows its emoji then its word, in the latest round and the history', () => {
  // paper/rock, then scissors/paper
  const g = game.createGame(sequence([0.5, 0, 0.9, 0.5]));
  g.playRound();
  g.playRound();
  const newest = '🤖 Player 1: ✌️ scissors, 👾 Player 2: ✋ paper. 🏆 🤖 Player 1 wins.';
  const oldest = '🤖 Player 1: ✋ paper, 👾 Player 2: ✊ rock. 🏆 🤖 Player 1 wins.';
  const lines = game.render(g).split('\n');
  assert.strictEqual(lines[0], 'Latest round: ' + newest);
  assert.deepStrictEqual(lines.slice(5), [newest, oldest]);
});

test('each player shows its emoji before its name, in the rounds, the results and the score', () => {
  // rock/scissors, paper/paper, rock/rock, paper/scissors
  const g = game.createGame(sequence([0, 0.9, 0.5, 0.5, 0, 0, 0.5, 0.9]));
  for (let i = 0; i < 4; i++) g.playRound();
  const p2 = '🤖 Player 1: ✋ paper, 👾 Player 2: ✌️ scissors. 🏆 👾 Player 2 wins.';
  const drawRock = '🤖 Player 1: ✊ rock, 👾 Player 2: ✊ rock. 🤝 Draw.';
  const drawPaper = '🤖 Player 1: ✋ paper, 👾 Player 2: ✋ paper. 🤝 Draw.';
  const p1 = '🤖 Player 1: ✊ rock, 👾 Player 2: ✌️ scissors. 🏆 🤖 Player 1 wins.';
  const lines = game.render(g).split('\n');
  assert.strictEqual(lines[0], 'Latest round: ' + p2);
  assert.strictEqual(lines[1], 'Score: 🤖 Player 1 🏆 wins 1, 👾 Player 2 🏆 wins 1, 🤝 draws 2');
  assert.deepStrictEqual(lines.slice(5), [p2, drawRock, drawPaper, p1]);
  // no player name appears without its emoji right before it
  for (const line of lines) {
    assert.doesNotMatch(line, /(^|[^🤖] )Player 1/u, line);
    assert.doesNotMatch(line, /(^|[^👾] )Player 2/u, line);
  }
});

test('the score and round count after a fixed sequence of rounds', () => {
  // rock/scissors, paper/scissors, paper/paper, scissors/paper
  const g = game.createGame(sequence([0, 0.9, 0.5, 0.9, 0.5, 0.5, 0.9, 0.5]));
  for (let i = 0; i < 4; i++) g.playRound();
  assert.deepStrictEqual(g.score(), { rounds: 4, player1: 2, player2: 1, draws: 1 });
});

test('the score line shows the result emoji for a known score', () => {
  // rock/scissors, paper/paper, paper/rock, rock/rock
  const g = game.createGame(sequence([0, 0.9, 0.5, 0.5, 0.5, 0, 0, 0]));
  for (let i = 0; i < 4; i++) g.playRound();
  const lines = game.render(g).split('\n');
  assert.strictEqual(lines[1], 'Score: 🤖 Player 1 🏆 wins 2, 👾 Player 2 🏆 wins 0, 🤝 draws 2');
});

test('the history keeps only the last 10 rounds, newest first', () => {
  // 12 rounds: player 1 always picks rock; player 2 cycles rock, paper, scissors.
  const values = [];
  for (let i = 0; i < 12; i++) values.push(0, [0, 0.5, 0.9][i % 3]);
  const g = game.createGame(sequence(values));
  const played = [];
  for (let i = 0; i < 12; i++) played.push(g.playRound());
  const history = g.history();
  assert.strictEqual(history.length, 10);
  assert.deepStrictEqual(history, played.slice(2).reverse());
});

test('the loop starts by itself and plays one round per tick', () => {
  const { el, ticks } = loadInPage();
  assert.strictEqual(ticks.length, 1);
  assert.strictEqual(ticks[0].ms, 1000);
  assert.match(el.textContent, /Rounds played: 0/);
  ticks[0].fn();
  assert.match(el.textContent, /Rounds played: 1/);
  assert.match(el.textContent, /Latest round: 🤖 Player 1: (✊ rock|✋ paper|✌️ scissors), 👾 Player 2: (✊ rock|✋ paper|✌️ scissors)\. (🏆 🤖 Player 1 wins|🏆 👾 Player 2 wins|🤝 Draw)\./u);
  ticks[0].fn();
  ticks[0].fn();
  assert.match(el.textContent, /Rounds played: 3/);
  assert.match(el.textContent, /Score: 🤖 Player 1 🏆 wins \d+, 👾 Player 2 🏆 wins \d+, 🤝 draws \d+/u);
});

const brandCss = '<link rel="stylesheet" href="https://brand.cocode.dk/v1.css">';
const brandJs = '<script type="module" src="https://brand.cocode.dk/v1.js"></script>';

test('index.html loads game.js with a plain script tag, the frame is its only module, and it has no img, canvas or svg', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<script src="game\.js"><\/script>/);
  assert.deepStrictEqual(html.match(/<script\b[^>]*>/g), [
    '<script type="module" src="https://brand.cocode.dk/v1.js">',
    '<script src="game.js">',
  ]);
  assert.doesNotMatch(html, /<(img|canvas|svg)\b/i);
});

test('index.html sets the font size to 150% in one inline style rule and its only external stylesheet is the frame', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const styles = html.match(/<style>[\s\S]*?<\/style>/g) || [];
  assert.deepStrictEqual(styles, ['<style>html { font-size: 150%; }</style>']);
  assert.deepStrictEqual(html.match(/<link\b[^>]*>/gi), [brandCss]);
  assert.doesNotMatch(html, /\sstyle=/i);
  assert.doesNotMatch(html, /@import/i);
});

test('index.html loads the cocode.dk frame in its head, has the description, and wraps the game in cocode-head and cocode-foot', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  assert.ok(head.includes(brandCss));
  assert.ok(head.includes(brandJs));
  assert.ok(head.includes('<meta name="description" content="Two computer players, 🤖 and 👾, play rock paper scissors by themselves, one round a second.">'));
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].trim().split('\n');
  assert.deepStrictEqual(body, [
    '<cocode-head project="Rock paper scissors" accent="#7048e8" on-accent="#ffffff" links="Source:https://github.com/cocodedk/rock-paper-scissors"><a href="https://cocode.dk">cocode.dk</a></cocode-head>',
    '<h1>Rock paper scissors</h1>',
    '<pre id="game"></pre>',
    '<cocode-foot project="Rock paper scissors" repo="cocodedk/rock-paper-scissors"><a href="https://cocode.dk">Made by Babak</a></cocode-foot>',
    '<script src="game.js"></script>',
  ]);
});

test('pages.yml deploys on push to main with pinned actions and copies exactly index.html, game.js and llms.txt', () => {
  const yml = fs.readFileSync(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8');
  for (const line of [
    'name: Deploy Pages',
    '  push:\n    branches: [main]\n  workflow_dispatch:',
    'permissions:\n  contents: read\n  pages: write\n  id-token: write',
    'concurrency:\n  group: pages\n  cancel-in-progress: false',
    'jobs:\n  deploy:',
    '      name: github-pages',
    '      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v4',
    '        run: mkdir _site && cp index.html game.js llms.txt _site/',
    '      - uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0',
    '      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0\n        with:\n          path: _site',
    '      - uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1\n        id: deployment',
  ]) assert.ok(yml.includes(line), line);
  assert.deepStrictEqual(yml.split('jobs:')[1].match(/^ {2}\S.*:$/gm), ['  deploy:']);
  assert.strictEqual((yml.match(/\bcp\b/g) || []).length, 1);
  assert.strictEqual((yml.match(/uses:/g) || []).length, 4);
});

test('README.md has the play link and the test command', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.includes('Play it: https://cocodedk.github.io/rock-paper-scissors/'));
  assert.ok(readme.includes('`node --test`'));
});

test('with a fake modelContext both tools are registered and answer', async () => {
  const tools = {};
  const { ticks } = loadInPage({ registerTool: (tool) => { tools[tool.name] = tool; } });
  assert.deepStrictEqual(Object.keys(tools).sort(), ['describe', 'get_score']);
  for (const tool of Object.values(tools)) {
    assert.strictEqual(typeof tool.description, 'string');
    assert.strictEqual(tool.annotations.readOnlyHint, true);
  }
  const sentence = await tools.describe.execute();
  assert.strictEqual(typeof sentence, 'string');
  assert.match(sentence, /rock paper scissors/);
  ticks[0].fn();
  ticks[0].fn();
  const score = json(await tools.get_score.execute());
  assert.deepStrictEqual(Object.keys(score).sort(), ['draws', 'player1', 'player2', 'rounds']);
  assert.strictEqual(score.rounds, 2);
  assert.strictEqual(score.player1 + score.player2 + score.draws, 2);
});

test('with no modelContext nothing breaks', () => {
  const { el, ticks } = loadInPage();
  ticks[0].fn();
  assert.match(el.textContent, /Rounds played: 1/);
});

test('a registry that rejects or throws does not stop the game', async () => {
  const unhandled = [];
  const onUnhandled = (reason) => unhandled.push(reason);
  process.on('unhandledRejection', onUnhandled);
  try {
    for (const registerTool of [() => Promise.reject(new Error('refused')), () => { throw new Error('refused'); }]) {
      const { el, ticks } = loadInPage({ registerTool });
      assert.strictEqual(ticks.length, 1);
      ticks[0].fn();
      assert.match(el.textContent, /Rounds played: 1/);
    }
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepStrictEqual(unhandled, []);
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
});
