import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from '../lib/game.ts';
import {freshSerpent,occupied,nextStep,placeSerpent,bombSerpent,rerollSerpent,canPlaySerpent,restoreSerpent,moltSerpent,POOP} from '../lib/serpent.ts';
function setup(){const g=freshSerpent();g.serpent!.next=22;g.pieces=[{shape:[[1]],color:1},{shape:[[1]],color:2},null];return g;}
test('six distinct contiguous segments and visible legal next cell',()=>{const g=setup();assert.equal(g.serpent!.cells.length,6);assert.equal(occupied(g).flat().filter(v=>v===7).length,6);assert.equal(nextStep([30,29,28,27,26,25],()=>0),22);assert.equal(placeSerpent(g,0,3,6),null);});
test('one predetermined step per figure; no mutation',()=>{const g=setup(),before=JSON.stringify(g);const r=placeSerpent(g,0,0,0,()=>0)!;assert.deepEqual(r.game.serpent!.cells,[22,30,29,28,27,26]);assert.equal(r.poop,null);assert.equal(r.game.board[3][1],0);assert.equal(JSON.stringify(g),before);});
for(const value of [2,POOP])test(`eats ${value} and leaves exactly one poop at old tail`,()=>{const g=setup();g.board[2][6]=value;const r=placeSerpent(g,0,0,0)!;assert.equal(r.eaten,22);assert.equal(r.poop,25);assert.equal(r.game.board[2][6],0);assert.equal(r.game.board[3][1],POOP);assert.equal(r.game.board.flat().filter(v=>v===POOP).length,1);});
test('player line through head clears blocks and snake keeps moving',()=>{const g=setup();g.board[3][7]=2;const r=placeSerpent(g,0,3,0)!;assert.equal(r.game.serpent!.won,false);assert.equal(r.game.serpent!.cells[0],22);assert.equal(r.game.board[3][7],0);assert.equal(r.eaten,null);});
test('head completes prepared line and survives',()=>{const g=setup();g.board[2]=[1,1,1,1,1,1,0,1];const r=placeSerpent(g,0,7,7)!;assert.equal(r.game.serpent!.won,false);assert.equal(r.game.serpent!.cells[0],22);assert.equal(r.game.lines,1);assert.ok(r.game.board[2].every(v=>!v));});
test('body completes line but survives its clear',()=>{const g=setup();for(let y=1;y<8;y++)if(y!==3)g.board[y][5]=1;const r=placeSerpent(g,0,0,5)!;assert.equal(r.game.serpent!.won,false);assert.equal(r.game.serpent!.cells.length,6);assert.ok(r.game.serpent!.cells.includes(29));assert.equal(r.game.lines,1);assert.ok(r.game.board.every(row=>row[5]===0));});
test('poop can be cleared with normal line',()=>{const g=setup();g.board[0]=[0,6,1,1,1,1,1,1];const r=placeSerpent(g,0,0,0)!;assert.equal(r.game.board[0][1],0);});
for(const golden of [false,true])test(`bomb ${golden?'golden':'normal'} clears blocks and stuns head without moving or killing`,()=>{const g=setup();g.bombs=1;g.goldenBomb=golden;g.rerolls=1;g.board[2][6]=POOP;const r=bombSerpent(g,3,6)!;assert.equal(r.game.board[2][6],0);assert.equal(r.game.serpent!.won,false);assert.equal(r.game.serpent!.stun,true);assert.deepEqual(r.game.serpent!.cells,g.serpent!.cells);assert.equal(r.game.rerolls,1);const paused=placeSerpent(r.game,0,0,0)!;assert.deepEqual(paused.game.serpent!.cells,g.serpent!.cells);assert.equal(paused.game.serpent!.next,22);assert.equal(paused.game.serpent!.stun,false);assert.equal(placeSerpent(paused.game,1,0,1)!.game.serpent!.cells[0],22);});
test('bomb hitting body only does not stun',()=>{const g=setup();g.bombs=1;assert.equal(bombSerpent(g,3,1)!.game.serpent!.stun,false);});
test('reroll uses occupied board, does not move snake or change score/combo',()=>{const g=setup();g.rerolls=1;g.combo=3;const r=rerollSerpent(g,0,()=>0)!;assert.deepEqual(r.serpent,g.serpent);assert.equal(r.board,g.board);assert.equal(r.score,g.score);assert.equal(r.combo,3);assert.equal(r.rerolls,0);});
test('game over accounts for snake occupancy and rescue resources',()=>{const g=setup();g.board=g.board.map((r,y)=>r.map((_,x)=>g.serpent!.cells.includes(y*8+x)?0:1));assert.equal(canPlaySerpent(g),false);assert.equal(canPlaySerpent({...g,bombs:1}),true);assert.equal(canPlaySerpent({...g,rerolls:1}),true);});
test('restore maintains poop, intent and stun; rejects broken segments/overlaps',()=>{const g=setup();g.board[0][0]=POOP;g.serpent!.stun=true;assert.deepEqual(restoreSerpent(JSON.parse(JSON.stringify(g))),g);assert.equal(restoreSerpent(fresh()),null);assert.equal(restoreSerpent({...g,serpent:{...g.serpent,cells:[0,1,2,3,4,4]}}),null);assert.equal(restoreSerpent({...g,serpent:{...g.serpent,next:29}}),null);g.board[3][6]=1;assert.equal(restoreSerpent(g),null);});
test('final slot deal uses board after snake advances',()=>{const g=setup();g.pieces[1]=null;const r=placeSerpent(g,0,0,0,()=>0)!;assert.equal(r.game.pieces.filter(Boolean).length,3);assert.equal(canPlaySerpent(r.game),true);});
test('moving snake cannot exit grid or enter body across deterministic choices',()=>{for(let k=0;k<10;k++){let cells=setup().serpent!.cells;for(let n=0;n<100;n++){const next=nextStep(cells,()=>k/10);assert.notEqual(next,null);if(next===null)break;assert.ok(next>=0&&next<64);assert.ok(!cells.includes(next));assert.equal(Math.abs((next>>3)-(cells[0]>>3))+Math.abs(next%8-cells[0]%8),1);cells=[next,...cells.slice(0,-1)];}}});

