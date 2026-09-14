'use client';
import { useEffect, useRef, useState } from 'react';
import { applyUpdate, monitorUpdates, waitingUpdate } from '../lib/pwa-updates';
const readyText = 'Готово к игре без интернета';
export default function PwaStatus() {
 const [status, setStatus] = useState('');
 const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
 const [updating, setUpdating] = useState(false);
 const registration = useRef<ServiceWorkerRegistration | null>(null);
 const attempt = useRef<AbortController | null>(null);
 useEffect(() => {
  if (!window.isSecureContext) { setStatus('Офлайн-установка доступна по HTTPS'); return; }
  if (!('serviceWorker' in navigator)) { setStatus('Этот браузер не поддерживает офлайн-режим'); return; }
  let disposed = false;
  const cleanups: (() => void)[] = [];
  const report = (text: string) => { if (!disposed && !attempt.current) setStatus(text); };
  report('Сохраняем игру для офлайн-режима…');
  navigator.serviceWorker.register(new URL('sw.js', new URL(document.querySelector<HTMLLinkElement>('link[rel=manifest]')?.href || 'manifest.webmanifest', location.href)).href, { updateViaCache: 'none' }).then(reg => {
   if (disposed) return;
   registration.current = reg;
   cleanups.push(monitorUpdates(reg, worker => { if (!disposed) setWaiting(worker); }));
   // Observe this app's registration, rather than another app's controller.
   const active = () => { if (reg.active?.state === 'activated') report(readyText); };
   const observe = () => {
    active();
    const worker = reg.installing || reg.waiting || reg.active;
    if (worker) { worker.addEventListener('statechange', active); cleanups.push(() => worker.removeEventListener('statechange', active)); }
   };
   reg.addEventListener('updatefound', observe);
   cleanups.push(() => reg.removeEventListener('updatefound', observe)); observe();
  }).catch(() => report('Офлайн-режим не сохранён. Обнови страницу при подключении к сети.'));
  return () => { disposed = true; attempt.current?.abort(); attempt.current = null; registration.current = null; cleanups.forEach(fn => fn()); };
 }, []);
 async function update() {
  const reg = registration.current;
  if (!reg || attempt.current) return;
  const request = new AbortController(); attempt.current = request;
  setUpdating(true); setStatus('Обновляем игру…');
  const result = await applyUpdate(reg, request.signal);
  if (request.signal.aborted) return;
  attempt.current = null; setUpdating(false); setWaiting(waitingUpdate(reg));
  if (result === 'updated') { window.location.reload(); return; }
  setStatus(result === 'current' ? readyText : 'Не удалось обновить игру. Попробуй ещё раз или открой игру заново.');
 }
 return <div className="pwa-status" role="status">{updating ? status : waiting ? <button onClick={update}>Доступна новая версия · Обновить</button> : status}</div>;
}
