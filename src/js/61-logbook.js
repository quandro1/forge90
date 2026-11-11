/* ===================================================================
   THE LOGBOOK
   S.logs[exerciseId] = [{d:'YYYY-MM-DD', sets:[{w,r,done}]}], oldest first.
   A logbook is drawn inside an exercise card; the card's slot ("2.3" =
   session 2, item 3) says how the lift is prescribed there.
   =================================================================== */
/* how this lift is prescribed in that slot (or its usual prescription when it is not in a plan) */
function itemFor(id,ref){
  const sl=ref?slotAt(ref):null;
  return (sl&&sl.it.ex===id)?sl.it:Object.assign({ex:id},EX[id].typ);
}
function setsWanted(it){ return +(it&&it.sets)||3; }
function blankSet(s){ return !s || (s.w==null && s.r==null && !s.done); }
function todayEntry(id){ return (S.logs[id]||[]).find(x=>x.d===TODAY)||null; }
function upsert(id,it){
  const arr=S.logs[id]||(S.logs[id]=[]);
  let e=arr.find(x=>x.d===TODAY);
  if(!e){ e={d:TODAY,sets:[]}; arr.push(e); arr.sort((a,b)=>a.d<b.d?-1:1); }
  // the rows the plan prescribes always exist in state, so "+ Set" adds a
  // real row instead of silently filling an invisible gap
  while(e.sets.length<setsWanted(it)) e.sets.push({});
  return e;
}
/* One definition of "last time", used by the header AND the button, so the
   two can never disagree: a session that actually has reps in it. */
function prevSession(id){
  return (S.logs[id]||[]).filter(x=>x.d!==TODAY&&loggedSets(x).length>0).pop()||null;
}
function logger(id,ref){
  const ex=EX[id], it=itemFor(id,ref), hold=!!it.hold, noW=ex.load==='time';
  const draft=todayEntry(id), cur=draft?draft.sets:[];
  const nSets=Math.max(setsWanted(it), cur.length);
  let rows='', lastW=null;
  for(let i=0;i<nSets;i++){
    const s=cur[i]||{};
    const pw=lastW!=null?lastW:(ex.load==='bw'?'+kg':'kg');          // carry the last weight you entered as the hint
    if(s.w!=null) lastW=s.w;
    rows+='<div class="setrow'+(s.done?' done':'')+'"><span class="sn">'+(i+1)+'</span>'
      +(noW?'<span class="nw" aria-hidden="true">—</span>'
           :'<input class="num" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="next" placeholder="'+pw+'" data-set="'+i+'" data-f="w" value="'+(s.w!=null?s.w:'')+'" aria-label="Set '+(i+1)+' weight in kg">')
      +'<input class="num" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="next" placeholder="'+(hold?'sec':'reps')+'" data-set="'+i+'" data-f="r" value="'+(s.r!=null?s.r:'')+'" aria-label="Set '+(i+1)+(hold?' seconds':' reps')+'">'
      +'<button class="ok" data-ok="'+i+'" aria-label="Set '+(i+1)+' done, start rest">✓</button>'
      +'<button class="del" data-del="'+i+'" aria-label="Clear set '+(i+1)+'">×</button></div>';
  }
  const prev=prevSession(id), vd=safeVerdict(id,it);
  return '<div class="logger" data-log="'+id+'" data-ref="'+esc(ref||'')+'">'
    +'<div class="lh"><b>Logbook</b><span class="last">'+(prev?'last '+fmtDate(prev.d)+': '+loggedSets(prev).map(s=>esc(setText(ex,it,s))).join('  '):'no history yet')+'</span></div>'
    +'<div class="sets">'+rows+'</div>'
    +restPanel(id,ref)
    +'<div class="lf"><button class="btn sm" data-addset>+ Set</button>'
    +(prev?'<button class="btn sm" data-repeat>Same as last time</button>':'')
    +'<button class="btn sm primary" data-savelog>Save session</button></div>'
    +'<div class="verdict '+vd.cls+'"><span class="ic">'+vd.ic+'</span><span>'+esc(vd.txt)+'</span></div>'
    +'</div>';
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