test('ongoing game restores after head completes line',()=>{const g=setup();g.board[2]=[1,1,1,1,1,1,0,1];const r=placeSerpent(g,0,7,7)!;assert.deepEqual(restoreSerpent(r.game),r.game);});

test('legacy victory migrates into an ongoing immortal snake game',()=>{const g=setup();g.serpent!.won='caught';g.serpent!.next=null;const restored=restoreSerpent(g)!;assert.equal(restored.serpent!.won,false);assert.notEqual(restored.serpent!.next,null);assert.equal(restored.score,g.score);assert.ok(placeSerpent(restored,0,0,0));});
import {serpentRisk} from '../lib/serpent.ts';
function riskBoard(){const g=setup();g.board=g.board.map((r,y)=>r.map((_,x)=>g.serpent!.cells.includes(y*8+x)?0:(x+y)%2?1:0));g.pieces=[{shape:[[1]],color:1},{shape:[[1,1,1],[1,1,1],[1,1,1]],color:2},null];return g;}
test('serpent warns red or amber after full turn without modifying state',()=>{const g=riskBoard(),before=JSON.stringify(g);assert.equal(serpentRisk(g,0,0,0),'red');assert.equal(serpentRisk({...g,bombs:1},0,0,0),'amber');assert.equal(serpentRisk({...g,rerolls:1},0,0,0),'amber');assert.equal(JSON.stringify(g),before);assert.equal(serpentRisk(g,0,3,6),null);g.pieces[1]=null;assert.equal(serpentRisk(g,0,0,0),null);});
test('warning accounts for tail freed by movement and for stun',()=>{const g=riskBoard();g.board=g.board.map((r,y)=>r.map((_,x)=>g.serpent!.cells.includes(y*8+x)?0:(x+y)%2?1:0));g.board[2][6]=0;g.board[2][1]=0;g.board[4][1]=0;g.board[2][0]=1;g.board[2][2]=1;g.board[4][0]=1;g.board[4][2]=1;g.pieces[1]={shape:[[1],[1],[1]],color:2};assert.equal(serpentRisk(g,0,0,0),null);g.serpent!.stun=true;assert.equal(serpentRisk(g,0,0,0),'red');});

