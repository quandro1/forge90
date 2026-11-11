/* ===================================================================
   PROGRESSION — what to do next, from what was logged
   Double progression: add reps until every set reaches the top of the
   range, then add the smallest jump and start again at the bottom.

   Rules of the engine:
   - The reference is the last NORMAL session before today: a session
     logged in a deload week (entry.dl) is never the reference.
   - Today's target comes from that reference and stays on screen until
     today's prescribed sets are all logged; only then does the line
     switch to "Next session".
   - Only the prescribed number of sets is judged (extra sets are bonus
     work), and sets are named by the row they sit on.
   - Every branch returns a sentence: this must never throw or print a blank.
   =================================================================== */
function loggedSets(e){ return ((e&&e.sets)||[]).filter(s=>s&&s.r>0); }
/* the rows that count: the first `n` rows that have reps, each with its real row number */
function judged(e,n){
  const out=[];
  ((e&&e.sets)||[]).forEach((s,i)=>{ if(s&&s.r>0&&out.length<n) out.push({i:i, w:+s.w||0, r:s.r}); });
  return out;
}
/* the weight most of the sets used; a tie goes to the heavier one */
function workWeight(rows){
  const c={}; let best=null;
  rows.forEach(s=>{ const w=+s.w||0; c[w]=(c[w]||0)+1; });
  for(const k in c){ const w=+k; if(best==null||c[k]>c[best]||(c[k]===c[best]&&w>best)) best=w; }
  return best||0;
}
function kg(n){ return (Math.round(n*100)/100)+' kg'; }
function roundTo(x,st){ st=st>0?st:2.5; return Math.max(st,Math.round(x/st)*st); }
function nextLoad(ex,w){
  const st=+ex.step||2.5;
  if(ex.load==='db') return 'the next dumbbells up ('+kg(w+st)+' each)';
  if(ex.load==='machine'||ex.load==='cable') return 'one plate heavier (about '+kg(w+st)+')';
  return kg(w+st);
}
function setText(ex,it,s){                 // one logged set, as the logbook prints it
  const w=s.w==null?null:+s.w;
  if(it&&it.hold) return (w?w+' kg · ':'')+s.r+' s';
  if(ex.load==='bw') return (w?'+'+w+' kg':'BW')+'×'+s.r;
  return (w==null?'—':w)+'×'+s.r;
}
function isDeload(){ const i=infoForDate(TODAY); return !!(i&&i.deload); }
function deloadSets(n){ return Math.max(2,n-1); }

/* The advice a finished (or abandoned) session leads to. Returns {cls, txt} with no "Today:" in front. */
function adviceFrom(ex,it,e,hist){
  const rr=repRange(it), tgt=+it.sets||3, hold=!!it.hold, unit=hold?' s':'';
  const rows=judged(e,tgt), w=workWeight(rows), noLoad=!w;
  const at=noLoad?((ex.load==='bw'||hold)?'bodyweight':'the same weight'):kg(w);
  const step=+ex.step||2.5, drop=noLoad?'':kg(roundTo(w*0.9,step));
  const UP=t=>({cls:'up', txt:t}), HOLD=t=>({cls:'hold', txt:t});

  if(!rr){                                 // "as many as you can": the total is the score
    const total=rows.reduce((a,s)=>a+s.r,0);
    if(rows.length>=tgt&&rows.every(s=>s.r>=12))
      return UP('12 or more on every set — add '+kg(step)+' (a dumbbell between your feet, or a belt) and build back up.');
    return UP('beat '+total+' total reps ('+rows.map(s=>s.r).join(', ')+') by at least one.');
  }
  if(rows.length<tgt)
    return HOLD('last time you logged '+rows.length+' of '+tgt+' sets. Same '+at+', all '+tgt+' sets.');
  const mixed=rows.some(s=>s.w!==w)?' (Judged on your '+at+' sets.)':'';
  const atW=rows.filter(s=>s.w===w);
  if(atW.length>=tgt&&atW.every(s=>s.r>=rr[1])){
    const hit=rr[1]>rr[0]?'you reached '+rr[1]+unit+' on every set':'you got every set of '+rr[1]+unit;
    const again=rr[1]>rr[0]?' and start again at '+rr[0]+unit:'';
    if(hold) return UP(hit+'. Make it harder: a plate on your back or a harder version, and build back up from '+rr[0]+' s.');
    if(noLoad) return UP(hit+', so add '+kg(step)+' (hold a dumbbell or use a belt)'+again+'.');
    return UP(hit+', so go to '+nextLoad(ex,w)+again+'.');
  }
  const weak=rows.findIndex(s=>s.r<rr[0]);
  if(weak===0&&!noLoad&&!hold&&rows[0].r<=rr[0]-2)
    return HOLD('set 1 only reached '+rows[0].r+', well under '+rr[0]+'. That is too heavy for this range: drop to about '+drop+'.'+mixed);
  if(weak>=0){
    // under the floor two sessions running: take weight off instead of grinding
    const before=(hist||[]).filter(x=>x.d<e.d&&!x.dl), prev=before.length?before[before.length-1]:null;
    if(prev&&!noLoad&&!hold&&workWeight(judged(prev,tgt))===w&&judged(prev,tgt).some(s=>s.r<rr[0]))
      return HOLD('under '+rr[0]+' reps two sessions running at '+at+'. Drop to about '+drop+' and build back up.'+mixed);
    return HOLD('set '+(rows[weak].i+1)+' fell to '+rows[weak].r+unit+'. Stay at '+at+' until every set reaches '+rr[0]+unit+'.'+mixed);
  }
  // three sessions at one weight with no extra reps: stop grinding
  const upto=(hist||[]).filter(x=>x.d<=e.d&&!x.dl);
  if(upto.length>=3&&!noLoad&&!hold){
    const last3=upto.slice(-3), tot=x=>judged(x,tgt).reduce((a,s)=>a+s.r,0);
    if(last3.every(x=>workWeight(judged(x,tgt))===w)&&tot(last3[2])<=tot(last3[1])&&tot(last3[1])<=tot(last3[0]))
      return HOLD('three sessions at '+at+' without an extra rep. Take 10% off ('+drop+'), build back up, and check your sleep and protein.');
  }
  const next=rows.findIndex(s=>s.r<rr[1]);
  if(next<0) return UP('same '+at+', and make every set as clean as the best one.'+mixed);
  return UP('same '+at+' — '+(hold?'5 more seconds':'one more rep')+' on set '+(rows[next].i+1)+' ('+rows[next].r+unit+' → '+(rows[next].r+(hold?5:1))+unit+').'+mixed);
}
function firstTime(ex,it){
  const rr=repRange(it);
  if(it.hold) return 'Hold a clean position for '+rr[0]+'–'+rr[1]+' s. Log the seconds and the next session gets a target.';
  if(!rr) return 'Do as many clean reps as you can on each set, stopping one short of failure. Log them and the next session gets a target.';
  const range=rr[0]+(rr[1]>rr[0]?'–'+rr[1]:'');
  if(ex.load==='bw') return 'Aim for '+range+' clean reps a set. Log them and the next session gets a target.';
  return 'Pick a weight you can lift '+range+' times with one or two reps left at the end. Log it and the next session gets a target.';
}

