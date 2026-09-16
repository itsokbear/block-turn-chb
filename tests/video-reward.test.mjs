import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {moveEvent} from '../lib/events.ts';
import {crossedVideoMilestone, zazerkalyeSignalLevel, videoRewardForMove, pickZazerkalyeVideo, ZAZERKALYE_VIDEO_IDS, tiktokPlayerUrl} from '../lib/zazerkalye-videos.ts';

// Run the real placement handler: the video must replace (not duplicate) the
// celebration and commit the earned score. Score milestones work for any scoring move.
const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const handler = ts.transpileModule(page.slice(page.indexOf(' function put('), page.indexOf(' function newGame(')), {
  compilerOptions: {target: ts.ScriptTarget.ES2022},
}).outputText;
function move(lines, index = 0, modal = null, connection = {onLine: true}, {previousScore = 150, points = lines * 100} = {}) {
  const previous = {board: Array.from({length: 8}, () => Array(8).fill(0)), pieces: [{shape: [[1]], color: 2}, null, null], lines: 10, score: previousScore, combo: 0};
  const result = {game: {...previous, lines: 10 + lines, score: previousScore + points, combo: 1}, cleared: [0], points, rowsCleared: Array.from({length: lines}, (_, i) => i), colsCleared: []};
  const effects = {events: [], videos: [], modals: [], sounds: [], notices: [], game: null, signalPulses: 0};
  const current = {current: previous};
  const lastVideo = {current: null};
  const noop = () => {};
  const scope = {
    modal, rerollMode: false, swapping: null, current, lastVideo, navigator: connection,
    placeSerpent: () => result, bombSerpent: () => result,
    setSnakeFX: noop, snakeTimer: {current: null}, setClearRows: noop, setClearCols: noop,
    setSignalPulse: update => {effects.signalPulses = update(effects.signalPulses);}, setOrbitalShake: noop, crumble: noop, setStamped: noop, stampTimer: {current: null},
    setHand: noop, setGame: game => {effects.game = game;}, setSelected: noop,
    moveEvent,
    eventTimer: {current: null}, eventId: {current: 0},
    setEvent: event => effects.events.push(event),
    setVideoReward: video => effects.videos.push(video), setModal: value => effects.modals.push(value),
    crossedVideoMilestone, zazerkalyeSignalLevel, videoRewardForMove, pickZazerkalyeVideo,
    play: sound => effects.sounds.push(sound), tone: () => effects.sounds.push('move'), message: text => effects.notices.push(text),
    setTimeout: () => 1, clearTimeout: noop,
  };
  const put = new Function(...Object.keys(scope), `${handler}; return put;`)(...Object.values(scope));
  return {accepted: put(index, 0, 0), put, effects, result, current, lastVideo};
}

