import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {moveEvent} from '../lib/events.ts';
import {earnsVideo, pickZazerkalyeVideo, ZAZERKALYE_VIDEO_IDS, tiktokPlayerUrl} from '../lib/zazerkalye-videos.ts';

// Run the real placement handler: the video must replace (not duplicate) the
// celebration, commit the earned score, and leave bombs outside this reward.
const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const handler = ts.transpileModule(page.slice(page.indexOf(' function put('), page.indexOf(' function newGame(')), {
  compilerOptions: {target: ts.ScriptTarget.ES2022},
}).outputText;
function move(lines, index = 0, modal = null) {
  const previous = {board: Array.from({length: 8}, () => Array(8).fill(0)), pieces: [{shape: [[1]], color: 2}, null, null], lines: 10, score: 150, combo: 0};
  const result = {game: {...previous, lines: 10 + lines, score: 150 + lines * 100, combo: 1}, cleared: [0], points: lines * 100, rowsCleared: Array.from({length: lines}, (_, i) => i), colsCleared: []};
  const effects = {events: [], videos: [], modals: [], sounds: [], game: null};
  const current = {current: previous};
  const lastVideo = {current: null};
  const noop = () => {};
  const scope = {
    modal, rerollMode: false, swapping: null, current, lastVideo,
    placeSerpent: () => result, bombSerpent: () => result,
    setSnakeFX: noop, snakeTimer: {current: null}, setClearRows: noop, setClearCols: noop,
    setOrbitalShake: noop, crumble: noop, setStamped: noop, stampTimer: {current: null},
    setHand: noop, setGame: game => {effects.game = game;}, setSelected: noop,
    moveEvent,
    eventTimer: {current: null}, eventId: {current: 0},
    setEvent: event => effects.events.push(event),
    setVideoReward: video => effects.videos.push(video), setModal: value => effects.modals.push(value),
    earnsVideo, pickZazerkalyeVideo,
    play: sound => effects.sounds.push(sound), tone: () => effects.sounds.push('move'), message: noop,
    setTimeout: () => 1, clearTimeout: noop,
  };
  const put = new Function(...Object.keys(scope), `${handler}; return put;`)(...Object.values(scope));
  return {accepted: put(index, 0, 0), effects, result, current};
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
    assert.equal(effects.sounds.length, 1);
  }
});
test('0–3 lines and bombs never open the video; smaller celebrations still render', () => {
  for (const lines of [0, 1, 2, 3]) {
    const {effects} = move(lines);
    assert.deepEqual(effects.videos, []);
    assert.deepEqual(effects.modals, []);
    if (lines >= 2) assert.ok(effects.events[0]);
  }
  assert.deepEqual(move(5, -1).effects.videos, []);
  assert.equal(earnsVideo(false, 5), false);
});
test('an open video blocks another placement without changing the game', () => {
  const {accepted, effects} = move(4, 0, 'video');
  assert.equal(accepted, false);
  assert.equal(effects.game, null);
  assert.deepEqual(effects.sounds, []);
});
test('every catalog entry is reachable, and consecutive rewards do not repeat', () => {
  assert.equal(new Set(ZAZERKALYE_VIDEO_IDS).size, ZAZERKALYE_VIDEO_IDS.length);
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
