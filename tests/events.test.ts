import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,detonate} from '../lib/game.ts';
import {classifyMoveEvent,moveEvent,MOVE_EVENT_COPY} from '../lib/events.ts';
for(const [r,c,kind] of [[1,0,null],[2,0,'beautiful'],[0,2,'beautiful'],[1,1,'bullseye'],[2,1,'brilliant'],[2,2,'masterful'],[3,2,'genius'],[3,3,'genius']] as const)test(`classify ${r}+${c}`,()=>{assert.equal(classifyMoveEvent(r,c),kind);assert.equal(classifyMoveEvent(r,c,true),'perfect');});
test('fixed copy',()=>assert.deepEqual(Object.values(MOVE_EVENT_COPY),['ОТЛИЧНО!','В ТОЧКУ!','БЛЕСТЯЩЕ!','МАСТЕРСКИ!','ГЕНИАЛЬНО!','БЕЗУПРЕЧНО!']));
test('reroll is only announced when newly earned',()=>{const g=fresh();const e=moveEvent(g,{...g,rerolls:1},false,true,[0,1],[])!;assert.equal(e.rerollEarned,true);assert.equal(e.details,'2 линии · Реролл получен');const n=moveEvent({...g,rerolls:1},{...g,rerolls:1},false,true,[0,1],[])!;assert.equal(n.rerollEarned,false);assert.equal(n.details,'2 линии');});
test('one combined perfect clear event takes precedence over five lines',()=>{const g=fresh();const e=moveEvent(g,{...g,bombs:1,goldenBomb:true,rerolls:1},true,true,[0,1,2],[0,1])!;assert.equal(e.kind,'perfect');assert.equal(e.title,'БЕЗУПРЕЧНО!');assert.equal(e.details,'Золотая бомба · Реролл получен');});
test('bomb clear produces no classification or reroll',()=>{const g={...fresh(),bombs:1};g.board[0][0]=1;const r=detonate(g,0,0)!;assert.equal(r.game.rerolls,0);assert.equal(moveEvent(g,r.game,r.allClear,false),null);});
test('single line bomb reward has no competing title',()=>{const g=fresh();assert.equal(moveEvent(g,{...g,bombs:1},false,true,[0],[])!.title,'');});

test('molt reward is announced without requiring a multi-line event',()=>{const g=fresh();const event=moveEvent({...g,molts:0},{...g,molts:1},false,true,[0],[])!;assert.equal(event.molt,true);assert.equal(event.rewards,'Линька готова');assert.equal(moveEvent({...g,molts:1},{...g,molts:0},false,false),null);});
