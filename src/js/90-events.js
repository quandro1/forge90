/* ===================================================================
   EVENTS
   =================================================================== */
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

/* how many days a week: picks that variant of the plan and its default weekdays */
function setDaysPerWeek(n){
  const p=program();
  if(!p.variants[n]||n===+S.profile.dpw) return false;
  setPlan(S.profile.program,n,p.variants[n].days);
  save(); return true;
}

/* --- delegated clicks -------------------------------------------- */
document.addEventListener('click',e=>{
  const T=e.target;

  const chk=T.closest('[data-chk]');
  if(chk){
    const k=chk.dataset.chk, arr=S.checks[TODAY]||(S.checks[TODAY]=[]);
    const at=arr.indexOf(k);
    if(at>=0) arr.splice(at,1); else arr.push(k);
    if(!arr.length) delete S.checks[TODAY];
    if(k==='session') delete S.ui.autoSess;          // ticked or cleared by hand: the log no longer decides it
    save(); renderToday(); return;
  }
  const shop=T.closest('[data-shop]');
  if(shop){
    const k=shop.dataset.shop;
    if(S.shop[k]) delete S.shop[k]; else S.shop[k]=true;
    shop.setAttribute('aria-pressed',String(!!S.shop[k]));
    save(); return;
  }
  if(T.closest('[data-hidehelp]')){ S.ui.helpSeen=1; save(); renderHelp(); return; }
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
    if(open&&!body.dataset.filled){ fillEx(body,id,card.dataset.slot); body.dataset.filled='1'; }
    return;
  }
  const dpw=T.closest('[data-dpw]');
  if(dpw){
    if(setDaysPerWeek(+dpw.dataset.dpw)){
      if(dpw.closest('#sheet')){ $$('#setDpw button').forEach(b=>b.classList.toggle('on',b===dpw)); renderToday(); }
      else renderTrain();
    }
    return;
  }
  if(T.closest('#btnLib')){ libSheet(); return; }
  if(T.closest('[data-pickplan]')){ planSheet(); return; }
  const sw=T.closest('[data-swap]');
  if(sw){
    // put another exercise in this slot (or the plan's own back); the card is redrawn in place and opened
    const card=sw.closest('.ex'), sl=card?slotAt(card.dataset.slot):null;
    if(sl){
      const base=sl.it.base||sl.it.ex, want=sw.dataset.swap, key=slotKey(sl.si,sl.k);
      if(want===base) delete S.swaps[key]; else if(EX[want]) S.swaps[key]=want;
      save();
      const it=slotAt(sl.ref).it, tmp=document.createElement('div');
      tmp.innerHTML=exCard(it,sl.ref);
      const fresh=tmp.firstChild;
      card.parentNode.replaceChild(fresh,card);
      $('#dayList').dataset.plan=planSig();
      $('.ex-h',fresh).click();
      fresh.scrollIntoView({block:'nearest'});
    }
    return;
  }
  const lg=T.closest('#libSeg button');
  if(lg){
    $$('#libSeg button').forEach(b=>b.classList.toggle('on',b===lg));
    libRender(lg.dataset.g, $('#libSearch')?$('#libSearch').value:'');
    return;
  }
  const dseg=T.closest('#dietSeg button');
  if(dseg){ S.ui.diet=dseg.dataset.diet; save(); renderFuel(); return; }

  const fcat=T.closest('[data-fcat]');
  if(fcat){ foodCat=+fcat.dataset.fcat; renderProt(); return; }
  const chip=T.closest('[data-food]');
  if(chip){
    const p=chip.dataset.food.split('|'), f=FOODCATS[+p[0]][1][+p[1]];
    (S.food[TODAY]||(S.food[TODAY]=[])).push({n:f[0],k:f[2],p:f[3],c:f[4],f:f[5]});
    save(); renderProt(); return;
  }
  const unfood=T.closest('[data-unfood]');
  if(unfood){
    const a=S.food[TODAY];
    if(a){ a.splice(+unfood.dataset.unfood,1); if(!a.length) delete S.food[TODAY]; }
    save(); renderProt(); return;
  }

  /* ---- the logbook ---- */
  const box=T.closest('.logger');
  if(box){
    const id=box.dataset.log, ref=box.dataset.ref, it=itemFor(id,ref);
    if(T.closest('[data-repeat]')){
      const prev=prevSession(id);
      if(prev){
        const en=upsert(id,it);
        prev.sets.forEach((s,i)=>{
          if(blankSet(s)) return;
          while(en.sets.length<=i) en.sets.push({});
          if(!blankSet(en.sets[i])) return;            // never touch a row that already holds something
          const o={}; if(s.w!=null) o.w=s.w; if(s.r!=null) o.r=s.r; en.sets[i]=o;
        });
        syncSession(); save(); refreshLogger(id);
      }
      return;
    }
    if(T.closest('[data-dl]')){                 // deload session on/off
      const en=upsert(id,it);
      if(en.dl) delete en.dl; else en.dl=1;
      save(); refreshLogger(id); return;
    }
    if(T.closest('[data-addset]')){
      upsert(id,it).sets.push({});
      save(); refreshLogger(id); return;
    }
    const ok=T.closest('[data-ok]');
    if(ok){
      const i=+ok.dataset.ok, en=upsert(id,it);
      while(en.sets.length<=i) en.sets.push({});
      const s=en.sets[i], prev=i>0?en.sets[i-1]:null;
      if(s.w==null&&prev&&prev.w!=null) s.w=prev.w;          // carry the bar weight forward
      s.done=1;
      if(document.activeElement&&document.activeElement.blur) document.activeElement.blur();   // drop the keyboard
      syncSession(); save();
      // The rest starts first: nothing that happens while redrawing the logbook may stop it.
      startRest(id,i,ref);
      try{ refreshLogger(id); }catch(err){ console.error(err); }
      return;
    }
    if(T.closest('[data-rest-start]')){
      const cur=todayEntry(id), done=cur?cur.sets.filter(s=>s.done).length:0;
      startRest(id, done?done-1:-1, ref); return;
    }
    const del=T.closest('[data-del]');
    if(del){
      const i=+del.dataset.del, en=upsert(id,it);
      // an extra row you added comes off entirely; a prescribed row just empties
      if(i===en.sets.length-1 && en.sets.length>setsWanted(it)) en.sets.pop();
      else if(en.sets[i]) en.sets[i]={};
      syncSession(); save(); refreshLogger(id); return;
    }
    const savelog=T.closest('[data-savelog]');
    if(savelog){
      const en=upsert(id,it);
      // Trim only blank rows off the END. Filtering the whole array renumbered
      // the sets, so skipping set 2 silently turned set 3 into set 2.
      let n=en.sets.length;
      while(n>setsWanted(it) && blankSet(en.sets[n-1])) n--;
      en.sets.length=n;
      if(en.sets.every(blankSet)){ S.logs[id]=S.logs[id].filter(x=>x!==en); if(!S.logs[id].length) delete S.logs[id]; }
      syncSession(); save(); refreshLogger(id);
      const btn=$('.logger[data-log="'+id+'"][data-ref="'+ref+'"] [data-savelog]');
      if(btn){ btn.textContent='Saved'; setTimeout(()=>{ btn.textContent='Save session'; },1400); }
      return;
    }
  }
  const adj=T.closest('[data-rest-adj]');
  if(adj){ adjustRest(+adj.dataset.restAdj); return; }
  if(T.closest('[data-rest-stop]')){ stopRest(); return; }
  if(T.closest('[data-rest-go]')){ scrollToRest(); return; }

  const dm=T.closest('[data-delmeas]');
  if(dm){
    const row=S.meas.slice().sort((a,b)=>a.d<b.d?-1:1)[+dm.dataset.delmeas];
    const at=S.meas.indexOf(row);
    if(at>=0) S.meas.splice(at,1);
    save(); renderMeas(); return;
  }
});

