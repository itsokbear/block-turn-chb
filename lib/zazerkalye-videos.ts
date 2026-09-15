// Public posts verified in @zazer_kalye's official creator embed on 2026-09-16.
// Keep IDs as strings: TikTok IDs exceed Number.MAX_SAFE_INTEGER.
export const ZAZERKALYE_VIDEO_IDS = [
  '7684998676225232148', '7680278783630347540', '7673401187865070868',
  '7685827966277864725', '7685777396410158357', '7685735800146890005',
  '7685466222288293140', '7685397301854063892', '7685363490336345364',
  '7685089577584987413', '7684908894593748244', '7684717139026005268',
] as const;

export function earnsVideo(placement: boolean, lines: number) {
  return placement && lines >= 4;
}

export function pickZazerkalyeVideo(previous: string | null, random: () => number = Math.random): string {
  const candidates = ZAZERKALYE_VIDEO_IDS.filter(id => id !== previous);
  return candidates[Math.floor(random() * candidates.length)];
}

export function tiktokPlayerUrl(id: string, muted = true) {
  return `https://www.tiktok.com/player/v1/${id}?autoplay=1&controls=1&rel=0&loop=0&muted=${muted ? 1 : 0}`;
}

export function tiktokPostUrl(id: string) {
  return `https://www.tiktok.com/@zazer_kalye/video/${id}`;
}
