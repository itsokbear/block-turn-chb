'use client';

import {useEffect, useRef, useState} from 'react';
import {X, ArrowUpRight, Play, Volume2} from 'lucide-react';
import {tiktokPlayerUrl, tiktokPostUrl} from '../lib/zazerkalye-videos';

export type VideoReward = {videoId: string; title: string; details: string; points: number};
type PlayerState = 'loading' | 'ready' | 'blocked' | 'slow' | 'unavailable';

export default function ZazerkalyeVideo({reward, sound, onClose}: {
  reward: VideoReward; sound: boolean; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<PlayerState>('loading');
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine);
  const [lockedMuted, setLockedMuted] = useState(!sound);
  const [muted, setMuted] = useState(!sound);
  const mute = useRef(!sound);

  useEffect(() => {
    if (!online) return;
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, [online]);

  useEffect(() => {
    const closeIfOffline = () => {
      if (!navigator.onLine) {setOnline(false); onClose();}
    };
    closeIfOffline();
    window.addEventListener('offline', closeIfOffline);
    return () => window.removeEventListener('offline', closeIfOffline);
  }, [onClose]);

  function send(type: string) {
    frame.current?.contentWindow?.postMessage({'x-tiktok-player': true, type}, 'https://www.tiktok.com');
  }

  useEffect(() => {
    if (!online) return;
    setStatus('loading');
    setDocumentLoaded(false);
    const timeout = setTimeout(() => setStatus(value => value === 'loading' ? 'slow' : value), 12000);
    const receive = (event: MessageEvent) => {
      if (event.origin !== 'https://www.tiktok.com' || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (!data || data['x-tiktok-player'] !== true) return;
      if (data.type === 'onPlayerReady') {
        clearTimeout(timeout);
        send(mute.current ? 'mute' : 'unMute');
        send('play');
        setStatus('ready');
      } else if (data.type === 'onStateChange' && data.value === 1) {
        clearTimeout(timeout);
        setStatus('ready');
      } else if (data.type === 'onPlayerError' || data.type === 'onError') {
        clearTimeout(timeout);
        const code = data.value?.errorCode ?? data.value;
        setStatus(code === 3002 ? 'blocked' : 'unavailable');
      } else if (data.type === 'onMute' && typeof data.value === 'boolean') {
        mute.current = data.value;
        setMuted(data.value);
      }
    };
    window.addEventListener('message', receive);
    return () => {clearTimeout(timeout); window.removeEventListener('message', receive);};
  }, [online, lockedMuted]);

  if (!online) return null;

  return <dialog ref={dialog} className="zazerkalye-video" aria-labelledby="video-title" aria-describedby="video-details"
    onCancel={event => {event.preventDefault(); onClose();}}>
    <header className="video-heading">
      <div><p className="video-channel">СИГНАЛ ИЗ ЗАЗЕРКАЛЬЯ</p><h2 id="video-title">{reward.title}</h2></div>
      <button autoFocus type="button" className="video-close" aria-label="Закрыть ролик и продолжить игру" onClick={onClose}><X size={23}/></button>
    </header>
    <p className="video-details" id="video-details">{reward.details} <strong>+{reward.points}</strong></p>
    <div className="video-screen">
      {online && <iframe key={String(lockedMuted)} ref={frame} src={tiktokPlayerUrl(reward.videoId, lockedMuted)}
        title="Ролик Зазеркалья в TikTok" allow="autoplay; fullscreen" allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin" onLoad={() => {setDocumentLoaded(true); send(mute.current ? 'mute' : 'unMute'); send('play');}} onError={() => setStatus('unavailable')}/>}
      {((status === 'loading' && !documentLoaded) || status === 'unavailable') && <div className={`video-message ${status === 'loading' && online ? 'video-loading' : ''}`} role="status">
        <span aria-hidden="true">✦</span>
        <p>{status === 'loading' ? 'Ловим сигнал…' : 'Ролик сейчас недоступен.'}</p>
        <small>{status === 'loading' ? 'Зазеркалье на связи' : 'Можно открыть его в TikTok или продолжить игру.'}</small>
        {online && status === 'unavailable' && <a href={tiktokPostUrl(reward.videoId)} target="_blank" rel="noopener noreferrer">Открыть в TikTok <ArrowUpRight size={16}/></a>}
      </div>}
      {online && status === 'blocked' && <button className="video-play" onClick={() => {send('play'); setStatus('ready');}}><Play size={20}/> Смотреть ролик</button>}
    </div>
    {online && status === 'slow' && <p className="video-hint" role="status">Не запускается? Открой ролик по ссылке ниже.</p>}
    <div className="video-credit">
      <a href={tiktokPostUrl(reward.videoId)} target="_blank" rel="noopener noreferrer">@zazer_kalye <ArrowUpRight size={14}/></a>
      {online && muted && <button aria-label={lockedMuted ? 'Смотреть ролик со звуком с начала' : 'Включить звук ролика'} onClick={() => {mute.current = false; setMuted(false); if (lockedMuted) setLockedMuted(false); else send('unMute');}}> <Volume2 size={15}/> {lockedMuted ? 'Со звуком ↻' : 'Звук ролика'}</button>}
    </div>
    <button className="video-continue" onClick={onClose}>Продолжить игру <span aria-hidden="true">▶</span></button>
  </dialog>;
}
