import type { Game } from './game.ts';
import { freshSerpent, restoreSerpent } from './serpent.ts';

export const SAVE_KEY = 'brunya-game';
export const BEST_KEY = 'brunya-best';
type Store = Pick<Storage, 'getItem' | 'setItem'>;
const validRecord = (value: unknown) => {
 const number = Number(value);
 return Number.isSafeInteger(number) && number > 0 ? number : 0;
};
export function loadBrunya(storage?: Store): { game: Game; best: number } {
 let game: Game | null = null, best = 0;
 try {
  const store = storage ?? localStorage;
  // A broken game must not discard a valid record.
  best = validRecord(store.getItem(BEST_KEY));
  game = restoreSerpent(JSON.parse(store.getItem(SAVE_KEY) ?? 'null'));
 } catch { /* Private browsing or a damaged save starts a playable Brunya game. */ }
 return { game: game ?? freshSerpent(), best: Math.max(best, game?.score ?? 0) };
}
export function saveBrunya(game: Game, best: number, storage?: Store): number {
 const record = Math.max(validRecord(best), game.score);
 try {
  const store = storage ?? localStorage;
  store.setItem(SAVE_KEY, JSON.stringify(game));
  store.setItem(BEST_KEY, String(record));
 } catch { /* Gameplay also works when browser storage is unavailable. */ }
 return record;
}
