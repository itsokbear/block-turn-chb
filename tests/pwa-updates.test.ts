import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monitorUpdates, waitingUpdate, applyUpdate } from '../lib/pwa-updates.ts';
function worker(state: string) { return Object.assign(new EventTarget(), { state, postMessage: (_: unknown) => {} }); }
function fixture() {
 let calls = 0, tick = () => {}, timeout = () => {}, timeouts = 0;
 const reg = Object.assign(new EventTarget(), { active: null as any, waiting: null as any, installing: null as any, update: async () => { calls++; } });
 const page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
 const host = Object.assign(new EventTarget(), { setInterval: (cb: () => void) => { tick = cb; return 1; }, clearInterval: () => { tick = () => {}; }, setTimeout: (cb: () => void) => { timeout = cb; timeouts++; return 2; }, clearTimeout: () => { timeout = () => {}; timeouts--; } });
 const container = Object.assign(new EventTarget(), { controller: null as any });
 const seen: unknown[] = [];
 return { reg, page, host, container, seen, get calls() { return calls; }, get timeouts() { return timeouts; }, tick: () => tick(), expire: () => timeout(), start: () => monitorUpdates(reg as any, w => seen.push(w), page as any, host as any), apply: (signal = new AbortController().signal) => applyUpdate(reg as any, signal, container as any, host as any) };
}
test('checks on startup, foreground, reconnect and timer; disposes listeners', async () => {
 const f = fixture(); const stop = f.start(); await Promise.resolve(); assert.equal(f.calls, 1);
 f.page.visibilityState = 'hidden'; f.tick(); assert.equal(f.calls, 1);
 f.page.visibilityState = 'visible'; f.page.dispatchEvent(new Event('visibilitychange')); await Promise.resolve(); assert.equal(f.calls, 2);
 f.host.dispatchEvent(new Event('online')); await Promise.resolve(); assert.equal(f.calls, 3);
 f.tick(); await Promise.resolve(); assert.equal(f.calls, 4);
 stop(); f.tick(); f.host.dispatchEvent(new Event('focus')); assert.equal(f.calls, 4);
});
test('first installation and transient waiting never advertise an update', async () => {
 const f = fixture(), first = worker('installing'); f.reg.installing = first;
 const stop = f.start(); await Promise.resolve();
 first.state = 'installed'; f.reg.waiting = first; first.dispatchEvent(new Event('statechange'));
 f.reg.active = first; first.dispatchEvent(new Event('statechange'));
 first.state = 'activated'; f.reg.waiting = null; f.reg.installing = null; first.dispatchEvent(new Event('statechange'));
 assert.deepEqual(f.seen, [null]); assert.equal(await f.apply(), 'current'); stop();
});
test('only registration.waiting is authoritative; repeated checks do not duplicate notifications', async () => {
 const f = fixture(), next = worker('installing'); f.reg.active = worker('activated'); f.reg.installing = next;
 f.reg.update = async () => { throw Error('offline'); };
 const stop = f.start(); await Promise.resolve();
 next.state = 'installed'; next.dispatchEvent(new Event('statechange')); assert.deepEqual(f.seen, [null]);
 f.reg.waiting = next; next.dispatchEvent(new Event('statechange')); f.host.dispatchEvent(new Event('focus'));
 assert.deepEqual(f.seen, [null, next]); stop();
});
test('activation in another tab or a redundant worker removes the stale update button', () => {
 for (const state of ['activating', 'activated', 'redundant']) {
  const f = fixture(), next = worker('installed'); f.reg.active = worker('activated'); f.reg.waiting = next;
  const stop = f.start(); next.state = state;
  next.dispatchEvent(new Event('statechange')); assert.deepEqual(f.seen, [next, null]);
  stop();
 }
});
test('click re-reads waiting and never sends a message to the already active worker', async () => {
 const f = fixture(), next = worker('installed'); f.reg.active = worker('activated'); f.reg.waiting = next;
 const stop = f.start(); let messages = 0; next.postMessage = () => { messages++; };
 f.reg.active = next; f.reg.waiting = null; next.state = 'activated';
 assert.equal(await f.apply(), 'current'); assert.equal(messages, 0); stop();
});
test('a real update completes once, even with controller and state notifications together', async () => {
 const f = fixture(), next = worker('installed'); f.reg.active = worker('activated'); f.reg.waiting = next;
 const messages: unknown[] = []; next.postMessage = m => messages.push(m);
 const result = f.apply(); assert.deepEqual(messages, [{ type: 'ACTIVATE_UPDATE' }]);
 f.container.controller = next; f.container.dispatchEvent(new Event('controllerchange'));
 next.state = 'activated'; f.reg.active = next; f.reg.waiting = null; next.dispatchEvent(new Event('statechange'));
 assert.equal(await result, 'updated'); assert.equal(f.timeouts, 0);
});
test('activation state completes an update when controllerchange is not delivered', async () => {
 const f = fixture(), next = worker('installed'); f.reg.active = worker('activated'); f.reg.waiting = next;
 const result = f.apply(); f.reg.waiting = null; f.reg.active = next; next.state = 'activated'; next.dispatchEvent(new Event('statechange'));
 assert.equal(await result, 'updated'); assert.equal(f.timeouts, 0);
});
test('an unrelated controller change cannot complete this app update', async () => {
 const f = fixture(), next = worker('installed'); f.reg.active = worker('activated'); f.reg.waiting = next;
 const result = f.apply(); f.container.controller = worker('activated'); f.container.dispatchEvent(new Event('controllerchange'));
 assert.equal(f.timeouts, 1); f.expire(); assert.equal(await result, 'failed');
 assert.equal(waitingUpdate(f.reg as any), next); // The actual pending update remains retryable.
});
test('timeout also recognizes completed activation without either event', async () => {
 const f = fixture(), next = worker('installed'); f.reg.active = worker('activated'); f.reg.waiting = next;
 const result = f.apply(); f.reg.active = next; f.reg.waiting = null; next.state = 'activated'; f.expire();
 assert.equal(await result, 'updated');
});
test('a failed message or discarded worker cannot leave an infinite updating state', async () => {
 for (const failure of ['message', 'redundant']) {
  const f = fixture(), next = worker('installed'); f.reg.active = worker('activated'); f.reg.waiting = next;
  if (failure === 'message') next.postMessage = () => { throw Error('dead worker'); };
  const result = f.apply();
  if (failure === 'redundant') { next.state = 'redundant'; next.dispatchEvent(new Event('statechange')); }
  assert.equal(await result, 'failed'); assert.equal(f.timeouts, 0);
 }
});
test('unmount cancels pending activation and releases its timer and listeners', async () => {
 const f = fixture(), next = worker('installed'); f.reg.active = worker('activated'); f.reg.waiting = next;
 const abort = new AbortController(), result = f.apply(abort.signal); abort.abort();
 assert.equal(await result, 'cancelled'); assert.equal(f.timeouts, 0);
 assert.equal(await f.apply(abort.signal), 'cancelled');
});
