export const TOUCH_GAIN = 1.5;
// Figures enter from below; the bomb control above the board enters from above.
export function touchPlacement(dx:number,dy:number,size:number,width:number,height:number,bomb=false,originX=4*size){
 const center=Math.max(width*size/2,Math.min((8-width/2)*size,originX));
 const left=center-width*size/2+dx*TOUCH_GAIN;
 const top=(bomb?-1:9-height)*size+dy*TOUCH_GAIN;
 return {left,top,row:Math.round(top/size),col:Math.round(left/size)};
}
export function touchReturned(row:number,height:number,bomb=false){return bomb?row<0:row>8-height;}