$('#addMeas').addEventListener('click',()=>{
  openSheet('New measurement',
    '<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:14px">Morning, relaxed, before food. Waist at the navel — do not suck in. Same tape, same spots, every time.</p>'
    +'<div class="card">'
    +mrow('Date','m-d','date',TODAY)
    +mrow('Waist (cm)','m-waist','number','')
    +mrow('Chest (cm)','m-chest','number','')
    +mrow('Shoulders (cm)','m-sh','number','')
    +mrow('Arm (cm)','m-arm','number','')
    +mrow('Thigh (cm)','m-thigh','number','')
    +'</div><button class="btn primary wide" id="saveMeas" style="margin-top:14px">Save entry</button>');
  $('#saveMeas').addEventListener('click',()=>{
    const g=k=>$('#f-m-'+k).value;
    if(!isDate(g('d'))) return;
    const row={d:g('d')};
    ['waist','chest','sh','arm','thigh'].forEach(k=>{ const n=numIn(g(k),1,999,null); if(n!=null) row[k]=n; });
    if(Object.keys(row).length<2) return;                    // nothing measured
    S.meas.push(row);
    if(row.waist!=null) S.waist[row.d]=row.waist;
    save(); closeSheet(); renderProg();
  });
});
function mrow(label,key,type,val){
  return '<div class="frow"><label for="f-'+key+'">'+esc(label)+'</label>'
    +'<input class="num" id="f-'+key+'" type="'+type+'" value="'+esc(val)+'"'
    +(type==='number'?' step="0.5" inputmode="decimal"':'')+'></div>';
}

