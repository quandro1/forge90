/* ===================================================================
   THE LOGBOOK
   S.logs[exerciseId] = [{d:'YYYY-MM-DD', sets:[{w,r,done}]}], oldest first.
   A logbook is drawn inside an exercise card; the card's slot ("2.3" =
   session 2, item 3) says how the lift is prescribed there.
   =================================================================== */
/* the last set row cleared by hand, so a slip of the thumb can be put back: {id, i, set, popped, d} */
let UNDO=null;
/* how this lift is prescribed in that slot (or its usual prescription when it is not in a plan) */
function itemFor(id,ref){
  const sl=ref?slotAt(ref):null;
  return (sl&&sl.it.ex===id)?sl.it:Object.assign({ex:id},EX[id].typ);
}
function setsWanted(it){ return +(it&&it.sets)||3; }
function blankSet(s){ return !s || (s.w==null && s.r==null && !s.done); }
/* a row copied from last time and not yet ticked or changed: a plan, not a set done */
function planned(s){ return !!(s&&s.pre&&!s.done); }
function todayEntry(id){ return (S.logs[id]||[]).find(x=>x.d===TODAY)||null; }
function upsert(id,it){
  const arr=S.logs[id]||(S.logs[id]=[]);
  let e=arr.find(x=>x.d===TODAY);
  if(!e){ e={d:TODAY,sets:[]}; if(isDeload()) e.dl=1; arr.push(e); arr.sort((a,b)=>a.d<b.d?-1:1); }
  // the rows the plan prescribes always exist in state, so "+ Set" adds a
  // real row instead of silently filling an invisible gap
  while(e.sets.length<setsWanted(it)) e.sets.push({});
  return e;
}
/* One definition of "last time", used by the header AND the button, so the
   two can never disagree: a session that actually has reps in it. */
function prevSession(id){
  const past=(S.logs[id]||[]).filter(x=>x.d<TODAY&&loggedSets(x).length>0);
  const normal=past.filter(x=>!x.dl);            // a deload session is not what you repeat or beat
  return (normal.length?normal:past).pop()||null;
}
function logger(id,ref){
  const ex=EX[id], it=itemFor(id,ref), hold=!!it.hold, noW=ex.load==='time';
  const draft=todayEntry(id), cur=draft?draft.sets:[];
  const nSets=Math.max(setsWanted(it), cur.length);
  let rows='', lastW=null;
  for(let i=0;i<nSets;i++){
    const s=cur[i]||{};
    const pw=(lastW!=null&&s.r==null)?lastW:(ex.load==='bw'?'+kg':'kg');   // the weight this row will take; a row with reps and no weight was left empty on purpose
    if(s.w!=null) lastW=s.w;
    rows+='<div class="setrow'+(s.done?' done':'')+(planned(s)?' pre':'')+'"><span class="sn">'+(i+1)+'</span>'
      +(noW?'<span class="nw" aria-hidden="true">—</span>'
           :'<input class="num" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="next" placeholder="'+pw+'" data-set="'+i+'" data-f="w" value="'+(s.w!=null?s.w:'')+'" aria-label="Set '+(i+1)+' weight in kg">')
      +'<input class="num" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="next" placeholder="'+(hold?'sec':'reps')+'" data-set="'+i+'" data-f="r" value="'+(s.r!=null?s.r:'')+'" aria-label="Set '+(i+1)+(hold?' seconds':' reps')+'">'
      +'<button class="ok" data-ok="'+i+'" aria-label="Set '+(i+1)+' done, start rest">✓</button>'
      +'<button class="del" data-del="'+i+'" aria-label="Clear set '+(i+1)+'">×</button></div>';
  }
  const prev=prevSession(id), vd=safeVerdict(id,it), dlNow=draft?!!draft.dl:isDeload(), anyPre=cur.some(planned);
  return '<div class="logger" data-log="'+id+'" data-ref="'+esc(ref||'')+'">'
    +'<div class="lh"><b>Logbook</b>'+((draft?draft.dl:isDeload())?'<button class="dlchip on" data-dl aria-pressed="true" title="A lighter session that is not used as your reference. Tap if you trained normally.">Deload</button>':(isDeload()?'<button class="dlchip" data-dl aria-pressed="false" title="Mark this as a deload session">Deload</button>':''))+'<span class="last">'+(prev?'last '+fmtDate(prev.d)+': '+loggedSets(prev).map(s=>esc(setText(ex,it,s))).join('  '):'no history yet')+'</span></div>'
    +'<div class="sets">'+rows+'</div>'
    +(anyPre?'<p class="prenote">Filled in from last time. Tick each set when it is done, or type what you did. Rows left like this are not counted.</p>':'')
    +(UNDO&&UNDO.id===id&&UNDO.d===TODAY?'<div class="undobar"><span>Set '+(UNDO.i+1)+' cleared.</span><button class="btn sm" data-undo>Undo</button></div>':'')
    +restPanel(id,ref)
    +'<div class="lf"><button class="btn sm" data-addset>+ Set</button>'
    +(prev&&!dlNow?'<button class="btn sm" data-repeat>Same as last time</button>':'')
    +'<button class="btn sm primary" data-savelog>Done with this lift</button></div>'
    +'<div class="verdict '+vd.cls+'"><span class="ic">'+vd.ic+'</span><span>'+esc(vd.txt)+'</span></div>'
    +'</div>';
}
/* The day's session is done when most of its exercises have a logged or ticked set:
   nothing to press. A tick made by hand on Today is left alone. */
