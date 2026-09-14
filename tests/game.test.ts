import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh,rotate,fits,canPlay,place,validSave,restoreSave,detonate,bombArea,previewLines,SHAPES,shapeWeight,chooseShape,isZigzag,deal,canFitShape } from '../lib/game.ts';
test('four rotations restore asymmetric piece',()=>{const s=[[1,0],[1,0],[1,1]];assert.deepEqual(rotate(rotate(rotate(rotate(s)))),s);assert.deepEqual(rotate(s),[[1,1,1],[1,0,0]]);});
test('reject overlap and bounds without mutation',()=>{const g=fresh();g.pieces=[{shape:[[1,1]],color:2},null,null];g.board[0][0]=1;const before=JSON.stringify(g);assert.equal(place(g,0,0,0),null);assert.equal(place(g,0,0,7),null);assert.equal(place(g,0,-1,0),null);assert.equal(JSON.stringify(g),before);});
test('clear intersecting row and column simultaneously',()=>{const g=fresh();g.pieces=[{shape:[[1]],color:2},null,null];g.board[0]=Array(8).fill(1);g.board.forEach(r=>r[0]=1);g.board[0][0]=0;const r=place(g,0,0,0)!;assert.equal(r.cleared.length,15);assert.equal(r.game.lines,2);assert.equal(r.game.score,210);assert.ok(r.game.board.every(row=>row.every(n=>n===0)));assert.equal(r.game.pieces.filter(Boolean).length,3);assert.equal(g.board[0][0],0);});
test('game remains playable when only a rotated piece fits',()=>{const g=fresh();g.board=g.board.map(r=>r.map(()=>1));g.board[2][3]=0;g.board[3][3]=0;g.board[4][3]=0;g.pieces=[{shape:[[1,1,1]],color:1},null,null];assert.equal(fits(g.board,g.pieces[0]!.shape,2,3),false);assert.equal(canPlay(g),true);g.board[3][3]=1;g.bombs=0;assert.equal(canPlay(g),false);});
test('combo grows on consecutive clears and resets on ordinary move',()=>{const g=fresh();g.board[0]=[0,1,1,1,1,1,1,1];g.combo=1;g.pieces=[{shape:[[1]],color:1},{shape:[[1]],color:2},null];const a=place(g,0,0,0)!;assert.equal(a.game.combo,2);assert.equal(a.points,210);assert.equal(place(a.game,1,2,2)!.game.combo,0);});
test('save validation rejects malformed data',()=>{assert.equal(validSave(fresh()),true);assert.equal(validSave(null),false);assert.equal(validSave({...fresh(),score:Infinity}),false);assert.equal(validSave({...fresh(),pieces:[null,null,null]}),false);});
test('square 3×3 is in the deal pool',()=>{assert.ok(SHAPES.some(s=>s.length===3&&s.every(r=>r.length===3&&r.every(v=>v===1))));});
test('start without bomb and cap old saves without resetting progress',()=>{const g=fresh();assert.equal(g.bombs,0);g.score=200;const {bombs,...legacy}=g;assert.equal(restoreSave(legacy)?.bombs,0);assert.equal(restoreSave({...g,bombs:5})?.bombs,1);assert.equal(validSave({...g,bombs:2}),false);assert.equal(restoreSave(legacy)?.score,200);assert.equal(restoreSave({...g,bombs:0})?.bombs,0);assert.equal(restoreSave({...g,bombs:-1}),null);});
test('bomb awarded every fourth clearing placement, never per line',()=>{let g=fresh();for(let i=1;i<=8;i++){g.board=Array.from({length:8},()=>Array(8).fill(0));g.board[0]=[0,1,1,1,1,1,1,1];g.board[7][7]=2;g.pieces=[{shape:[[1]],color:1},null,null];g=place(g,0,0,0)!.game;assert.equal(g.bombs,i<4?0:1);}assert.equal(g.combo,8);});
test('bomb clears full 3×3 at edges, consumes one, preserves pieces and combo',()=>{const g=fresh();g.board=g.board.map(r=>r.map(()=>2));g.combo=2;g.bombs=1;const before=JSON.stringify(g);const r=detonate(g,0,7)!;assert.equal(r.cleared.length,9);assert.equal(r.game.board.flat().filter(n=>n===0).length,9);assert.equal(r.game.bombs,0);assert.equal(r.game.combo,2);assert.deepEqual(r.game.pieces,g.pieces);assert.equal(r.game.lines,0);assert.equal(JSON.stringify(g),before);assert.deepEqual(bombArea(0,7),[5,6,7,13,14,15,21,22,23]);});
test('bomb is usable on occupied or empty cells but not outside the board',()=>{const g=fresh();g.bombs=1;assert.ok(detonate(g,4,4));assert.equal(detonate(g,-1,0),null);assert.equal(detonate(g,8,0),null);assert.equal(detonate({...g,bombs:0},0,0),null);g.board=g.board.map(r=>r.map(()=>1));assert.equal(canPlay(g),true);assert.equal(canPlay({...g,bombs:0}),false);});
test('preview includes intersecting complete lines and never mutates board',()=>{const g=fresh();g.board[0]=Array(8).fill(1);g.board.forEach(r=>r[0]=1);g.board[0][0]=0;const before=JSON.stringify(g.board);const preview=previewLines(g.board,[[1]],0,0);assert.equal(preview.length,15);g.pieces=[{shape:[[1]],color:2},null,null];assert.deepEqual(preview,place(g,0,0,0)!.cleared);assert.equal(JSON.stringify(g.board),before);assert.deepEqual(previewLines(g.board,[[1]],0,1),[]);assert.deepEqual(previewLines(g.board,[[1]],-1,0),[]);});

