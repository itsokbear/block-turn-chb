import {test} from 'node:test';
import assert from 'node:assert/strict';
import {monitorUpdates} from '../lib/pwa-updates.ts';
test('checks on startup, foreground, reconnect and timer; disposes listeners',async()=>{
 const reg=Object.assign(new EventTarget(),{waiting:null,installing:null,update:async()=>{calls++;}});
 let calls=0,tick:()=>void=()=>{},cleared=false;
 const page=Object.assign(new EventTarget(),{visibilityState:'visible'});
 const host=Object.assign(new EventTarget(),{setInterval:(cb:()=>void)=>{tick=cb;return 1;},clearInterval:()=>{cleared=true;}});
 const found:unknown[]=[];
 const stop=monitorUpdates(reg as any,w=>found.push(w),page as any,host as any);
 await Promise.resolve();assert.equal(calls,1);
 page.visibilityState='hidden';tick();assert.equal(calls,1);
 page.visibilityState='visible';page.dispatchEvent(new Event('visibilitychange'));await Promise.resolve();assert.equal(calls,2);
 host.dispatchEvent(new Event('online'));await Promise.resolve();assert.equal(calls,3);
 tick();await Promise.resolve();assert.equal(calls,4);
 const worker=Object.assign(new EventTarget(),{state:'installed'});
 Object.assign(reg,{waiting:worker});host.dispatchEvent(new Event('focus'));await Promise.resolve();assert.ok(found.includes(worker));
 stop();host.dispatchEvent(new Event('focus'));assert.equal(calls,5);assert.equal(cleared,true);
});
test('notifies when a new worker finishes installing, handles offline checks',async()=>{
 const worker=Object.assign(new EventTarget(),{state:'installing'});
 const reg=Object.assign(new EventTarget(),{active:{},waiting:null,installing:worker,update:async()=>{throw Error('offline');}});
 const page=Object.assign(new EventTarget(),{visibilityState:'visible'});
 const host=Object.assign(new EventTarget(),{setInterval:()=>1,clearInterval:()=>{}});
 const found:unknown[]=[];const stop=monitorUpdates(reg as any,w=>found.push(w),page as any,host as any);
 await Promise.resolve();assert.equal(found.length,0);
 worker.state='installed';worker.dispatchEvent(new Event('statechange'));assert.deepEqual(found,[worker]);stop();
});
