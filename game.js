(function () {
  var PICKS = ['rock', 'paper', 'scissors'];
  var BEATS = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
  var OUTCOME = { player1: 'Player 1 wins.', player2: 'Player 2 wins.', draw: 'Draw.' };
  var SIGN = { rock: '✊', paper: '✋', scissors: '✌️' };

  function showPick(p) {
    return SIGN[p] + ' ' + p;
  }

  function result(pick1, pick2) {
    if (pick1 === pick2) return 'draw';
    return BEATS[pick1] === pick2 ? 'player1' : 'player2';
  }

  function pick(random) {
    return PICKS[Math.floor(random() * PICKS.length)];
  }

  function describeRound(round) {
    return 'Player 1: ' + showPick(round.player1) + ', Player 2: ' + showPick(round.player2) + '. ' + OUTCOME[round.result];
  }

  function createGame(random) {
    random = random || Math.random;
    var score = { rounds: 0, player1: 0, player2: 0, draws: 0 };
    var history = [];

    function playRound() {
      var p1 = pick(random);
      var p2 = pick(random);
      var round = { player1: p1, player2: p2, result: result(p1, p2) };
      score.rounds++;
      if (round.result === 'draw') score.draws++;
      else score[round.result]++;
      history.unshift(round);
      if (history.length > 10) history.length = 10;
      return round;
    }

    return {
      playRound: playRound,
      score: function () {
        return { rounds: score.rounds, player1: score.player1, player2: score.player2, draws: score.draws };
      },
      history: function () { return history.slice(); }
    };
  }

  function render(game) {
    var s = game.score();
    var history = game.history();
    return [
      'Latest round: ' + (history.length ? describeRound(history[0]) : 'none yet.'),
      'Score: Player 1 wins ' + s.player1 + ', Player 2 wins ' + s.player2 + ', draws ' + s.draws,
      'Rounds played: ' + s.rounds,
      '',
      'Last 10 rounds, newest first:'
    ].concat(history.map(describeRound)).join('\n');
  }

  function registerTools(modelContext, game) {
    var tools = [
      {
        name: 'describe',
        description: 'Says what is on the page.',
        execute: async function () {
          return 'Two computer players play rock paper scissors every second, and the page shows the latest round, the score, the rounds played and the last 10 rounds as text.';
        },
        annotations: { readOnlyHint: true }
      },
      {
        name: 'get_score',
        description: 'Returns the rounds played, the wins of each player and the draws.',
        execute: async function () { return game.score(); },
        annotations: { readOnlyHint: true }
      }
    ];
    tools.forEach(function (tool) {
      try {
        Promise.resolve(modelContext.registerTool(tool)).catch(function () {});
      } catch (e) {}
    });
  }

  function start(doc, setIntervalFn, random) {
    var game = createGame(random);
    var el = doc.getElementById('game');
    el.textContent = render(game);
    setIntervalFn(function () {
      game.playRound();
      el.textContent = render(game);
    }, 1000);
    if (doc.modelContext) registerTools(doc.modelContext, game);
    return game;
  }

  var api = { result: result, pick: pick, describeRound: describeRound, createGame: createGame, render: render, start: start };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else if (typeof document !== 'undefined') start(document, setInterval);
})();