import {touchPlacement,touchReturned,TOUCH_GAIN} from '../lib/drag.ts';
test('touch drag reaches lowest legal row for every figure height',()=>{for(const size of [32,40,48])for(const height of [1,2,3,4]){const p=touchPlacement(0,-size/TOUCH_GAIN,size,2,height);assert.equal(p.row,8-height);assert.equal(touchReturned(p.row,height),false);const horizontal=touchPlacement(size/TOUCH_GAIN,-size/TOUCH_GAIN,size,2,height);assert.equal(horizontal.row,8-height);assert.equal(horizontal.col,p.col+1);}});
test('touch drag reaches top row and cancels only beyond board edge',()=>{for(const height of [1,2,3,4]){assert.equal(touchPlacement(0,-(9-height)*40/TOUCH_GAIN,40,2,height).row,0);assert.equal(touchReturned(touchPlacement(0,0,40,2,height).row,height),true);}const bomb=touchPlacement(0,40/TOUCH_GAIN,40,1,1,true);assert.equal(bomb.row,0);assert.equal(touchReturned(bomb.row,1,true),false);assert.equal(touchReturned(-1,1,true),true);});
test('side pieces start above their own tray slots and reach both edges within screen',()=>{
 const size=40,boardWidth=8*size;
 for(const width of [1,2,3,4])for(const origin of [boardWidth/6,boardWidth/2,boardWidth*5/6]){
  const start=touchPlacement(0,0,size,width,2,false,origin);
  const expectedCenter=Math.max(width*size/2,Math.min(boardWidth-width*size/2,origin));
  assert.equal(start.left,expectedCenter-width*size/2);
  for(const target of [0,8-width]){
   const dx=(target*size-start.left)/TOUCH_GAIN;
   assert.ok(origin+dx>=0&&origin+dx<=boardWidth);
   const end=touchPlacement(dx,-size/TOUCH_GAIN,size,width,2,false,origin);
   assert.equal(end.col,target);assert.equal(end.row,6);assert.equal(touchReturned(end.row,2),false);
  }
 }
});

test('spent bomb can be earned again at the next combo milestone',()=>{let g=fresh();g.bombs=1;g.combo=4;g.board[7][7]=2;g=detonate(g,4,4)!.game;assert.equal(g.bombs,0);for(let i=5;i<=8;i++){g.board[0]=[0,1,1,1,1,1,1,1];g.board[7][7]=2;g.pieces=[{shape:[[1]],color:1},null,null];g=place(g,0,0,0)!.game;assert.equal(g.bombs,i===8?1:0);}});

