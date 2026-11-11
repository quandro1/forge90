const TABS=['today','train','plan','fuel','prog'];
let currentTab='today';
function setTab(name,skipHash){
  if(TABS.indexOf(name)<0) name='today';
  currentTab=name;
  if(!skipHash&&location.hash.slice(1)!==name){
    try{ history.replaceState(null,'','#'+name); }catch(e){}
  }
  $$('.screen').forEach(s=>s.classList.toggle('on', s.id==='s-'+name));
  $$('.tabbar button').forEach(b=>{
    const on=b.dataset.tab===name;
    b.classList.toggle('on',on);
    if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  window.scrollTo({top:0,behavior:'instant' in window?'instant':'auto'});
  if(name==='train') renderTrain();
  if(name==='plan') renderPlan();
  if(name==='fuel') renderFuel();
  if(name==='prog') renderProg();
  if(name==='today') renderToday();
}
$$('.tabbar button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));

$('#btnGuide').addEventListener('click',guideSheet);
$('#btnSet').addEventListener('click',settingsSheet);
$('#btnTheme').addEventListener('click',()=>{
  const cur=document.documentElement.getAttribute('data-theme');
  const next=cur==='light'?'dark':cur==='dark'?'light'
    :(matchMedia('(prefers-color-scheme: dark)').matches?'light':'dark');
  document.documentElement.setAttribute('data-theme',next);
  S.ui.theme=next; save(); paintThemeColor();
});

/* --- delegated clicks -------------------------------------------- */
document.addEventListener('click',e=>{
  const T=e.target;

  const chk=T.closest('[data-chk]');
  if(chk){
    const k=chk.dataset.chk, arr=S.checks[TODAY]||(S.checks[TODAY]=[]);
    const at=arr.indexOf(k);
    if(at>=0) arr.splice(at,1); else arr.push(k);
    if(!arr.length) delete S.checks[TODAY];
    save(); renderToday(); return;
  }
  const shop=T.closest('[data-shop]');
  if(shop){
    S.shop=S.shop||{};
    const k=shop.dataset.shop;
    S.shop[k]=!S.shop[k];
    shop.setAttribute('aria-pressed',String(!!S.shop[k]));
    save(); return;
  }
  if(T.closest('[data-hidehelp]')){ S.ui.helpSeen=1; save(); renderHelp(); return; }
  const rep=T.closest('[data-repeat]');
  if(rep){
    const box=rep.closest('.logger'), id=box.dataset.log;
    const prev=prevSession(id);
    if(prev){
      const e=upsert(id);
      e.sets=prev.sets.map(s=>({w:s.w,r:s.r}));
      while(e.sets.length<setsWanted(id)) e.sets.push({});
      save(); refreshLogger(box,id);
    }
    return;
  }
  const cond=T.closest('[data-cond]');
  if(cond){ logCond(cond.dataset.cond); renderCond(); return; }
  if(T.closest('[data-uncond]')){
    const a=S.cond&&S.cond[TODAY];
    if(a&&a.length) unlogCond(a[a.length-1]);
    renderCond(); return;
  }
  const goday=T.closest('[data-goday]');
  if(goday){
    const idx=+goday.dataset.goday;
    setTab('train');
    setTimeout(()=>{
      const blk=$('[data-dayblock="'+idx+'"]');
      if(blk){ blk.open=true; blk.scrollIntoView({behavior:'smooth',block:'start'}); }
    },60);
    return;
  }
  const dayBtn=T.closest('[data-day]');
  if(dayBtn){ daySheet(+dayBtn.dataset.day); return; }

  const exh=T.closest('.ex-h');
  if(exh){
    const card=exh.closest('.ex'), id=card.dataset.ex, body=$('.ex-b',card);
    const open=card.classList.toggle('open');
    exh.setAttribute('aria-expanded',String(open));
    if(open&&!body.dataset.filled){ fillEx(body,id); body.dataset.filled='1'; }
    return;
  }
  const seg=T.closest('#splitSeg button');
  if(seg){ S.profile.split=seg.dataset.split; save(); renderTrain(); return; }
  if(T.closest('#btnLib')){ libSheet(); return; }
  const lg=T.closest('#libSeg button');
  if(lg){
    $$('#libSeg button').forEach(b=>b.classList.toggle('on',b===lg));
    libRender(lg.dataset.g, $('#libSearch')?$('#libSearch').value:'');
    return;
  }
  const setSplit=T.closest('#setSplit button');
  if(setSplit){
    S.profile.split=setSplit.dataset.split; save();
    $$('#setSplit button').forEach(b=>b.classList.toggle('on',b===setSplit));
    renderToday(); return;
  }
  const dseg=T.closest('#dietSeg button');
  if(dseg){ S.ui.diet=dseg.dataset.diet; save(); renderFuel(); return; }

  const fcat=T.closest('[data-fcat]');
  if(fcat){ foodCat=+fcat.dataset.fcat; renderProt(); return; }
  const chip=T.closest('[data-food]');
  if(chip){
    const p=chip.dataset.food.split('|'), f=FOODCATS[+p[0]][1][+p[1]];
    S.food=S.food||{};
    (S.food[TODAY]||(S.food[TODAY]=[])).push({n:f[0],k:f[2],p:f[3],c:f[4],f:f[5]});
    save(); renderProt(); return;
  }
  const unfood=T.closest('[data-unfood]');
  if(unfood){
    S.food[TODAY].splice(+unfood.dataset.unfood,1);
    if(!S.food[TODAY].length) delete S.food[TODAY];
    save(); renderProt(); return;
  }

  const addset=T.closest('[data-addset]');
  if(addset){
    const box=addset.closest('.logger'), id=box.dataset.log;
    const entry=upsert(id); entry.sets.push({});
    save(); refreshLogger(box,id); return;
  }
  const ok=T.closest('[data-ok]');
  if(ok){
    const box=ok.closest('.logger'), id=box.dataset.log, i=+ok.dataset.ok;
    const entry=upsert(id);
    while(entry.sets.length<=i) entry.sets.push({});
    const s=entry.sets[i], prev=i>0?entry.sets[i-1]:null;
    if(s.w==null&&prev&&prev.w!=null) s.w=prev.w;          // carry the bar weight forward
    s.done=1;
    if(document.activeElement&&document.activeElement.blur) document.activeElement.blur();   // drop the keyboard
    save(); refreshLogger(box,id);
    startRest(id,i);
    return;
  }
  if(T.closest('[data-rest-start]')){
    const box=T.closest('.logger'), id=box.dataset.log;
    const cur=(S.logs[id]||[]).find(x=>x.d===TODAY), done=cur?cur.sets.filter(s=>s.done).length:0;
    startRest(id, done?done-1:-1); return;
  }
  const adj=T.closest('[data-rest-adj]');
  if(adj){ adjustRest(+adj.dataset.restAdj); return; }
  if(T.closest('[data-rest-stop]')){ stopRest(); return; }
  if(T.closest('[data-rest-go]')){ scrollToRest(); return; }
  const del=T.closest('[data-del]');
  if(del){
    const box=del.closest('.logger'), id=box.dataset.log, i=+del.dataset.del;
    const entry=upsert(id);
    // an extra row you added comes off entirely; a prescribed row just empties
    if(i===entry.sets.length-1 && entry.sets.length>setsWanted(id)) entry.sets.pop();
    else if(entry.sets[i]) entry.sets[i]={};
    save(); refreshLogger(box,id); return;
  }
  const savelog=T.closest('[data-savelog]');
  if(savelog){
    const box=savelog.closest('.logger'), id=box.dataset.log, entry=upsert(id);
    // Trim only blank rows off the END. Filtering the whole array renumbered
    // the sets, so skipping set 2 silently turned set 3 into set 2.
    let n=entry.sets.length;
    while(n>setsWanted(id) && blankSet(entry.sets[n-1])) n--;
    entry.sets.length=n;
    if(entry.sets.every(blankSet)){ S.logs[id]=S.logs[id].filter(x=>x!==entry); if(!S.logs[id].length) delete S.logs[id]; }
    else{
      const arr=S.checks[TODAY]||(S.checks[TODAY]=[]);
      if(arr.indexOf('session')<0) arr.push('session');
    }
    save(); refreshLogger(box,id);
    savelog.textContent='Saved'; setTimeout(()=>{ savelog.textContent='Save session'; },1400);
    return;
  }

  const dm=T.closest('[data-delmeas]');
  if(dm){ S.meas.splice(+dm.dataset.delmeas,1); save(); renderMeas(); return; }
});

$('#addMeas').addEventListener('click',()=>{
  openSheet('New measurement',
    '<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:14px">Morning, relaxed, before food. Waist at the navel — do not suck in. Same tape, same spots, every time.</p>'
    +'<div class="card">'
    +srow('Date','m-d','date',TODAY)
    +srow('Waist (cm)','m-waist','number','')
    +srow('Chest (cm)','m-chest','number','')
    +srow('Shoulders (cm)','m-sh','number','')
    +srow('Arm (cm)','m-arm','number','')
    +srow('Thigh (cm)','m-thigh','number','')
    +'</div><button class="btn primary wide" id="saveMeas" style="margin-top:14px">Save entry</button>');
  $('#saveMeas').addEventListener('click',()=>{
    const g=k=>$('#f-m-'+k).value;
    if(!g('d')) return;
    S.meas.push({d:g('d'), waist:g('waist'), chest:g('chest'), sh:g('sh'), arm:g('arm'), thigh:g('thigh')});
    if(g('waist')) S.waist[g('d')]=g('waist');
    save(); closeSheet(); renderProg();
  });
});

/* --- delegated input --------------------------------------------- */
function setsWanted(id){ return +((EX[id]||{}).sets)||3; }
function blankSet(s){ return !s || (s.w==null && s.r==null && !s.done); }
function upsert(id){
  const arr=S.logs[id]||(S.logs[id]=[]);
  let e=arr.find(x=>x.d===TODAY);
  if(!e){ e={d:TODAY,sets:[]}; arr.push(e); arr.sort((a,b)=>a.d<b.d?-1:1); }
  // the rows the program prescribes always exist in state, so "+ Set" adds a
  // real row instead of silently filling an invisible gap
  while(e.sets.length<setsWanted(id)) e.sets.push({});
  return e;
}
/* One definition of "last time", used by the header AND the button, so the
   two can never disagree: a session that actually has reps in it. */
function prevSession(id){
  return (S.logs[id]||[]).filter(x=>x.d!==TODAY&&(x.sets||[]).some(s=>s&&s.r>0)).pop()||null;
}
/* The same exercise appears on two days of the split (lateral raise on 1 and 4,
   leg curl on 3 and 5), so two logbooks for it can be open at once. Refresh
   every copy or the other one sits there showing stale numbers. */
function refreshLogger(box,id){
  const a=document.activeElement;
  const keep=(a&&a.closest&&a.closest('.logger[data-log="'+id+'"]'))
    ? {set:a.dataset.set, f:a.dataset.f} : null;
  $$('.logger[data-log="'+id+'"]').forEach(b=>{
    const wrap=b.parentNode; if(!wrap) return;
    const tmp=document.createElement('div');
    tmp.innerHTML=logger(id);
    wrap.replaceChild(tmp.firstChild,b);
  });
  if(keep&&keep.set!=null){
    const el=$('.logger[data-log="'+id+'"] input[data-set="'+keep.set+'"][data-f="'+keep.f+'"]');
    if(el) try{ el.focus({preventScroll:true}); }catch(e){ el.focus(); }
  }
}
document.addEventListener('input',e=>{
  const T=e.target;
  const st=T.closest('[data-set]');
  if(st){
    const box=T.closest('.logger'), id=box.dataset.log, i=+T.dataset.set, f=T.dataset.f;
    const entry=upsert(id);
    while(entry.sets.length<=i) entry.sets.push({});
    // keep only digits (and one dot for weight), so junk never reaches state
    let raw=String(T.value).replace(f==='w'?/[^0-9.]/g:/[^0-9]/g,'');
    if(f==='w') raw=raw.replace(/(\..*)\./g,'$1');
    if(raw!==T.value){ const at=T.selectionStart; T.value=raw; try{T.setSelectionRange(at-1,at-1);}catch(err){} }
    if(raw===''){ entry.sets[i][f]=null; }
    else{
      const v=parseFloat(raw);          // "7." parses to 7 and the field keeps "7."
      if(isFinite(v)) entry.sets[i][f]=v; else return;
    }
    // keep the other open copy of this exercise in step while typing
    $$('.logger[data-log="'+id+'"] input[data-set="'+i+'"][data-f="'+f+'"]')
      .forEach(el=>{ if(el!==T) el.value=T.value; });
    save(); return;
  }
  if(T.id==='qWeight'){ setNum(S.weights,T.value); return; }
  if(T.id==='qWaist'){ setNum(S.waist,T.value); return; }
  if(T.id==='qSteps'){ setNum(S.steps,T.value); return; }
  const pf=T.closest('[data-prof]');
  if(pf){
    const k=pf.dataset.prof;
    S.profile[k]=(k==='start')?pf.value:(pf.tagName==='SELECT'?+pf.value:(pf.value===''?DEFAULTS.profile[k]:+pf.value));
    save(); renderToday(); return;
  }
});
function setNum(obj,v){
  if(v==='') delete obj[TODAY]; else obj[TODAY]=+v;
  save();
  clearTimeout(setNum.t);
  setNum.t=setTimeout(()=>{ if(currentTab==='today'){ renderTodayReadout(); renderCond(); } },500);
}
function renderTodayReadout(){
  const t=targets(), wl=weightList(), latest=wl.length?wl[wl.length-1][1]:null;
  const startW=wl.length?wl[0][1]:t.w, di=todayIndex(), started=di>=1&&di<=91, info=started?dayInfo(di):null;
  $('#ro-today').innerHTML=[
    ro('Day', started?di:(di>91?91:0), '/ 91', true),
    ro('Phase', started?info.phase:'—', started?PHASES[info.phase-1].name:''),
    ro('Weight', latest!=null?latest.toFixed(1):'—', latest!=null?(latest-startW>=0?'+':'')+(latest-startW).toFixed(1)+' kg':'log one'),
    ro('Streak', streak(), 'days', true)
  ].join('');
}

/* ===================================================================
   APP SHELL — manifest, service worker, install, offline
   The page works identically as a plain web page, a home-screen app, or
   the double-click file on the laptop; every hook below is feature-detected
   and silently absent when the platform does not offer it.
   =================================================================== */