test('4 and 5+ lines open one video celebration after committing score', () => {
  for (const lines of [4, 5, 6]) {
    const {accepted, effects, result, current} = move(lines);
    assert.equal(accepted, true);
    assert.equal(effects.game, result.game);
    assert.equal(current.current, result.game);
    assert.deepEqual(effects.modals, ['video']);
    assert.equal(effects.videos.length, 1);
    assert.equal(effects.videos[0].points, result.points);
    assert.ok(ZAZERKALYE_VIDEO_IDS.includes(effects.videos[0].videoId));
    assert.deepEqual(effects.events, [null]);
    assert.deepEqual(effects.notices, ['']);
    assert.equal(effects.sounds.length, 1);
  }
});
test('0–3 lines and bombs without a score milestone keep their ordinary celebration', () => {
  for (const lines of [0, 1, 2, 3]) {
    const {effects} = move(lines);
    assert.deepEqual(effects.videos, []);
    assert.deepEqual(effects.modals, []);
    if (lines >= 2) assert.ok(effects.events[0]);
  }
  assert.deepEqual(move(5, -1).effects.videos, []);
  assert.equal(videoRewardForMove({placement: false, lines: 5, previousScore: 0, score: 500, online: true}), null);
});
test('an open video blocks another placement without changing the game', () => {
  const {accepted, effects} = move(4, 0, 'video');
  assert.equal(accepted, false);
  assert.equal(effects.game, null);
  assert.deepEqual(effects.sounds, []);
});
test('each new 10,000-point threshold opens one video, including exact hits and overshoots', () => {
  for (const [previousScore, points, milestone] of [[9990, 10, 10000], [9980, 90, 10000], [19950, 100, 20000], [9900, 20200, 30000]]) {
    const {effects, result, current} = move(0, 0, null, {onLine: true}, {previousScore, points});
    assert.equal(current.current, result.game);
    assert.equal(effects.game.score, previousScore + points);
    assert.deepEqual(effects.modals, ['video']);
    assert.equal(effects.videos.length, 1);
    assert.equal(effects.videos[0].title, `${milestone.toLocaleString('ru-RU')} ОЧКОВ!`);
    assert.equal(effects.videos[0].points, points);
    assert.deepEqual(effects.events, [null]);
    assert.deepEqual(effects.notices, ['']);
    assert.equal(effects.sounds.length, 1);
    assert.equal(effects.signalPulses, 1);
  }
});
test('a saved score, a subsequent move and a new game do not replay an old milestone', () => {
  for (const [previousScore, points] of [[10000, 0], [10000, 10], [15000, 10], [19900, 50], [30000, 100], [0, 10]]) {
    const {effects} = move(0, 0, null, {onLine: true}, {previousScore, points});
    assert.deepEqual(effects.videos, []);
    assert.equal(effects.signalPulses, 0);
  }
  assert.equal(crossedVideoMilestone(20000, 0), null);
});
test('a score milestone and four lines share one video, preserving the clear and reward details', () => {
  const {effects} = move(4, 0, null, {onLine: true}, {previousScore: 9900});
  assert.equal(effects.videos.length, 1);
  assert.equal(effects.videos[0].title, `${(10000).toLocaleString('ru-RU')} ОЧКОВ!`);
  assert.equal(effects.videos[0].details, 'МАСТЕРСКИ! · 4 линии');
  assert.deepEqual(effects.events, [null]);
  assert.equal(effects.sounds.length, 1);
  assert.equal(effects.signalPulses, 1);
});
test('points from a bomb count towards the score milestone without needing a line celebration', () => {
  const {effects} = move(0, -1, null, {onLine: true}, {previousScore: 9990, points: 10});
  assert.equal(effects.videos.length, 1);
  assert.equal(effects.videos[0].details, 'Мультик за новый рубеж');
  assert.equal(effects.sounds.length, 1);
});
test('offline milestones reset the signal, keep the score and never replay on reconnect', () => {
  const connection = {onLine: false};
  const {put, effects, current} = move(0, 0, null, connection, {previousScore: 9990, points: 10});
  assert.equal(current.current.score, 10000);
  assert.equal(effects.signalPulses, 1);
  assert.deepEqual(effects.videos, []);
  connection.onLine = true;
  assert.deepEqual(effects.videos, []);
  put(0, 0, 0);
  assert.deepEqual(effects.videos, []);
  assert.equal(effects.signalPulses, 1);
});
test('signal fills in 2,000-point steps and resets at every 10,000, including loaded scores', () => {
  for (const [score, level] of [[0, 0], [1999, 0], [2000, 1], [3999, 1], [4000, 2], [6000, 3], [8000, 4], [9999, 4], [10000, 0], [11999, 0], [12000, 1], [18000, 4], [20000, 0], [36000, 3]]) {
    assert.equal(zazerkalyeSignalLevel(score), level, `score ${score}`);
  }
});
test('every catalog entry is reachable, and consecutive rewards do not repeat', () => {
  assert.ok(ZAZERKALYE_VIDEO_IDS.length > 220);
  assert.equal(new Set(ZAZERKALYE_VIDEO_IDS).size, ZAZERKALYE_VIDEO_IDS.length);
  assert.ok(ZAZERKALYE_VIDEO_IDS.every(id => /^\d{19}$/.test(id)));
  assert.ok(!ZAZERKALYE_VIDEO_IDS.includes('7680278783630347540'), 'photo announcements are not cartoons');
  for (const previous of [null, ...ZAZERKALYE_VIDEO_IDS]) {
    const candidates = ZAZERKALYE_VIDEO_IDS.filter(id => id !== previous);
    assert.deepEqual(candidates.map((_, i) => pickZazerkalyeVideo(previous, () => (i + .5) / candidates.length)), candidates);
  }
});
test('player starts muted and limits recommendations to the author', () => {
  const url = new URL(tiktokPlayerUrl(ZAZERKALYE_VIDEO_IDS[0]));
  assert.equal(url.origin, 'https://www.tiktok.com');
  assert.equal(url.searchParams.get('autoplay'), '1');
  assert.equal(url.searchParams.get('muted'), '1');
  assert.equal(new URL(tiktokPlayerUrl(ZAZERKALYE_VIDEO_IDS[0], false)).searchParams.get('muted'), '0');
  assert.equal(url.searchParams.get('rel'), '0');
  assert.equal(url.searchParams.get('controls'), '1');
});


