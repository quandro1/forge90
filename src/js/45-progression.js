/* ===================================================================
   PROGRESSION — what to do next, from what was logged
   Double progression: add reps until every set reaches the top of the
   range, then add the smallest jump and start again at the bottom.
   The rules read only what is in the log, and every branch returns a
   sentence: this function must never throw and never print a blank.
   =================================================================== */
function loggedSets(e){ return ((e&&e.sets)||[]).filter(s=>s&&s.r>0); }
/* the weight most of the sets used; a tie goes to the heavier one */
function workWeight(sets){
  const c={}; let best=null;
  sets.forEach(s=>{ const w=+s.w||0; c[w]=(c[w]||0)+1; });
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
  const w=+s.w||0;
  if(it&&it.hold) return (w?w+' kg · ':'')+s.r+' s';
  if(ex.load==='bw') return (w?'+'+w+' kg':'BW')+'×'+s.r;
  return w+'×'+s.r;
}

function verdict(id,it){
  const ex=EX[id]; it=it||ex.typ;
  const rr=repRange(it), tgt=+it.sets||3, hold=!!it.hold, unit=hold?' s':'';
  const NONE=t=>({cls:'none', ic:ICO.dot, txt:t}), UP=t=>({cls:'up', ic:ICO.up, txt:t}), HOLD=t=>({cls:'hold', ic:ICO.hold, txt:t});
  const hist=(S.logs[id]||[]).filter(x=>loggedSets(x).length);
  const ref=hist.length?hist[hist.length-1]:null;
  const info=infoForDate(TODAY), deload=!!(info&&info.deload);

  if(!ref){
    if(deload) return NONE('Deload week: go lighter than you could and stop well short of failure. Log it anyway.');
    if(hold) return NONE('Hold a clean position for '+rr[0]+'–'+rr[1]+' s. Log the seconds and the next session gets a target.');
    if(!rr) return NONE('Do as many clean reps as you can on each set, stopping one short of failure. Log them and the next session gets a target.');
    if(ex.load==='bw') return NONE('Aim for '+rr[0]+(rr[1]>rr[0]?'–'+rr[1]:'')+' clean reps a set. Log them and the next session gets a target.');
    return NONE('Pick a weight you can lift '+rr[0]+(rr[1]>rr[0]?'–'+rr[1]:'')+' times with one or two reps left at the end. Log it and the next session gets a target.');
  }

  const done=loggedSets(ref), today=ref.d===TODAY, lead=today?'Next session: ':'Today: ';
  const w=workWeight(done), noLoad=!w, at=noLoad?(ex.load==='bw'||hold?'bodyweight':'the same weight'):kg(w);
  const left=tgt-done.length;

  if(deload) return NONE(today?'Deload week: nothing to beat today. Keep every rep easy.'
    :'Deload week: about 10% lighter than last time'+(noLoad?'':' ('+kg(roundTo(w*0.9,+ex.step||2.5))+')')+', one set fewer, nothing to beat.');

  // ---- "as many as you can" (pull-ups): the total is the score -----
  if(!rr){
    const total=done.reduce((a,s)=>a+s.r,0);
    if(today&&left>0) return NONE(left+' more '+(left===1?'set':'sets')+'. Stop one rep short of failure on each.');
    if(done.length>=tgt&&done.every(s=>s.r>=12))
      return UP(lead+'12 or more on every set — add '+kg(+ex.step||2.5)+' (a dumbbell between your feet or a belt) and build back up.');
    return UP(lead+'beat '+total+' total reps ('+done.map(s=>s.r).join(', ')+') by at least one.');
  }

  // ---- a session still in progress ---------------------------------
  if(today&&left>0){
    const weak=done.findIndex(s=>s.r<rr[0]);
    if(weak>=0) return HOLD('Set '+(weak+1)+' fell to '+done[weak].r+unit+', under '+rr[0]+'. Rest a little longer, or take some weight off for the '+(left===1?'last set':'sets left')+'.');
    if(done.every(s=>s.r>=rr[1]))
      return UP('Top of the range so far. '+left+' more '+(left===1?'set':'sets')+' — reach '+rr[1]+unit+' on '+(left===1?'it':'each')+' and it gets harder next session.');
    return NONE(left+' more '+(left===1?'set':'sets')+'. Aim for at least '+rr[0]+unit+' on '+(left===1?'it':'each')+'.');
  }
  if(!today&&left>0)
    return HOLD(lead+'last time you logged '+done.length+' of '+tgt+' sets. Same '+at+', all '+tgt+' sets.');

  // ---- a finished session ------------------------------------------
  const mixed=done.some(s=>(+s.w||0)!==w)?' (Based on your '+at+' sets.)':'';
  const atW=done.filter(s=>(+s.w||0)===w);
  if(atW.length>=tgt&&atW.every(s=>s.r>=rr[1])){
    const hit=rr[1]>rr[0]?'you reached '+rr[1]+unit+' on every set':'you got every set of '+rr[1]+unit;
    const again=rr[1]>rr[0]?' and start again at '+rr[0]+unit:'';
    if(hold) return UP(lead+hit+'. Make it harder: add a 5 kg plate on your back, or a harder version, and build back up from '+rr[0]+' s.');
    if(noLoad) return UP(lead+hit+', so add '+kg(+ex.step||2.5)+' (hold a dumbbell or use a belt)'+again+'.');
    return UP(lead+hit+', so go to '+nextLoad(ex,w)+again+'.'+mixed);
  }
  const weak=done.findIndex(s=>s.r<rr[0]);
  if(weak===0&&!noLoad&&!hold)
    return HOLD(lead+'set 1 only reached '+done[0].r+', under '+rr[0]+'. That is too heavy for this range: drop to about '+kg(roundTo(w*0.9,+ex.step||2.5))+'.'+mixed);
  if(weak>=0)
    return HOLD(lead+'set '+(weak+1)+' fell to '+done[weak].r+unit+'. Stay at '+at+' until every set reaches '+rr[0]+unit+'.'+mixed);
  // three sessions at one weight with no extra reps: stop grinding
  if(!today&&hist.length>=3){
    const last3=hist.slice(-3), tot=e=>loggedSets(e).reduce((a,s)=>a+s.r,0);
    if(last3.every(e=>workWeight(loggedSets(e))===w)&&tot(last3[2])<=tot(last3[1])&&tot(last3[1])<=tot(last3[0])&&!noLoad&&!hold)
      return HOLD(lead+'three sessions at '+at+' without an extra rep. Take 10% off ('+kg(roundTo(w*0.9,+ex.step||2.5))+'), build back up, and check your sleep and protein.');
  }
  const next=done.findIndex(s=>s.r<rr[1]);
  if(next<0) return UP(lead+'same '+at+', and make every set as clean as the best one.'+mixed);
  return UP(lead+'same '+at+' — '+(hold?'5 more seconds':'one more rep')+' on set '+(next+1)+' ('+done[next].r+unit+' → '+(done[next].r+(hold?5:1))+unit+').'+mixed);
}
/* The hint is advice; the logbook is the tool. If the advice cannot be worked
   out, the logbook must still draw and the rest must still start. */
function safeVerdict(id,it){
  try{ return verdict(id,it); }
  catch(err){ return {cls:'none', ic:ICO.dot, txt:'Log this session and the next one gets a target.'}; }
}
