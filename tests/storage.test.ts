import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBrunya, saveBrunya, SAVE_KEY, BEST_KEY } from '../lib/storage.ts';
import { freshSerpent } from '../lib/serpent.ts';
import { fresh } from '../lib/game.ts';
function storage(entries: [string, string][] = []) {
 const data = new Map(entries);
 return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}
test('Brunya never reads or overwrites the other game on the same Pages origin', () => {
 const old = freshSerpent(); old.score = 1234;
 const store = storage([['block-turn-serpent', JSON.stringify(old)], ['block-turn-serpent-best', '9876'], ['block-turn-mode', 'classic']]);
 const before = [...store.data];
 const state = loadBrunya(store);
 assert.ok(state.game.serpent); assert.equal(state.game.score, 0); assert.equal(state.best, 0);
 saveBrunya(state.game, 0, store);
 for (const [key, value] of before) assert.equal(store.getItem(key), value);
});
test('resume preserves Brunya, score, bonuses and record', () => {
 const store = storage(); const game = freshSerpent(); game.score = 400; game.molts = 1; game.bombs = 1;
 assert.equal(saveBrunya(game, 500, store), 500);
 const loaded = loadBrunya(store);
 assert.deepEqual(loaded.game, game); assert.equal(loaded.best, 500);
});
test('invalid JSON or a classic save cannot launch a game without Brunya', () => {
 for (const raw of ['broken', JSON.stringify(fresh()), 'null']) {
  const loaded = loadBrunya(storage([[SAVE_KEY, raw], [BEST_KEY, '800']]));
  assert.equal(loaded.game.serpent?.cells.length, 6); assert.equal(loaded.best, 800);
 }
});
test('blocked storage and invalid records remain playable', () => {
 const blocked = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
 const state = loadBrunya(blocked); assert.ok(state.game.serpent);
 assert.equal(saveBrunya(state.game, 100, blocked), 100);
 for (const value of ['NaN', '-1', 'Infinity', '1.5']) assert.equal(loadBrunya(storage([[BEST_KEY, value]])).best, 0);
});