function shellLine(){const g=setup();g.board[0]=[0,POOP,POOP,1,1,1,1,1];return g;}
for(const choice of [0,0.5,0.999])test(`shell line fills one random empty bonus (${choice})`,()=>{
 const g=shellLine(),before=JSON.stringify(g);const r=placeSerpent(g,0,0,0,()=>choice)!.game;
 assert.equal(r.bombs,choice===0?1:0);assert.equal(r.rerolls,choice===0.5?1:0);assert.equal(r.molts,choice===0.999?1:0);assert.equal(r.goldenBomb,false);
 assert.equal(r.score,110);assert.equal(r.combo,1);assert.equal(JSON.stringify(g),before);
});
for(const bombs of [0,1])for(const rerolls of [0,1])for(const molts of [0,1])test(`shell reward respects occupied slots (${bombs}, ${rerolls}, ${molts})`,()=>{
 const g=shellLine();g.bombs=bombs;g.rerolls=rerolls;g.molts=molts;g.goldenBomb=bombs===1;
 const r=placeSerpent(g,0,0,0,()=>0.999)!.game;
 assert.equal(r.bombs+r.rerolls+r.molts!,Math.min(3,bombs+rerolls+molts+1));
 assert.ok(r.bombs>=bombs&&r.rerolls>=rerolls&&r.molts!>=molts);assert.equal(r.goldenBomb,g.goldenBomb);
});
test('shell reward fills reroll after earning combo bomb',()=>{
 const g=shellLine();g.combo=3;const r=placeSerpent(g,0,0,0,()=>0)!.game;
 assert.equal(r.combo,4);assert.equal(r.bombs,1);assert.equal(r.rerolls,1);
});
test('shell reward fills bomb after earning three-line reroll',()=>{
 const g=shellLine();g.board[1]=[0,1,1,1,1,1,1,1];g.board[2]=[0,1,1,1,1,1,1,1];g.pieces[0]!.shape=[[1],[1],[1]];
 const r=placeSerpent(g,0,0,0,()=>0)!.game;
 assert.equal(r.lines,3);assert.equal(r.bombs,1);assert.equal(r.rerolls,1);
});
test('movement shell clear earns reward without advancing combo',()=>{
 const g=setup();g.board[2]=[POOP,1,1,1,1,1,0,1];const r=placeSerpent(g,0,7,7,()=>0)!.game;
 assert.equal(r.lines,1);assert.equal(r.combo,0);assert.equal(r.score,110);assert.equal(r.bombs,1);
});
test('shell clears in both phases still earn only one reward',()=>{
 const g=shellLine();g.board[2]=[POOP,1,1,1,1,1,0,1];const r=placeSerpent(g,0,0,0,()=>0)!.game;
 assert.equal(r.lines,2);assert.equal(r.bombs+r.rerolls,1);
});
test('ordinary line, eating shell and bombing shell do not earn shell rewards',()=>{
 const ordinary=shellLine();ordinary.board[0]=[0,1,1,1,1,1,1,1];ordinary.board[7][0]=POOP;
 const eating=setup();eating.board[2][6]=POOP;
 const bombing=setup();bombing.bombs=1;bombing.board[0][0]=POOP;
 for(const r of [placeSerpent(ordinary,0,0,0)!,placeSerpent(eating,0,0,0)!,bombSerpent(bombing,0,0)!]){
  assert.equal(r.game.bombs,0);assert.equal(r.game.rerolls,0);
 }
});

