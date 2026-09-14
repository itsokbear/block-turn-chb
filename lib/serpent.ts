import {fresh,deal,fits,canPlay,rerollPiece,bombArea,restoreSave,canEarnReroll,BOMB_COMBO_THRESHOLD,type Game} from './game.ts';
export const POOP=6;
export function occupied(g:Game){const board=g.board.map(r=>[...r]);if(g.serpent)for(const cell of g.serpent.cells)board[cell>>3][cell%8]=7;return board;}
const adjacent=(a:number,b:number)=>Math.abs((a>>3)-(b>>3))+Math.abs(a%8-b%8)===1;
function exits(cells:number[]){
 return [cells[0]-8,cells[0]+8,cells[0]-1,cells[0]+1].filter(i=>i>=0&&i<64&&adjacent(cells[0],i)&&!cells.includes(i));
}
function hasRoute(cells:number[],steps:number):boolean{
 return steps===0||exits(cells).some(i=>hasRoute([i,...cells.slice(0,-1)],steps-1));
}
export function nextStep(cells:number[],random:()=>number=Math.random):number|null{
 const candidates=exits(cells).sort((a,b)=>a-b);
 const open=candidates.filter(i=>hasRoute([i,...cells.slice(0,-1)],cells.length));
 return open.length?open[Math.floor(random()*open.length)]:null;
}
function recoverDirection(snake:NonNullable<Game['serpent']>,random:()=>number){
 if(snake.next!==null)return snake;
 const next=nextStep(snake.cells,random);
 if(next!==null)return {...snake,next};
 const cells=[...snake.cells].reverse();
 return {...snake,cells,next:nextStep(cells,random)};
}
export function freshSerpent():Game{const g=fresh();const cells=[30,29,28,27,26,25];g.molts=0;g.serpent={cells,next:nextStep(cells),stun:false,won:false};g.pieces=deal(occupied(g));return g;}
export function canPlaySerpent(g:Game){return canPlay({...g,board:occupied(g)})||canMoltRescue(g);}
export function rerollSerpent(g:Game,index:number,random:()=>number=Math.random){const result=rerollPiece({...g,board:occupied(g)},index,random);return result?{...result,board:g.board}:null;}
function clear(g:Game){
 const filled=occupied(g),rows=filled.flatMap((r,i)=>r.every(Boolean)?[i]:[]),cols=Array.from({length:8},(_,i)=>i).filter(i=>filled.every(r=>r[i]));
 let shellCleared=false;
 const cells:number[]=[];g.board.forEach((r,y)=>r.forEach((v,x)=>{if(rows.includes(y)||cols.includes(x)){if(v===POOP)shellCleared=true;cells.push(y*8+x);g.board[y][x]=0;}}));
 const head=g.serpent!.cells[0],hit=rows.includes(head>>3)||cols.includes(head%8);
 return {rows,cols,cells,hit,shellCleared};
}
export function placeSerpent(g:Game,index:number,row:number,col:number,random:()=>number=Math.random){
 const p=g.pieces[index],snake=g.serpent?recoverDirection(g.serpent,random):undefined;if(!snake||!p||!fits(occupied(g),p.shape,row,col))return null;
 const next:Game={...g,board:g.board.map(r=>[...r]),pieces:g.pieces.map((p,i)=>i===index?null:p),serpent:{...snake,cells:[...snake.cells]}};
 let count=0;p.shape.forEach((r,y)=>r.forEach((v,x)=>{if(v){next.board[row+y][col+x]=p.color;count++;}}));
 const a=clear(next);let b={rows:[] as number[],cols:[] as number[],cells:[] as number[],hit:false,shellCleared:false};let eaten:number|null=null,poop:number|null=null;
 if(snake.stun)next.serpent!.stun=false;
 else if(snake.next!==null){
  const target=snake.next,tail=snake.cells[5];
  if(next.board[target>>3][target%8]){eaten=target;poop=tail;}
  next.board[target>>3][target%8]=0;
  next.serpent!.cells=[target,...snake.cells.slice(0,-1)];
  if(poop!==null)next.board[poop>>3][poop%8]=POOP;
  b=clear(next);
 }
 const playerLines=a.rows.length+a.cols.length,total=playerLines+b.rows.length+b.cols.length;
 // Player clears earn standard rewards; either phase can earn one shell reward.
 next.combo=playerLines?g.combo+1:0;next.lines+=total;
 next.rerolls=canEarnReroll(playerLines)?1:g.rerolls;
 next.bombs=Math.min(1,g.bombs+(next.combo>0&&next.combo%BOMB_COMBO_THRESHOLD===0?1:0));
 if(a.shellCleared||b.shellCleared){
  const available=(['bombs','rerolls','molts'] as const).filter(key=>(next[key]??0)===0);
  if(available.length)next[available[available.length===1?0:Math.floor(random()*available.length)]]=1;
 }
 const points=count*10+playerLines*100*Math.max(1,next.combo)+(b.rows.length+b.cols.length)*100;next.score+=points;
 if(!snake.stun){next.serpent!.next=nextStep(next.serpent!.cells,random);next.serpent=recoverDirection(next.serpent!,random);}
 if(next.pieces.every(p=>p===null))next.pieces=deal(occupied(next),random);
 return {game:next,cleared:[...new Set([...a.cells,...b.cells])],points,allClear:false,rowsCleared:a.rows,colsCleared:a.cols,eaten,poop};
}
export function bombSerpent(g:Game,row:number,col:number){
 if(!g.serpent||!g.bombs)return null;const area=bombArea(row,col,g.goldenBomb?5:3);if(!area.length)return null;
 const board=g.board.map(r=>[...r]);let count=0;for(const cell of area){if(board[cell>>3][cell%8])count++;board[cell>>3][cell%8]=0;}
 return {game:{...g,board,bombs:0,goldenBomb:false,score:g.score+count*10,serpent:{...g.serpent,stun:g.serpent.stun||area.includes(g.serpent.cells[0])}},points:count*10,cleared:area,allClear:false,rowsCleared:[] as number[],colsCleared:[] as number[],eaten:null,poop:null};
}
export function moltSerpent(g:Game,random:()=>number=Math.random){
 if(!g.serpent||g.molts!==1)return null;
 const shells=g.board.flatMap((r,y)=>r.flatMap((v,x)=>v===POOP?[y*8+x]:[]));
 if(!shells.length)return null;
 const cleared=[...new Set(shells.flatMap(cell=>bombArea(cell>>3,cell%8,(1+Math.floor(random()*3)) as 1|2|3)))];
 const board=g.board.map(r=>[...r]);
 for(const cell of cleared)board[cell>>3][cell%8]=0;
 return {game:{...g,board,molts:0},cleared};
}
export function canMoltRescue(g:Game){
 // Keep the molt available while its largest possible blasts can still rescue the game.
 const result=moltSerpent(g,()=>0.999);
 return !!result&&canPlay({...result.game,bombs:0,rerolls:0,board:occupied(result.game)});
}
export function restoreSerpent(value:unknown):Game|null{
 if(!value||typeof value!=='object')return null;const g=value as Game,s=g.serpent;
 if(g.molts!==undefined&&g.molts!==0&&g.molts!==1)return null;
 if(!s||!Array.isArray(s.cells)||s.cells.length!==6||new Set(s.cells).size!==6||!s.cells.every((c,i)=>Number.isInteger(c)&&c>=0&&c<64&&(!i||adjacent(c,s.cells[i-1])))||typeof s.stun!=='boolean'||![false,'caught','trap'].includes(s.won))return null;
 if(s.next!==null&&(!Number.isInteger(s.next)||s.next<0||s.next>=64||s.cells.includes(s.next)||!adjacent(s.cells[0],s.next)))return null;
 if(!Array.isArray(g.board)||g.board.length!==8||!g.board.every(r=>Array.isArray(r)&&r.length===8&&r.every(v=>Number.isInteger(v)&&v>=0&&v<=POOP)))return null;
 if(!s.won&&s.cells.some(c=>g.board[c>>3][c%8]!==0))return null;
 const valid=restoreSave({...g,board:g.board.map(r=>r.map(v=>v===POOP?1:v))});return valid?{...valid,molts:g.molts??0,board:g.board,serpent:recoverDirection({...s,won:false,next:s.won?null:s.next},Math.random)}:null;
}

export function serpentRisk(g:Game,index:number,row:number,col:number):'red'|'amber'|null{
 if(!g.serpent||g.pieces.filter(Boolean).length<=1)return null;
 // Resolve only the already announced step. Future intent cannot affect immediate fit.
 // Fixed randomness keeps preview from consuming the live game's random sequence.
 const result=placeSerpent(g,index,row,col,()=>0);if(!result)return null;
 const next=result.game;
 if(canPlaySerpent({...next,bombs:0,rerolls:0,molts:0}))return null;
 return next.bombs>0||next.rerolls>0||canMoltRescue(next)?'amber':'red';
}