test('full line clear gives one golden bomb and repeat rewards never stack',()=>{for(const bombs of [0,1]){const g=fresh();g.bombs=bombs;g.board[0]=[0,1,1,1,1,1,1,1];g.pieces=[{shape:[[1]],color:1},null,null];const result=place(g,0,0,0)!;assert.equal(result.allClear,true);assert.equal(result.game.bombs,1);assert.equal(result.game.goldenBomb,true);assert.equal(restoreSave(result.game)?.goldenBomb,true);}});
test('golden bomb preview and blast clear 25 cells at corners and centre',()=>{for(const [row,col] of [[0,0],[4,4],[7,7]]){const g=fresh();g.board=g.board.map(r=>r.map(()=>1));g.bombs=1;g.goldenBomb=true;const result=detonate(g,row,col)!;assert.equal(result.cleared.length,25);assert.deepEqual(result.cleared,bombArea(row,col,5));assert.equal(result.game.board.flat().filter(n=>n===0).length,25);assert.equal(result.game.bombs,0);assert.equal(result.game.goldenBomb,false);}});
test('bomb clearing the board never replenishes a bomb',()=>{const g=fresh();g.bombs=1;assert.equal(detonate(g,0,0)!.allClear,false);assert.equal(detonate(g,0,0)!.game.bombs,0);g.board[0][0]=2;const result=detonate(g,0,0)!;assert.equal(result.allClear,true);assert.equal(result.game.goldenBomb,false);assert.equal(result.game.bombs,0);});
test('old bomb saves load as ordinary bombs',()=>{const {goldenBomb,...old}=fresh();assert.equal(restoreSave(old)?.goldenBomb,false);assert.equal(validSave({...fresh(),goldenBomb:true}),false);});

test('golden bomb clearing last blocks is consumed without replacement',()=>{const g=fresh();g.board[0][0]=2;g.bombs=1;g.goldenBomb=true;const r=detonate(g,0,0)!;assert.equal(r.allClear,true);assert.equal(r.game.bombs,0);assert.equal(r.game.goldenBomb,false);});

test('weighted draw gives exact requested probability for every shape',()=>{
 assert.equal(SHAPES.length,14);
 const counts=new Map(SHAPES.map(shape=>[shape,0]));
 const total=SHAPES.reduce((sum,shape)=>sum+shapeWeight(shape),0);
 for(let ticket=0;ticket<total;ticket++){const shape=chooseShape((ticket+.5)/total);counts.set(shape,counts.get(shape)!+1);}
 for(const shape of SHAPES){const cells=shape.flat().reduce((sum,v)=>sum+v,0);assert.equal(counts.get(shape),cells===1?7:cells===2?10:cells===3?14:isZigzag(shape)?35:70);}
});
test('weighted draw covers endpoint intervals and rejects invalid random values',()=>{assert.equal(chooseShape(0),SHAPES[0]);assert.equal(chooseShape(1-Number.EPSILON),SHAPES.at(-1));for(const value of [-1,1,NaN,Infinity])assert.throws(()=>chooseShape(value),RangeError);});

test('every reflected shape is available, without rotational duplicates',()=>{
 const key=(shape:number[][])=>{const variants:string[]=[];let s=shape;for(let i=0;i<4;i++){variants.push(JSON.stringify(s));s=rotate(s);}return variants.sort()[0];};
 const available=new Set(SHAPES.map(key));
 assert.equal(available.size,SHAPES.length);
 for(const shape of SHAPES){const mirror=shape.map(row=>[...row].reverse());assert.ok(available.has(key(mirror)),`Missing mirror for ${JSON.stringify(shape)}`);}
});

test('zigzags and their rotations have half the ordinary weight',()=>{for(const shape of [[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]]){assert.equal(shapeWeight(shape),35);assert.equal(shapeWeight(rotate(shape)),35);}assert.equal(shapeWeight([[1,0],[1,0],[1,1]]),70);});
test('new deal guarantees a move in a single empty cell even with a bomb available',()=>{const board=Array.from({length:8},()=>Array(8).fill(1));board[7][0]=0;const before=JSON.stringify(board);const pieces=deal(board,()=>.99);assert.equal(pieces.length,3);assert.ok(pieces.some(p=>canFitShape(board,p.shape)));assert.equal(JSON.stringify(board),before);});
test('playable random deal is preserved and a completely full board terminates',()=>{const empty=fresh().board;assert.deepEqual(deal(empty,()=>.5),deal(undefined,()=>.5));const full=empty.map(r=>r.map(()=>1));assert.equal(deal(full,()=>.99).length,3);});
test('refill after final placement uses the resulting board',()=>{const g=fresh();g.board=g.board.map((r,y)=>r.map((_,x)=>(x+y)%2?1:0));g.pieces=[null,null,{shape:[[1]],color:1}];const result=place(g,2,0,0)!;assert.ok(result.game.pieces.some(p=>p&&canFitShape(result.game.board,p.shape)));});
