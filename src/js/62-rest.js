/* ===================================================================
   REST TIMER
   One timer at a time, keyed to an exercise. Tapping ✓ on a set row
   marks it done and starts the rest that slot prescribes. Wall-clock
   based (an end timestamp), so a throttled background tab still lands
   on time; kept in S.ui.rest so a reload mid-rest picks it back up.
   =================================================================== */
function fmtT(ms){ const s=Math.max(0,Math.ceil(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function restSecsFor(id,ref){ return +itemFor(id,ref).rest||90; }
let RT=null, rtTick=null, rtGoTimer=null;
function refOf(panel){ const lg=panel&&panel.closest?panel.closest('.logger'):null; return lg?lg.dataset.ref:''; }
function restPanel(id,ref){
  const secs=restSecsFor(id,ref), mine=RT&&RT.id===id;
  if(!mine) return '<div class="rest" data-rest="'+id+'"><div class="rt-idle">'
    +'<span class="hint">Tap <b>✓</b> when a set is done — the '+esc(restText(secs))+' rest starts by itself.</span>'
    +'<button class="btn sm" data-rest-start>▶ Rest '+fmtT(secs*1000)+'</button></div></div>';
  return '<div class="rest'+(RT.done?' go':'')+'" data-rest="'+id+'">'
    +'<div class="rt-top"><span class="rt-l">'+esc(restLabel())+'</span><span class="rt-t">'+fmtT(RT.end-Date.now())+'</span></div>'
    +'<div class="rt-bar"><i style="width:'+restPct()+'%"></i></div>'
    +'<div class="rt-ctl">'+(RT.done?'':'<button class="btn sm" data-rest-adj="-15">−15 s</button><button class="btn sm" data-rest-adj="15">+15 s</button>')
    +'<button class="btn sm skip" data-rest-stop>'+(RT.done?'Dismiss':'Skip')+'</button></div></div>';
}
function restLabel(){
  const n=RT.set+1, tgt=setsWanted(itemFor(RT.id,RT.ref));
  if(RT.done) return n>=tgt?'Go — rest done. All '+tgt+' sets in, save the session':'Go — set '+(n+1);
  return n>=tgt?'Rest · last set done · next exercise':'Rest · set '+n+' done · next: set '+(n+1);
}
function restPct(){ return Math.max(0,Math.min(100,(RT.end-Date.now())/RT.total*100)); }
function keepRest(){ S.ui.rest={id:RT.id,set:RT.set,end:RT.end,total:RT.total,slot:RT.ref}; save(); }
function idleRest(id){ $$('.rest[data-rest="'+id+'"]').forEach(o=>{ o.outerHTML=restPanel(id,refOf(o)); }); }
function startRest(id,setIdx,ref,secs){
  audioUnlock();
  clearTimeout(rtGoTimer);
  if(RT&&RT.id!==id){ const oid=RT.id; RT=null; idleRest(oid); }      // one timer at a time
  const total=(secs||restSecsFor(id,ref))*1000;
  RT={id, ref:ref||'', set:setIdx==null?-1:setIdx, end:Date.now()+total, total, done:false, warned:false};
  keepRest();
  clearInterval(rtTick); rtTick=setInterval(tickRest,250);
  wakeLock(true); paintRest(true); tickRest();
}
function adjustRest(d){
  if(!RT||RT.done) return;
  RT.end=Math.max(Date.now()+400, RT.end+d*1000); RT.total=Math.max(1000,RT.total+d*1000);
  keepRest(); tickRest();
}
function stopRest(){
  clearInterval(rtTick); clearTimeout(rtGoTimer); rtTick=null;
  const id=RT&&RT.id; RT=null; delete S.ui.rest; save();
  wakeLock(false); document.title='FORGE 90';
  if(id) idleRest(id);
  $('#restPill').className='';
}
function tickRest(){
  if(!RT) return;
  const left=RT.end-Date.now();
  if(!RT.done&&!RT.warned&&left<=10000&&left>0){ RT.warned=true; beep(1); buzz([120]); }
  if(!RT.done&&left<=0){
    RT.done=true; clearInterval(rtTick); rtTick=null; wakeLock(false);
    beep(3); buzz([220,110,220,110,480]); document.title='GO · FORGE 90';
    delete S.ui.rest; save();
    paintRest(true);
    rtGoTimer=setTimeout(()=>{ if(RT&&RT.done) stopRest(); },90000);   // a forgotten GO state clears itself
    return;
  }
  paintRest(false);
}
function paintRest(full){
  if(!RT) return;
  const id=RT.id, left=RT.end-Date.now(), t=fmtT(left);
  $$('.rest[data-rest="'+id+'"]').forEach(el=>{
    if(full||!$('.rt-t',el)){ el.outerHTML=restPanel(id,refOf(el)); }
    else{
      const tt=$('.rt-t',el);
      if(tt.textContent!==t) tt.textContent=t;
      $('.rt-bar i',el).style.width=restPct()+'%';
      el.classList.toggle('warn', !RT.done&&left<=10000);
    }
  });
  // floating pill: only when no panel for this timer is on screen
  const pill=$('#restPill'); let vis=false;
  if(currentTab==='train'){
    $$('.rest[data-rest="'+id+'"]').forEach(p=>{ const r=p.getBoundingClientRect(); if(r.height>0&&r.bottom>0&&r.top<innerHeight-70) vis=true; });
  }
  const cls=vis?'':'on'+(RT.done?' go':'');
  if(pill.className!==cls) pill.className=cls;
  const pn=$('.rp-n',pill), pt=$('.rp-t',pill), name=EX[id].name, tt=RT.done?'GO':t;
  if(pn.textContent!==name) pn.textContent=name;
  if(pt.textContent!==tt) pt.textContent=tt;
}
/* sound + vibration + screen — every one optional, every one wrapped */
let AC=null;
function audioUnlock(){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume(); }catch(e){} }
function beep(n){
  if(!AC) return;
  try{
    const t0=AC.currentTime;
    for(let i=0;i<n;i++){
      const o=AC.createOscillator(), g=AC.createGain(), t=t0+i*0.19;
      o.type='sine'; o.frequency.value=(n>1&&i===n-1)?1318:880;
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.45,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+0.15);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+0.16);
    }
  }catch(e){}
}
function buzz(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }
/* The screen stays awake while a rest counts down. Requests are serialised:
   two callers asking at once used to leave a lock that nothing ever released. */