test('1x1 molt removes only shells without a turn, points, rewards or mutation',()=>{
 const g=setup();g.molts=1;g.combo=3;g.serpent!.stun=true;g.board[0][0]=POOP;g.board[7][7]=POOP;g.board[0][1]=2;
 const before=JSON.stringify(g),r=moltSerpent(g,()=>0)!;
 assert.deepEqual(r.cleared,[0,63]);assert.equal(r.game.board[0][1],2);assert.equal(r.game.board.flat().includes(POOP),false);
 assert.deepEqual({...r.game,board:g.board,molts:1},g);assert.equal(r.game.molts,0);assert.equal(JSON.stringify(g),before);
 assert.equal(moltSerpent(r.game),null);assert.equal(moltSerpent({...setup(),molts:1}),null);assert.equal(moltSerpent({...fresh(),molts:1}),null);
});
test('molt save migrates missing slot and validates stored bonus',()=>{
 const g=setup();delete g.molts;assert.equal(restoreSerpent(g)!.molts,0);
 g.molts=1;assert.deepEqual(restoreSerpent(g),g);
 for(const molts of [-1,2,0.5,'1',null])assert.equal(restoreSerpent({...g,molts}),null);
});
test('molt prevents game over only when it creates a legal placement',()=>{
 const g=setup();g.molts=1;g.board=g.board.map((r,y)=>r.map((_,x)=>g.serpent!.cells.includes(y*8+x)?0:1));
 assert.equal(canPlaySerpent(g),false);g.board[0][0]=POOP;assert.equal(canPlaySerpent(g),true);
 g.pieces=[{shape:[[1,1]],color:1},null,null];assert.equal(canPlaySerpent(g),true);
 g.board[0][1]=POOP;assert.equal(canPlaySerpent(g),true);
});
test('risk recognizes useful molt but not an ineffective one',()=>{
 const g=riskBoard();g.molts=1;assert.equal(serpentRisk(g,0,0,0),'red');
 for(let y=5;y<8;y++)for(let x=5;x<8;x++)g.board[y][x]=POOP;
 assert.equal(serpentRisk(g,0,0,0),'amber');
});


test('trapped corner from screenshot recovers on restore and placement',()=>{
 const g=setup();g.serpent={cells:[63,55,47,46,54,62],next:null,stun:false,won:false};
 const before=JSON.stringify(g),restored=restoreSerpent(g)!;
 assert.deepEqual(restored.serpent!.cells,[62,54,46,47,55,63]);
 assert.equal(restored.serpent!.next,61);
 assert.equal(placeSerpent(g,0,0,0,()=>0)!.game.serpent!.cells[0],61);
 assert.equal(JSON.stringify(g),before);
});
test('route avoids the move that leads into the screenshot corner',()=>{
 const cells=[47,46,54,62,61,60];
 for(const random of [0,0.5,0.999])assert.notEqual(nextStep(cells,()=>random),55);
});
test('random walks always retain an escape route',()=>{
 let seed=123456789;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 let cells=[30,29,28,27,26,25];
 for(let turn=0;turn<10000;turn++){
  const next=nextStep(cells,random);assert.notEqual(next,null,`Trapped: ${cells}`);
  assert.ok(!cells.includes(next!));cells=[next!,...cells.slice(0,-1)];
 }
});
for(const [roll,size] of [[0,1],[0.5,2],[0.999,3]])test(`molt rolls ${size}x${size} and preserves size at corners`,()=>{
 for(const cell of [0,7,63,56,36]){
  const g=setup();g.molts=1;g.board=g.board.map((r,y)=>r.map((_,x)=>g.serpent!.cells.includes(y*8+x)?0:2));g.board[cell>>3][cell%8]=POOP;
  const before=JSON.stringify(g),r=moltSerpent(g,()=>roll)!;
  assert.equal(r.cleared.length,size*size);assert.ok(r.cleared.includes(cell));
  assert.ok(r.cleared.every(c=>r.game.board[c>>3][c%8]===0));
  assert.deepEqual({...r.game,board:g.board,molts:1},g);assert.equal(JSON.stringify(g),before);
 }
});
test('overlapping shells each roll once even when an earlier blast covers them',()=>{
 const g=setup();g.molts=1;g.board[0][0]=POOP;g.board[0][1]=POOP;g.board[0][2]=POOP;
 const rolls=[0.999,0.5,0];let calls=0;
 const r=moltSerpent(g,()=>rolls[calls++])!;
 assert.equal(calls,3);assert.equal(r.cleared.length,9);assert.equal(r.game.board.flat().includes(POOP),false);
});
test('rescue preview consumes no randomness and allows a chance to escape',()=>{
 const g=setup();g.molts=1;g.board=g.board.map((r,y)=>r.map((_,x)=>g.serpent!.cells.includes(y*8+x)?0:1));g.board[0][0]=POOP;
 g.pieces=[{shape:[[1,1]],color:1},null,null];
 const original=Math.random;Math.random=()=>{throw new Error('Preview consumed randomness');};
 try{assert.equal(canPlaySerpent(g),true);g.pieces[0]!.shape=Array.from({length:4},()=>[1,1,1,1]);assert.equal(canPlaySerpent(g),false);}finally{Math.random=original;}
});
