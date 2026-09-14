import { test } from 'node:test';
import assert from 'node:assert/strict';
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
