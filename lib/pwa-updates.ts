// Keep installed PWAs up to date even when the same page stays open for days.
export function monitorUpdates(reg:ServiceWorkerRegistration, onWaiting:(worker:ServiceWorker)=>void, page:Document=document, host:Window=window){
 let disposed=false,pending=false;
 const workers=new Map<ServiceWorker,()=>void>();
 const report=()=>{if(!disposed&&reg.waiting)onWaiting(reg.waiting);};
 const watch=()=>{
  report();const worker=reg.installing;if(!worker||workers.has(worker))return;
  const change=()=>{report();if(worker.state==='installed'&&reg.active&&!disposed)onWaiting(worker);};
  workers.set(worker,change);worker.addEventListener('statechange',change);change();
 };
 const check=async()=>{
  report();if(disposed||pending||page.visibilityState==='hidden')return;
  pending=true;try{await reg.update();watch();}catch{/* Offline: retain the playable cached release. */}finally{pending=false;}
 };
 reg.addEventListener('updatefound',watch);watch();
 page.addEventListener('visibilitychange',check);host.addEventListener('focus',check);host.addEventListener('online',check);
 const timer=host.setInterval(check,60_000);void check();
 return()=>{disposed=true;host.clearInterval(timer);reg.removeEventListener('updatefound',watch);page.removeEventListener('visibilitychange',check);host.removeEventListener('focus',check);host.removeEventListener('online',check);workers.forEach((change,worker)=>worker.removeEventListener('statechange',change));};
}