function sessionProgress(){
  const info=infoForDate(TODAY);
  if(!info||info.type!=='lift'||!info.session) return null;
  let touched=0;
  info.session.items.forEach(it=>{ const e=todayEntry(it.ex); if(e&&e.sets.some(s=>s&&((s.r>0&&!s.pre)||s.done))) touched++; });
  return {touched:touched, total:info.session.items.length, need:Math.ceil(info.session.items.length*0.6)};
}
function syncSession(){
  const p=sessionProgress(); if(!p) return;
  const arr=S.checks[TODAY]||[], has=arr.indexOf('session')>=0, enough=p.touched>=p.need;
  if(enough&&!has){ (S.checks[TODAY]||(S.checks[TODAY]=[])).push('session'); S.ui.autoSess=TODAY; }
  else if(!enough&&has&&S.ui.autoSess===TODAY){
    arr.splice(arr.indexOf('session'),1); if(!arr.length) delete S.checks[TODAY];
    delete S.ui.autoSess;
  }
}
/* the advice line follows what is typed, without redrawing the fields being typed in */
function paintVerdict(id){
  $$('.logger[data-log="'+id+'"]').forEach(b=>{
    const el=$('.verdict',b); if(!el) return;
    const vd=safeVerdict(id,itemFor(id,b.dataset.ref));
    el.className='verdict '+vd.cls;
    el.innerHTML='<span class="ic">'+vd.ic+'</span><span>'+esc(vd.txt)+'</span>';
  });
}
/* The same exercise can sit on two days of a plan, so two logbooks for it can
   be open at once. Redraw every copy (each with its own slot's prescription)
   or the other one sits there showing stale numbers. */
function refreshLogger(id){
  const a=document.activeElement;
  const box=(a&&a.closest)?a.closest('.logger[data-log="'+id+'"]'):null;
  const keep=(box&&a.dataset&&a.dataset.set!=null)?{ref:box.dataset.ref, set:a.dataset.set, f:a.dataset.f}:null;
  $$('.logger[data-log="'+id+'"]').forEach(b=>{
    if(!b.parentNode) return;
    const tmp=document.createElement('div');
    tmp.innerHTML=logger(id,b.dataset.ref);
    b.parentNode.replaceChild(tmp.firstChild,b);
  });
  if(keep){
    const el=$$('.logger[data-log="'+id+'"]').filter(b=>b.dataset.ref===keep.ref)
      .map(b=>$('input[data-set="'+keep.set+'"][data-f="'+keep.f+'"]',b))[0];
    if(el) try{ el.focus({preventScroll:true}); }catch(e){ el.focus(); }
  }
}
