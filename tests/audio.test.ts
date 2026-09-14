import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playEffect} from '../lib/audio.ts';
function fake(state='suspended'){
 let finish:()=>void=()=>{};const starts:number[]=[];
 const param={setValueAtTime(){},exponentialRampToValueAtTime(){}};
 const ctx={state,currentTime:10,destination:{},resume(){return new Promise<void>(resolve=>{finish=()=>{ctx.state='running';resolve();};});},createOscillator(){return {frequency:param,connect(){},disconnect(){},start(t:number){starts.push(t);},stop(){}};},createGain(){return {gain:param,connect(){},disconnect(){}};}};
 return {context:ctx as unknown as AudioContext,starts,resume:()=>finish()};
}
test('iPhone effect waits for resume before scheduling sound',async()=>{const f=fake();const p=playEffect(f.context,'move',()=>true);assert.equal(f.starts.length,0);f.resume();await p;assert.equal(f.starts.length,1);assert.ok(f.starts[0]>10);});
test('muting while resume is pending prevents queued effects',async()=>{const f=fake();let enabled=true;const p=playEffect(f.context,'clear',()=>enabled);enabled=false;f.resume();await p;assert.equal(f.starts.length,0);});
test('running context plays the celebration chord',async()=>{const f=fake('running');await playEffect(f.context,'celebrate',()=>true);assert.equal(f.starts.length,3);});
