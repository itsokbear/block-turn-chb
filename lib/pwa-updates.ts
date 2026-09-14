// An initial installation may briefly occupy `waiting` before activating itself.
// Only a distinct installed replacement of an existing worker is an update.
export function waitingUpdate(reg: ServiceWorkerRegistration): ServiceWorker | null {
 const worker = reg.waiting;
 return reg.active && worker && worker !== reg.active && worker.state === 'installed' ? worker : null;
}

// Keep installed PWAs up to date even when the page stays open for days.
export function monitorUpdates(reg: ServiceWorkerRegistration, onWaiting: (worker: ServiceWorker | null) => void, page: Document = document, host: Window = window) {
 let disposed = false, pending = false;
 let reported: ServiceWorker | null | undefined;
 const workers = new Map<ServiceWorker, () => void>();
 const watch = () => {
  if (disposed) return;
  for (const worker of [reg.installing, reg.waiting, reg.active]) {
   if (!worker || workers.has(worker)) continue;
   workers.set(worker, watch);
   worker.addEventListener('statechange', watch);
  }
  const waiting = waitingUpdate(reg);
  if (reported !== waiting) { reported = waiting; onWaiting(waiting); }
 };
 const check = async () => {
  watch();
  if (disposed || pending || page.visibilityState === 'hidden') return;
  pending = true;
  try { await reg.update(); watch(); } catch { /* Keep the cached release offline. */ }
  finally { pending = false; }
 };
 reg.addEventListener('updatefound', watch); watch();
 page.addEventListener('visibilitychange', check);
 host.addEventListener('focus', check); host.addEventListener('online', check);
 const timer = host.setInterval(check, 60_000); void check();
 return () => {
  disposed = true; host.clearInterval(timer); reg.removeEventListener('updatefound', watch);
  page.removeEventListener('visibilitychange', check);
  host.removeEventListener('focus', check); host.removeEventListener('online', check);
  workers.forEach((listener, worker) => worker.removeEventListener('statechange', listener));
 };
}

export type UpdateResult = 'updated' | 'current' | 'failed' | 'cancelled';
export function applyUpdate(reg: ServiceWorkerRegistration, signal: AbortSignal, container: ServiceWorkerContainer = navigator.serviceWorker, host: Window = window): Promise<UpdateResult> {
 if (signal.aborted) return Promise.resolve('cancelled');
 // Re-read the registration at click time: another tab may have activated it.
 const worker = waitingUpdate(reg);
 if (!worker) return Promise.resolve('current');
 return new Promise(resolve => {
  let done = false;
  const finish = (result: UpdateResult) => {
   if (done) return;
   done = true; host.clearTimeout(timer);
   worker.removeEventListener('statechange', change);
   container.removeEventListener('controllerchange', change);
   signal.removeEventListener('abort', cancel);
   resolve(result);
  };
  const activated = () => container.controller === worker || (reg.active === worker && worker.state === 'activated');
  const change = () => {
   if (activated()) finish('updated');
   else if (worker.state === 'redundant') finish('failed');
  };
  const cancel = () => finish('cancelled');
  const timer = host.setTimeout(() => finish(activated() ? 'updated' : 'failed'), 10_000);
  worker.addEventListener('statechange', change);
  container.addEventListener('controllerchange', change);
  signal.addEventListener('abort', cancel, { once: true });
  try { worker.postMessage({ type: 'ACTIVATE_UPDATE' }); change(); }
  catch { finish('failed'); }
 });
}
