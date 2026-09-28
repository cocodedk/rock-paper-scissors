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
  assert.strictEqual(game.describeRound(round), 'Player 1: ✊ rock, Player 2: ✌️ scissors. Player 1 wins.');
});

test('each pick shows its emoji then its word, in the latest round and the history', () => {
  // paper/rock, then scissors/paper
  const g = game.createGame(sequence([0.5, 0, 0.9, 0.5]));
  g.playRound();
  g.playRound();
  const newest = 'Player 1: ✌️ scissors, Player 2: ✋ paper. Player 1 wins.';
  const oldest = 'Player 1: ✋ paper, Player 2: ✊ rock. Player 1 wins.';
  const lines = game.render(g).split('\n');
  assert.strictEqual(lines[0], 'Latest round: ' + newest);
  assert.deepStrictEqual(lines.slice(5), [newest, oldest]);
});

test('the score and round count after a fixed sequence of rounds', () => {
  // rock/scissors, paper/scissors, paper/paper, scissors/paper
  const g = game.createGame(sequence([0, 0.9, 0.5, 0.9, 0.5, 0.5, 0.9, 0.5]));
  for (let i = 0; i < 4; i++) g.playRound();
  assert.deepStrictEqual(g.score(), { rounds: 4, player1: 2, player2: 1, draws: 1 });
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
  assert.match(el.textContent, /Latest round: Player 1: (✊ rock|✋ paper|✌️ scissors), Player 2: (✊ rock|✋ paper|✌️ scissors)\. (Player 1 wins|Player 2 wins|Draw)\./);
  ticks[0].fn();
  ticks[0].fn();
  assert.match(el.textContent, /Rounds played: 3/);
  assert.match(el.textContent, /Score: Player 1 wins \d+, Player 2 wins \d+, draws \d+/);
});

test('index.html loads game.js with a plain script tag and has no img, canvas or svg', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<script src="game\.js"><\/script>/);
  assert.doesNotMatch(html, /type="module"/);
  assert.doesNotMatch(html, /<(img|canvas|svg)\b/i);
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
