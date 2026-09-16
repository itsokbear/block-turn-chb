import {VIDEO_SCORE_STEP, zazerkalyeSignalLevel} from '../lib/zazerkalye-videos';

export default function ZazerkalyeSignal({score, pulse}: {score: number; pulse: number}) {
  const level = zazerkalyeSignalLevel(score);
  const remaining = (VIDEO_SCORE_STEP - score % VIDEO_SCORE_STEP).toLocaleString('ru-RU');
  const description = `${level} из 5 · До следующего сигнала ${remaining} очков`;
  return <span className="zazerkalye-signal" role="meter" aria-label="Связь с Зазеркальем"
    aria-valuemin={0} aria-valuemax={5} aria-valuenow={level} aria-valuetext={description}
    title={`Связь с Зазеркальем · ${description}`}>
    <span key={pulse} className={`signal-bars${pulse ? ' signal-peak' : ''}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map(bar => <i key={bar} className={bar < level ? 'signal-filled' : ''}/>)}
    </span>
  </span>;
}
