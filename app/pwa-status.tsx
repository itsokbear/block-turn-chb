'use client';
import {useEffect,useRef,useState} from 'react';
import {monitorUpdates} from '../lib/pwa-updates';
export default function PwaStatus(){
 const [status,setStatus]=useState('');const [waiting,setWaiting]=useState<ServiceWorker|null>(null);const updating=useRef(false);
 useEffect(()=>{
  if(!window.isSecureContext){setStatus('Офлайн-установка доступна по HTTPS');return;}
  if(!('serviceWorker' in navigator)){setStatus('Этот браузер не поддерживает офлайн-режим');return;}
  let disposed=false;const cleanups:(()=>void)[]=[];
  const report=(text:string)=>{if(!disposed)setStatus(text);};
  const controllerChange=()=>{if(updating.current)window.location.reload();};
  navigator.serviceWorker.addEventListener('controllerchange',controllerChange);
  report('Сохраняем игру для офлайн-режима…');
  navigator.serviceWorker.register(new URL('sw.js',new URL(document.querySelector<HTMLLinkElement>('link[rel=manifest]')?.href||'manifest.webmanifest',location.href)).href,{updateViaCache:'none'}).then(reg=>{
   if(disposed)return;
   cleanups.push(monitorUpdates(reg,worker=>{if(!disposed)setWaiting(worker);}));
   navigator.serviceWorker.ready.then(()=>report('Готово к игре без интернета'));
  }).catch(()=>report('Офлайн-режим не сохранён. Обнови страницу при подключении к сети.'));
  return()=>{disposed=true;cleanups.forEach(fn=>fn());navigator.serviceWorker.removeEventListener('controllerchange',controllerChange);};
 },[]);
 return <div className="pwa-status" role="status">{waiting?<button onClick={()=>{updating.current=true;setStatus('Обновляем игру…');waiting.postMessage({type:'ACTIVATE_UPDATE'});setWaiting(null);}}>Доступна новая версия · Обновить</button>:status}</div>;
}
