import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,placementRisk,detonate} from '../lib/game.ts';
function trapped(){const g=fresh();g.board=g.board.map((r,y)=>r.map((_,x)=>(x+y)%2?1:0));g.pieces=[{shape:[[1]],color:1},{shape:[[1,1]],color:2},null];return g;}
test('red for dead end, amber for either rescue, no mutation',()=>{const g=trapped(),before=JSON.stringify(g);assert.equal(placementRisk(g,0,0,0),'red');assert.equal(placementRisk({...g,bombs:1},0,0,0),'amber');assert.equal(placementRisk({...g,rerolls:1},0,0,0),'amber');assert.equal(JSON.stringify(g),before);});
test('invalid positions and final hand piece do not warn',()=>{const g=trapped();assert.equal(placementRisk(g,0,0,1),null);g.pieces[1]=null;assert.equal(placementRisk(g,0,0,0),null);});
test('remaining piece can fit after rotation',()=>{const g=trapped();g.board[1][0]=0;assert.equal(placementRisk(g,0,6,6),null);});
test('line clearance is evaluated before risk',()=>{const g=trapped();g.board[0]=[0,1,1,1,1,1,1,1];assert.equal(placementRisk(g,0,0,0),null);});
test('bomb use preserves stored reroll',()=>{const g={...fresh(),bombs:1,rerolls:1};assert.equal(detonate(g,0,0)!.game.rerolls,1);});
test('two-line clear no longer earns rescue reroll',()=>{const g=trapped();g.board[0]=[0,1,1,1,1,1,1,1];g.board[1]=[0,1,1,1,1,1,1,1];g.pieces=[{shape:[[1],[1]],color:1},{shape:[[1,1,1],[1,1,1],[1,1,1]],color:2},null];assert.equal(placementRisk(g,0,0,0),'red');});