let WL=null, wlWant=false, wlBusy=false;
async function wakeLock(on){
  wlWant=!!on;
  if(wlBusy) return;
  wlBusy=true;
  try{
    for(let guard=0; guard<4; guard++){
      if(wlWant&&!WL&&navigator.wakeLock&&document.visibilityState==='visible'){
        const l=await navigator.wakeLock.request('screen');
        l.addEventListener('release',()=>{ if(WL===l) WL=null; });
        WL=l;
      }else if(!wlWant&&WL){
        const l=WL; WL=null; await l.release();
      }else break;
    }
  }catch(e){ WL=null; }
  wlBusy=false;
}
function scrollToRest(){
  if(!RT) return;
  const id=RT.id, ref=RT.ref;
  const go=()=>{
    let card=ref?$('.ex[data-ex="'+id+'"][data-slot="'+ref+'"]'):null;
    if(!card) card=$('.ex[data-ex="'+id+'"]');
    if(!card) return;
    const blk=card.closest('details'); if(blk) blk.open=true;
    if(!card.classList.contains('open')) $('.ex-h',card).click();
    const p=$('.rest[data-rest="'+id+'"]',card);
    if(p) p.scrollIntoView({behavior:'smooth',block:'center'});
  };
  if(currentTab!=='train'){ setTab('train'); setTimeout(go,80); } else go();
}
