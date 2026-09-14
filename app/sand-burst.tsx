import type { CSSProperties } from 'react';
export type SandCell = { cell: number; color: number };
export default function SandBurst({ cells }: { cells: SandCell[] }) {
 return <div className="sand-layer" aria-hidden="true">{cells.map(({ cell, color }) => <span key={cell} className={`sand-source color-${color}`} style={{ left: `calc(${cell % 8} * (100% + 4px) / 8)`, top: `calc(${cell >> 3} * (100% + 4px) / 8)` }}>{Array.from({ length: 9 }, (_, grain) => <i key={grain} style={{ left: `${(grain % 3) * 33.333}%`, top: `${Math.floor(grain / 3) * 33.333}%`, '--sand-x': `${(grain % 3 - 1) * 15 + ((cell + grain * 7) % 11 - 5)}px`, '--sand-y': `${14 + Math.floor(grain / 3) * 12 + (cell * 3 + grain) % 13}px`, '--sand-turn': `${(grain % 2 ? 1 : -1) * (35 + cell % 40)}deg`, animationDelay: `${((cell % 8 + (cell >> 3)) % 8) * 10}ms` } as CSSProperties} />)}</span>)}</div>;
}
