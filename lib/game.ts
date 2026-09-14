export type Shape = number[][];
export type Piece = { shape: Shape; color: number };
export type Serpent = {cells:number[];next:number|null;stun:boolean;won:false|'caught'|'trap'};
export type Game = { serpent?:Serpent; molts?:number; board: number[][]; pieces: (Piece | null)[]; score: number; lines: number; combo: number; bombs: number; goldenBomb: boolean; rerolls: number };
export const SHAPES: Shape[] = [[[1]],[[1,1]],[[1,1,1]],[[1,0],[1,1]],[[1,1,1],[1,1,1],[1,1,1]],[[1,1,1,1]],[[1,1],[1,1]],[[1,0],[1,0],[1,1]],[[0,1],[0,1],[1,1]],[[1,1,1],[0,1,0]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]],[[1,1,1],[1,1,1]],[[1,1,1],[1,0,0],[1,0,0]]];
export function rotate(s: Shape): Shape { return s[0].map((_,c)=>s.map(row=>row[c]).reverse()); }
export function isZigzag(shape:Shape):boolean {let s=shape;for(let i=0;i<4;i++,s=rotate(s)){const key=JSON.stringify(s);if(key==='[[1,1,0],[0,1,1]]'||key==='[[0,1,1],[1,1,0]]')return true;}return false;}
// Integer weights preserve the exact 1/5, 1/7 and 1/10 ratios.
export function shapeWeight(shape:Shape):number {const cells=shape.flat().reduce((sum,v)=>sum+v,0);return cells===1?7:cells===2?10:cells===3?14:isZigzag(shape)?35:70;}
export function chooseShape(random=Math.random(),pool:Shape[]=SHAPES):Shape {
 if(!Number.isFinite(random)||random<0||random>=1)throw new RangeError('Random value must be in [0, 1)');
 if(!pool.length)throw new RangeError('Empty shape pool');
 const total=pool.reduce((sum,shape)=>sum+shapeWeight(shape),0);let ticket=random*total;
 for(const shape of pool){ticket-=shapeWeight(shape);if(ticket<0)return shape;}
 return pool[pool.length-1];
}
export function canFitShape(board:number[][],shape:Shape):boolean {let s=shape;for(let n=0;n<4;n++,s=rotate(s))for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(fits(board,s,r,c))return true;return false;}
export function deal(board?:number[][],random:()=>number=Math.random):Piece[]{
 const pieces=Array.from({length:3},()=>({shape:chooseShape(random()).map(r=>[...r]),color:1+Math.floor(random()*5)}));
 if(board&&!pieces.some(p=>canFitShape(board,p.shape))){
  const playable=SHAPES.filter(shape=>canFitShape(board,shape));
  if(playable.length){const slot=Math.floor(random()*pieces.length);pieces[slot]={...pieces[slot],shape:chooseShape(random(),playable).map(r=>[...r])};}
 }
 return pieces;
}
export function fresh(): Game { return {board:Array.from({length:8},()=>Array(8).fill(0)),pieces:deal(),score:0,lines:0,combo:0,bombs:0,goldenBomb:false,rerolls:0}; }
export function fits(board:number[][],shape:Shape,row:number,col:number) { return Number.isInteger(row)&&Number.isInteger(col)&&shape.every((r,y)=>r.every((v,x)=>!v||(row+y>=0&&row+y<8&&col+x>=0&&col+x<8&&board[row+y][col+x]===0))); }
export function canPlay(g:Game) {return g.bombs>0||g.rerolls>0||g.pieces.some(p=>p&&canFitShape(g.board,p.shape));}
export function validSave(v:unknown):v is Game {const g=v as Game;return !!g&&Array.isArray(g.board)&&g.board.length===8&&g.board.every(r=>Array.isArray(r)&&r.length===8&&r.every(n=>Number.isInteger(n)&&n>=0&&n<=5))&&Array.isArray(g.pieces)&&g.pieces.length===3&&g.pieces.some(Boolean)&&g.pieces.every(p=>p===null||(Number.isInteger(p.color)&&p.color>=1&&p.color<=5&&Array.isArray(p.shape)&&p.shape.length>0&&p.shape.length<=4&&p.shape.every(r=>Array.isArray(r)&&r.length===p.shape[0].length&&r.length>0&&r.length<=4&&r.every(v=>v===0||v===1))&&p.shape.some(r=>r.some(Boolean))))&&(g.rerolls===0||g.rerolls===1)&&typeof g.goldenBomb==='boolean'&&(!g.goldenBomb||g.bombs===1)&&(g.bombs===0||g.bombs===1)&&[g.score,g.lines,g.combo,g.bombs].every(n=>Number.isSafeInteger(n)&&n>=0);}

// The clicked cell is the blast centre; at an edge shift the full 3×3 area inward.
export function bombArea(row:number,col:number,size:1|2|3|5=3):number[] {
 if(!Number.isInteger(row)||!Number.isInteger(col)||row<0||row>7||col<0||col>7)return [];
 const radius=Math.floor(size/2);
 const top=Math.max(0,Math.min(8-size,row-radius)),left=Math.max(0,Math.min(8-size,col-radius));
 return Array.from({length:size*size},(_,i)=>(top+Math.floor(i/size))*8+left+i%size);
}
export function restoreSave(value:unknown):Game|null {
 if(!value||typeof value!=='object')return null;
 const previous=('bombs' in value)?value.bombs:0;
 if(typeof previous!=='number'||!Number.isSafeInteger(previous)||previous<0)return null;
 const migrated={...value,rerolls:('rerolls' in value)?value.rerolls:0,bombs:Math.min(1,previous),goldenBomb:('goldenBomb' in value)?value.goldenBomb:false};
 return validSave(migrated)?migrated:null;
}
export function previewLines(board:number[][],shape:Shape,row:number,col:number):number[] {
 if(!fits(board,shape,row,col))return [];
 const filled=board.map(r=>[...r]);shape.forEach((r,y)=>r.forEach((v,x)=>{if(v)filled[row+y][col+x]=1;}));
 const rows=filled.map(r=>r.every(Boolean));const cols=Array.from({length:8},(_,c)=>filled.every(r=>!!r[c]));
 return Array.from({length:64},(_,i)=>i).filter(i=>rows[Math.floor(i/8)]||cols[i%8]);
}

export const REROLL_LINES_THRESHOLD=3;
export const BOMB_COMBO_THRESHOLD=4;
export function canEarnReroll(lines:number){return lines>=REROLL_LINES_THRESHOLD;}
export function shapeClass(shape:Shape){const keys:string[]=[];for(let i=0;i<4;i++,shape=rotate(shape))keys.push(JSON.stringify(shape));return keys.sort()[0];}
export function playableShapes(board:number[][]){return SHAPES.filter(shape=>canFitShape(board,shape));}
export function rerollPiece(g:Game,index:number,random:()=>number=Math.random):Game|null{
 const old=g.pieces[index];if(g.rerolls!==1||!old)return null;
 const playable=playableShapes(g.board);if(!playable.length)return null;
 const alternatives=playable.filter(s=>shapeClass(s)!==shapeClass(old.shape));
 const piece={shape:chooseShape(random(),alternatives.length?alternatives:playable).map(r=>[...r]),color:1+Math.floor(random()*5)};
 return {...g,rerolls:0,pieces:g.pieces.map((p,i)=>i===index?piece:p)};
}