test('offline 4+ clears keep the normal celebration, score and sound without opening a video', () => {
  for (const lines of [4, 5, 6]) {
    const {accepted, effects, result, current, lastVideo} = move(lines, 0, null, {onLine: false});
    assert.equal(accepted, true);
    assert.equal(current.current, result.game);
    assert.equal(effects.game, result.game);
    assert.deepEqual(effects.videos, []);
    assert.deepEqual(effects.modals, []);
    assert.equal(lastVideo.current, null);
    assert.equal(effects.events.length, 1);
    assert.equal(effects.events[0].title, lines === 4 ? 'МАСТЕРСКИ!' : 'ГЕНИАЛЬНО!');
    assert.equal(effects.events[0].points, result.points);
    assert.equal(effects.sounds.length, 1);
  }
});
test('connection is read at the move, and reconnecting does not replay an offline reward', () => {
  const connection = {onLine: false};
  const {put, effects} = move(4, 0, null, connection);
  connection.onLine = true;
  assert.deepEqual(effects.videos, []);
  put(0, 0, 0);
  assert.equal(effects.videos.length, 1);
  connection.onLine = false;
  put(0, 0, 0);
  assert.equal(effects.videos.length, 1);
  assert.equal(effects.events.at(-1).title, 'МАСТЕРСКИ!');
});

test('losing the connection closes an open video; reconnect and cleanup never reopen it', () => {
  const component = readFileSync(new URL('../app/zazerkalye-video.tsx', import.meta.url), 'utf8');
  const start = component.indexOf('  useEffect(() => {\n    const closeIfOffline');
  assert.notEqual(start, -1);
  const effect = ts.transpileModule(component.slice(start, component.indexOf('\n\n  function send', start)), {
    compilerOptions: {target: ts.ScriptTarget.ES2022},
  }).outputText;
  const window = new EventTarget();
  const connection = {onLine: true};
  const states = [];
  let closes = 0, cleanup;
  new Function('useEffect', 'window', 'navigator', 'setOnline', 'onClose', effect)(
    callback => {cleanup = callback();}, window, connection, value => states.push(value), () => {closes++;},
  );
  assert.equal(closes, 0);
  connection.onLine = false;
  window.dispatchEvent(new Event('offline'));
  assert.equal(closes, 1);
  assert.deepEqual(states, [false]);
  connection.onLine = true;
  window.dispatchEvent(new Event('online'));
  assert.equal(closes, 1);
  cleanup();
  connection.onLine = false;
  window.dispatchEvent(new Event('offline'));
  assert.equal(closes, 1);
});