function verdict(id,it){
  const ex=EX[id]; it=it||ex.typ;
  const rr=repRange(it), tgt=+it.sets||3, unit=it.hold?' s':'';
  const mk=(cls,txt)=>({cls:cls, ic:cls==='up'?ICO.up:cls==='hold'?ICO.hold:ICO.dot, txt:txt});
  const all=(S.logs[id]||[]).filter(x=>loggedSets(x).length);
  const todayE=all.find(x=>x.d===TODAY)||null;
  const normal=all.filter(x=>x.d<TODAY&&!x.dl);
  const ref=normal.length?normal[normal.length-1]:null;
  const nToday=todayE?judged(todayE,99).length:0;

  // ---- a deload session: nothing to beat, and it never becomes the reference
  if((todayE&&todayE.dl)||(!todayE&&isDeload())){
    const n=deloadSets(tgt);
    let t='Deload: ';
    if(ref){
      const w=workWeight(judged(ref,tgt));
      t+=(w?'about '+kg(roundTo(w*0.9,+ex.step||2.5))+' (10% under last time), ':'')+n+' sets, stop three reps short of failure.';
    }else t+='lighter than you could, '+n+' sets, stop three reps short of failure.';
    if(todayE) t+=' · '+Math.min(nToday,n)+' of '+n+' sets done';
    return mk('none',t+(nToday>=n&&todayE?' — that is enough for today.':''));
  }

  const plan=ref?adviceFrom(ex,it,ref,all):null;
  if(!todayE) return plan?mk(plan.cls,'Today: '+plan.txt):mk('none',firstTime(ex,it));

  // ---- today's session, still in progress: keep today's target on screen
  if(nToday<tgt){
    const rows=judged(todayE,tgt), prog=' · '+nToday+' of '+tgt+' sets done';
    const weak=rr?rows.findIndex(s=>s.r<rr[0]):-1;
    if(weak>=0) return mk('hold','Set '+(rows[weak].i+1)+' fell to '+rows[weak].r+unit+', under '+rr[0]+unit+'. Rest a little longer, or take some weight off for the sets left.'+prog);
    if(plan) return mk(plan.cls,'Today: '+plan.txt+prog);
    return mk('none',(rr?'Aim for at least '+rr[0]+unit+' on each set.':'Stop one rep short of failure on each set.')+prog);
  }
  // ---- today's session is complete: say what it earns
  const nx=adviceFrom(ex,it,todayE,all);
  return mk(nx.cls,'Next session: '+nx.txt);
}
/* The hint is advice; the logbook is the tool. If the advice cannot be worked
   out, the logbook must still draw and the rest must still start. */
function safeVerdict(id,it){
  try{ return verdict(id,it); }
  catch(err){ return {cls:'none', ic:ICO.dot, txt:'Log this session and the next one gets a target.'}; }
}
