'use client';
import {useLayoutEffect,useRef,type CSSProperties} from 'react';
import type {Serpent} from '../lib/game';
import {BruniHead,BruniTail} from './bruni-art';
export default function SnakeLayer({snake,eaten,bruni=false}:{snake:Serpent;eaten:number|null;bruni?:boolean}){
 const layerRef=useRef<HTMLDivElement>(null);
 const spineRef=useRef<SVGPolylineElement>(null);
 // Follow the actual CSS-interpolated segment centers, including turns and resize.
 useLayoutEffect(()=>{
  const layer=layerRef.current,spine=spineRef.current;if(!layer||!spine)return;
  const segments=Array.from(layer.querySelectorAll<HTMLElement>('.serpent-segment'));
  const draw=()=>{
   const bounds=layer.getBoundingClientRect();
   spine.setAttribute('points',segments.map(segment=>{const r=segment.getBoundingClientRect();return `${r.left+r.width/2-bounds.left},${r.top+r.height/2-bounds.top}`;}).join(' '));
   spine.setAttribute('stroke-width',String(Math.max(6,(bounds.width-28)/8*.28)));
  };
  draw();
  const observer=new ResizeObserver(draw);observer.observe(layer);
  let frame=0;const end=performance.now()+320;
  const tick=()=>{draw();if(performance.now()<end)frame=requestAnimationFrame(tick);};
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[snake.cells]);
 const direction=snake.next===null?'•':snake.next-snake.cells[0]===1?'›':snake.next-snake.cells[0]===-1?'‹':snake.next>snake.cells[0]?'⌄':'⌃';
 const tail=snake.cells.at(-1)!,beforeTail=snake.cells.at(-2)!;
 const tailAngle=Math.atan2((tail>>3)-(beforeTail>>3),(tail%8)-(beforeTail%8))*180/Math.PI;
 return <div ref={layerRef} className={`serpent-layer ${bruni?'serpent-bruni':''}`} aria-hidden="true"><svg className="serpent-spine" width="100%" height="100%" focusable="false"><polyline ref={spineRef}/></svg>{snake.cells.map((cell,index)=><span key={index} className={`serpent-segment ${index===0?'serpent-segment-head':''} ${index===snake.cells.length-1?'serpent-segment-tail':''} ${index===0&&snake.stun?'serpent-segment-stunned':''}`} style={{left:`calc(${cell%8} * (100% + 4px) / 8)`,top:`calc(${cell>>3} * (100% + 4px) / 8)`,zIndex:6-index} as CSSProperties}>{index===0?<span className={`serpent-face ${eaten===cell?'serpent-eating':''}`}>{bruni?<BruniHead/>:direction}</span>:bruni&&index===snake.cells.length-1?<BruniTail angle={tailAngle}/>:null}</span>)}</div>;
}
