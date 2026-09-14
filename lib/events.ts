import type {Game} from './game';
export type MoveEventKind='beautiful'|'bullseye'|'brilliant'|'masterful'|'genius'|'perfect'|null;
export const MOVE_EVENT_COPY={beautiful:'ОТЛИЧНО!',bullseye:'В ТОЧКУ!',brilliant:'БЛЕСТЯЩЕ!',masterful:'МАСТЕРСКИ!',genius:'ГЕНИАЛЬНО!',perfect:'БЕЗУПРЕЧНО!'} as const;
export function classifyMoveEvent(rows:number,cols:number,perfect=false):MoveEventKind{
 const total=rows+cols;
 return perfect?'perfect':total>=5?'genius':total===4?'masterful':total===3?'brilliant':total===2?(rows&&cols?'bullseye':'beautiful'):null;
}
export function moveEvent(before:Game,after:Game,allClear:boolean,placement:boolean,rowsCleared:number[]=[],colsCleared:number[]=[]){
 if(!placement)return null;
 const bomb=after.bombs>before.bombs||(!before.goldenBomb&&after.goldenBomb),reroll=after.rerolls>before.rerolls,molt=(after.molts??0)>(before.molts??0);
 const totalLines=rowsCleared.length+colsCleared.length,classification=classifyMoveEvent(rowsCleared.length,colsCleared.length,allClear);
 if(!classification&&!bomb&&!reroll&&!molt)return null;
 const tier=classification==='perfect'||classification==='genius'?3:classification==='masterful'||classification==='brilliant'?2:1;
 const rewards=[bomb?'Бомба готова':null,reroll?'Реролл получен':null,molt?'Линька готова':null].filter(Boolean).join(' · ');
 const details=classification==='perfect'?(bomb?(reroll?'Золотая бомба · Реролл получен':'Золотая бомба получена'):reroll?'Поле очищено · Реролл получен':'Поле очищено'):[classification==='bullseye'?'Строка + столбец':totalLines>=2?`${totalLines} ${totalLines<=4?'линии':'линий'}`:null,rewards||null].filter(Boolean).join(' · ');
 const duration=classification==='beautiful'?650:classification==='bullseye'?800:classification==='brilliant'?900:classification==='masterful'?1000:classification==='genius'?1100:1200;
 return {bomb,reroll,molt,bombEarned:bomb,rerollEarned:reroll,classification,totalLines,rowsCleared,colsCleared,tier,duration,kind:classification??'reward',title:classification?MOVE_EVENT_COPY[classification]:'',details,rewards};
}
