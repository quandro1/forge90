/* ===================================================================
   TEMPO BEEPS
   "Beeps" beside a lift's tempo line plays the pace of one rep, round and round, like a metronome: start it,
   put the phone down, and move with it. A note marks the start of each part of the rep (low for the slow
   part, high for the fast part, in between for a hold or a squeeze) and a soft tick marks each further second.

   The beat is read from the tempo line itself (EX[id].tempo), so the sound and the words on the card cannot
   disagree. A line is understood part by part, up to its first full stop:
     "<b>3 s</b> down"                    3 seconds, called "down"   ("<b>2–3 s</b>" counts as 3: slower is the safe side)
     "<b>1–2 s</b> pause at the bottom"   2 seconds, called "pause"
     "press up" / "pull up" / "then stand up strongly" / "then press up without bouncing"    1 second, called "up"
     "a short hold" / "a short squeeze"   1 second
   A line with any other part (the deadlift, the walking lunge, a timed hold) gets no Beeps button.
   The beeps stop on a second tap, when a set is ticked, when the app is left, or after three minutes.
   =================================================================== */
const TEMPO_HZ={low:440, mid:660, high:880}, TEMPO_MAX=180000;
function tempoPlan(id){
  const e=EX[id]; if(!e||typeof e.tempo!=='string') return null;
  const out=[];
  for(const part of e.tempo.split('.')[0].split(', ')){
    let m;
    if((m=/^(?:then )?<b>(\d+)(?:–(\d+))? s<\/b> ([a-z]+)(?: at the bottom)?$/.exec(part))) out.push({label:m[3], secs:+(m[2]||m[1])});
    else if(/^(?:then )?(?:press|pull|stand) up(?: strongly| without bouncing)?$/i.test(part)) out.push({label:'up', secs:1});
    else if((m=/^a short (hold|squeeze)$/.exec(part))) out.push({label:m[1], secs:1});
    else return null;
  }
  if(out.length<2||out.some(p=>!(p.secs>=1&&p.secs<=3))) return null;
  // the slow part of the rep is the longest part that is not a hold; when two are as long, the later one
  let slow=-1;
  out.forEach((p,i)=>{ p.hold=/^(hold|squeeze|pause)$/.test(p.label); if(!p.hold&&(slow<0||p.secs>=out[slow].secs)) slow=i; });
  out.forEach((p,i)=>{ p.pitch=p.hold?'mid':i===slow?'low':'high'; delete p.hold; });
  return out;
}
function tempoLink(id){
  return tempoPlan(id)?' <button class="lkbtn tempo" data-tempo="'+id+'" aria-pressed="false">▶ Beeps</button><span class="tempo-now" data-tempo-now="'+id+'" aria-hidden="true"></span>':'';
}
/* one short note; every beep of the tempo goes through here */
function tone(hz,dur,gain){
  if(!AC) return;
  try{
    const o=AC.createOscillator(), g=AC.createGain(), t=AC.currentTime;
    o.type='sine'; o.frequency.value=hz;
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(gain,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+dur+0.02);
  }catch(e){}
}
let TEMPO=null;                              // the beat in progress: {id, plan, t0, key, timer}
/* which part of the rep, and which second of that part, `ms` after the start */
function tempoAt(plan,ms){
  const total=plan.reduce((a,p)=>a+p.secs,0)*1000, cyc=Math.floor(ms/total); let t=ms-cyc*total;
  for(let i=0;i<plan.length;i++){ const d=plan[i].secs*1000; if(t<d) return {cyc:cyc, i:i, sec:Math.floor(t/1000)}; t-=d; }
  return {cyc:cyc, i:plan.length-1, sec:plan[plan.length-1].secs-1};
}
function tempoPaint(id,on,label){
  $$('[data-tempo="'+id+'"]').forEach(b=>{ b.textContent=on?'■ Stop beeps':'▶ Beeps'; b.setAttribute('aria-pressed',String(!!on)); });
  $$('[data-tempo-now="'+id+'"]').forEach(s=>{ s.textContent=on&&label?label:''; });
}
function tempoTick(){
  const T=TEMPO; if(!T) return;
  const ms=Date.now()-T.t0;
  if(ms>=TEMPO_MAX){ tempoStop(); return; }
  const at=tempoAt(T.plan,ms), key=at.cyc+'/'+at.i+'/'+at.sec;
  if(key===T.key) return;
  T.key=key;
  const p=T.plan[at.i], first=at.sec===0;
  tone(TEMPO_HZ[p.pitch], first?0.17:0.06, first?0.5:0.14);
  if(first) tempoPaint(T.id,true,p.label);
}
function tempoStart(id){
  const plan=tempoPlan(id); if(!plan) return;
  tempoStop();
  audioUnlock();
  TEMPO={id:id, plan:plan, t0:Date.now(), key:'', timer:setInterval(tempoTick,50)};
  wakeLock(true);                            // the screen stays on while the beat runs
  tempoTick();
}
function tempoStop(){
  const T=TEMPO; if(!T) return;
  clearInterval(T.timer); TEMPO=null;
  tempoPaint(T.id,false);
  if(!(RT&&!RT.done)) wakeLock(false);       // a rest that is counting down keeps the screen on by itself
}
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState!=='visible') tempoStop(); });
