export type SoundKind='move'|'clear'|'celebrate'|'reroll'|'bright'|'harmony'|'perfect';
export async function playEffect(context:AudioContext,kind:SoundKind,stillEnabled:()=>boolean){
 // resume must be invoked within the original click/touch call stack.
 if(context.state!=='running')await context.resume();
 if(context.state!=='running'||!stillEnabled())return;
 const frequencies=kind==='perfect'?[523.25,659.25,783.99,1046.5]:kind==='bright'?[783.99]:kind==='harmony'?[659.25,987.77]:kind==='reroll'?[880,1320]:kind==='celebrate'?[523.25,659.25,783.99]:[kind==='clear'?660:330];
 frequencies.forEach((frequency,i)=>{
  const oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.connect(gain);gain.connect(context.destination);
  const start=context.currentTime+.01+i*.07,duration=kind==='perfect'?.7:kind==='celebrate'?.6:.2;
  oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start);
  if(kind==='move'||kind==='clear')oscillator.frequency.exponentialRampToValueAtTime(kind==='clear'?1100:440,start+.14);
  gain.gain.setValueAtTime(kind==='bright'?.035:kind==='harmony'?.03:kind==='perfect'?.035:kind==='reroll'?.025:kind==='celebrate'?.035:.07,start);
  gain.gain.exponentialRampToValueAtTime(.001,start+duration);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  oscillator.start(start);oscillator.stop(start+duration);
 });
}