/* --- delegated input --------------------------------------------- */
document.addEventListener('input',e=>{
  const T=e.target;
  if(T.dataset&&T.dataset.set!=null&&T.closest('.logger')){
    const box=T.closest('.logger'), id=box.dataset.log, i=+T.dataset.set, f=T.dataset.f;
    const en=upsert(id,itemFor(id,box.dataset.ref));
    while(en.sets.length<=i) en.sets.push({});
    // keep only digits (and one dot for weight), so junk never reaches state
    let raw=latinNumber(T.value).replace(f==='w'?/[^0-9.]/g:/[^0-9]/g,'');
    if(f==='w') raw=raw.replace(/(\..*)\./g,'$1');
    if(raw.length>7) raw=raw.slice(0,7);
    if(raw!==T.value){
      const at=(T.selectionStart==null?T.value.length:T.selectionStart)-(T.value.length-raw.length);
      T.value=raw; try{ T.setSelectionRange(at,at); }catch(err){}
    }
    if(raw===''){ delete en.sets[i][f]; }
    else{
      const v=parseFloat(raw);          // "7." parses to 7 and the field keeps "7."
      if(isFinite(v)) en.sets[i][f]=v; else return;
    }
    // reps on a row with no weight: the row takes the weight of the row above, in state and on screen
    if(f==='r'&&en.sets[i].r!=null&&en.sets[i].w==null&&EX[id].load!=='time'){
      for(let k=i-1;k>=0;k--){ if(en.sets[k]&&en.sets[k].w!=null){ en.sets[i].w=en.sets[k].w; break; } }
      if(en.sets[i].w!=null) $$('.logger[data-log="'+id+'"] input[data-set="'+i+'"][data-f="w"]').forEach(el=>{ el.value=en.sets[i].w; });
    }
    if(f==='r') syncSession();
    // keep the other open copy of this exercise in step while typing
    $$('.logger[data-log="'+id+'"] input[data-set="'+i+'"][data-f="'+f+'"]')
      .forEach(el=>{ if(el!==T) el.value=T.value; });
    save(); return;
  }
  if(T.id==='qWeight'){ setNum(S.weights,T.value,1,999); return; }
  if(T.id==='qWaist'){ setNum(S.waist,T.value,1,999); return; }
  if(T.id==='qSteps'){ setNum(S.steps,T.value,0,500000); return; }
  const pf=T.closest('[data-prof]');
  if(pf){
    // A profile field changes the plan only once it holds a usable value:
    // a half-typed or impossible number is ignored, never stored.
    const k=pf.dataset.prof, raw=pf.value, next=Object.assign({},S.profile);
    if(k==='start'){ if(!isDate(raw)) return; next.start=raw; }
    else if(k==='sex'||k==='goal'){ next[k]=raw; }
    else if(k==='targetW'){ next.targetW=raw===''?null:+raw; }
    else{ if(raw==='') return; next[k]=+raw; }
    const ok=cleanProfile(next,false);
    if(k!=='start'&&k!=='sex'&&k!=='goal'&&next[k]!=null&&ok[k]!==next[k]) return;      // out of range
    S.profile=ok; save(); renderToday(); return;
  }
});
function setNum(obj,v,lo,hi){
  const n=numIn(v,lo,hi,null);
  if(n==null) delete obj[TODAY]; else obj[TODAY]=n;
  save();
  clearTimeout(setNum.t);
  setNum.t=setTimeout(()=>{ if(currentTab==='today'){ renderTodayReadout(); renderCond(); } },500);
}
function renderTodayReadout(){
  const t=targets(), wl=weightList(), latest=wl.length?wl[wl.length-1][1]:null;
  const startW=wl.length?wl[0][1]:t.w, di=todayIndex(), started=di>=1&&di<=BLOCK_DAYS, info=started?dayInfo(di):null;
  $('#ro-today').innerHTML=[
    ro('Day', started?di:(di>BLOCK_DAYS?BLOCK_DAYS:0), '/ '+BLOCK_DAYS, true),
    ro('Phase', started?info.phase:'—', started?PHASES[info.phase-1].name:''),
    ro('Weight', latest!=null?latest.toFixed(1):'—', latest!=null?(latest-startW>=0?'+':'')+(latest-startW).toFixed(1)+' kg':'log one'),
    ro('Streak', streak(), 'days', true)
  ].join('');
}
