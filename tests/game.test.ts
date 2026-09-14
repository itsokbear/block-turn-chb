import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh,rotate,fits,canPlay,validSave,restoreSave,SHAPES,shapeWeight,chooseShape,isZigzag,deal,canFitShape } from '../lib/game.ts';
test('four rotations restore asymmetric piece',()=>{const s=[[1,0],[1,0],[1,1]];assert.deepEqual(rotate(rotate(rotate(rotate(s)))),s);assert.deepEqual(rotate(s),[[1,1,1],[1,0,0]]);});
test('game remains playable when only a rotated piece fits',()=>{const g=fresh();g.board=g.board.map(r=>r.map(()=>1));g.board[2][3]=0;g.board[3][3]=0;g.board[4][3]=0;g.pieces=[{shape:[[1,1,1]],color:1},null,null];assert.equal(fits(g.board,g.pieces[0]!.shape,2,3),false);assert.equal(canPlay(g),true);g.board[3][3]=1;g.bombs=0;assert.equal(canPlay(g),false);});
test('save validation rejects malformed data',()=>{assert.equal(validSave(fresh()),true);assert.equal(validSave(null),false);assert.equal(validSave({...fresh(),score:Infinity}),false);assert.equal(validSave({...fresh(),pieces:[null,null,null]}),false);});
test('square 3×3 is in the deal pool',()=>{assert.ok(SHAPES.some(s=>s.length===3&&s.every(r=>r.length===3&&r.every(v=>v===1))));});
test('start without bomb and cap old saves without resetting progress',()=>{const g=fresh();assert.equal(g.bombs,0);g.score=200;const {bombs,...legacy}=g;assert.equal(restoreSave(legacy)?.bombs,0);assert.equal(restoreSave({...g,bombs:5})?.bombs,1);assert.equal(validSave({...g,bombs:2}),false);assert.equal(restoreSave(legacy)?.score,200);assert.equal(restoreSave({...g,bombs:0})?.bombs,0);assert.equal(restoreSave({...g,bombs:-1}),null);});

test('old bomb saves load as ordinary bombs',()=>{const {goldenBomb,...old}=fresh();assert.equal(restoreSave(old)?.goldenBomb,false);assert.equal(validSave({...fresh(),goldenBomb:true}),false);});


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
