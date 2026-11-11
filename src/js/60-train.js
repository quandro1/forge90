function renderTrain(force){
  $$('#splitSeg button').forEach(b=>b.classList.toggle('on', b.dataset.split===S.profile.split));
  const p=prog(), list=$('#dayList');
  // Conditioning is logged from Today, so it is always refreshed; the day
  // blocks (open cards, half-typed sets, a running rest timer) are built
  // once per split and left alone across tab switches.
  renderCondSection();
  if(!force&&list.dataset.split===S.profile.split) return;
  list.innerHTML=p.list.map((d,i)=>dayBlock(d,i)).join('');
  list.dataset.split=S.profile.split;
  const info=infoForDate(TODAY);
  if(info&&info.idx>=0){ const blk=$('[data-dayblock="'+info.idx+'"]'); if(blk) blk.open=true; }
  $('#warmCard').innerHTML=
    '<details><summary><span class="idx">00</span>Warm-up, mobility &amp; cool-down<span class="chev">'+ICO.chev+'</span></summary>'
    +'<div class="dbody"><p style="font-size:13.5px;color:var(--text-dim)">Six to eight minutes. It is the cheapest injury insurance you will ever buy, and your top sets are measurably better for it.</p>'
    +'<div class="grid2" style="margin-top:12px">'
    +'<div class="note"><b>Before</b><br>5 min easy bike or incline walk, then the drills inside each session, then two ramp-up sets at 50% and 75% of your first working weight.</div>'
    +'<div class="note"><b>After</b><br>3 min easy walk, 20–30 s static stretches on what you trained, then four slow diaphragmatic breaths to switch into recovery.</div>'
    +'</div></div></details>';
}
function dayBlock(d,i){
  const warm=WARMSETS[d.warm];
  let h='<details data-dayblock="'+i+'"><summary><span class="idx">'+String(i+1).padStart(2,'0')+'</span>'
    +'<span style="flex:1;min-width:0"><span style="display:block">'+esc(d.name)+'</span>'
    +'<span style="display:block;font-family:var(--font-m);font-size:10.5px;letter-spacing:.08em;color:var(--text-faint);text-transform:uppercase">'+esc(d.tag)+'</span></span>'
    +'<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">';
  h+='<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:12px">'+esc(d.focus)+'</p>';
  if(warm){
    h+='<div class="warm"><div class="eyebrow" style="margin-bottom:6px">Warm-up first</div>'
      +'<p style="font-size:13px;color:var(--text-dim)">'+warm.lines.map(esc).join(' · ')+'</p>'
      +'<div class="drills">'+warm.drills.map(k=>{
          if(!WARM[k]) return '';
          return '<div class="drill"><span class="dn">'+esc(WARM[k].name)+'</span>'
            +'<span class="dr">'+esc(WARM[k].reps)+'</span>'
            +'<a class="lk v tiny" target="_blank" rel="noopener" aria-label="Video for '+esc(WARM[k].name)+'" '
            +'href="https://www.youtube.com/results?search_query='+encodeURIComponent(WARM[k].name)+'+proper+form+technique">▶</a></div>';
        }).filter(Boolean).join('')+'</div></div>';
  }
  h+=d.ex.map(id=>exCard2(id)).join('');
  h+='</div></details>';
  return h;
}
function exCard2(id){
  const e=EX[id]; if(!e) return '';
  let h='<div class="ex" data-ex="'+id+'"><button class="ex-h" aria-expanded="false">'
    +'<span class="ex-n"><span class="t">'+esc(e.name)+'</span>'
    +'<span class="s">'+esc(e.sets)+' × '+esc(e.reps)+' &nbsp;·&nbsp; '+esc(e.rest)+' rest &nbsp;·&nbsp; '+esc(e.tag)+'</span></span>'
    +'<span class="chev">'+ICO.chev+'</span></button><div class="ex-b"></div></div>';
  return h;
}
function fillEx(box,id){
  // Muscle map only — no stick-figure poses. Form is what the photo and video
  // buttons are for; a real demo beats a schematic every time.
  const e=EX[id]; let h='';
  const act=(e.f||[]).concat(e.b||[]);
  const front=(e.f||[]).concat(e.b||[]).filter(k=>FRONT_ZONES[k]).length;
  const back=(e.f||[]).concat(e.b||[]).filter(k=>BACK_ZONES[k]).length;
  h+='<div class="maps">';
  if(front) h+=muscleMap('front',act);
  if(back)  h+=muscleMap('back',act);
  h+='</div>';
  // `tag` is the authored emphasis; f/b are only which view a zone lives on
  const seen={}, tagl=String(e.tag).toLowerCase();
  h+='<div class="mtags"><span class="pill hot">'+esc(e.tag)+'</span>'
     +act.filter(k=>{
         const lbl=(ZN[k]||k).toLowerCase();
         if(seen[k]||lbl===tagl) return false;   // don't repeat the emphasis pill
         seen[k]=1; return true;
       }).map(k=>'<span class="pill">'+esc(ZN[k]||k)+'</span>').join('')+'</div>';
  h+=demoLinks(e.name);
  h+='<p class="cue">'+e.cue+'</p>';
  // where the body goes before rep one: bench/seat, grip, angles, range, tempo
  const su=(typeof SETUP!=='undefined'&&SETUP[id])||null;
  if(su){
    h+='<div class="setup"><div class="eyebrow">Set-up &amp; positioning</div><dl class="pos">'
      +[['Position',su.pos],['Grip',su.grip],['Angles',su.ang],['Range',su.rom+(su.like?' <em class="sim">Like '+su.like+'.</em>':'')],['Tempo',su.tempo]]
        .filter(r=>r[1]).map(r=>'<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>').join('')
      +'</dl></div>';
  }
  // the good/bad figures are gone, but their written warning is worth keeping
  const avoid=AVOID[id]||(e.mistake&&e.mistake.bt)||'';
  if(avoid) h+='<div class="avoid"><span class="ic" aria-hidden="true">⚠</span><span><b>Avoid:</b> '+avoid+'</span></div>';
  // MACH_SETUP entries are [step, text] pairs — render as a list, not a joined string
  const setup=(typeof MACH_SETUP!=='undefined'&&MACH_SETUP[e.machine])||null;
  if(setup&&setup.length){
    h+='<div class="setup"><div class="eyebrow" style="margin-bottom:6px">Machine setup</div><ol class="steps">'
      +setup.slice().sort((a,b)=>(+a[0])-(+b[0])).map(s=>'<li>'+s[1]+'</li>').join('')
      +'</ol></div>';
  }
  h+=logger(id);
  box.innerHTML=h;
}

/* ---- demo links --------------------------------------------------
   Search URLs, not fixed video ids — they can never rot, and they always
   return several angles so you can see which movement is which. */
function demoLinks(name,compact){
  const q=encodeURIComponent(name);
  return '<div class="links'+(compact?' compact':'')+'">'
    +'<a class="lk v" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query='+q+'+proper+form+technique">'
    +'<span aria-hidden="true">▶</span> Video</a>'
    +'<a class="lk i" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&amp;q='+q+'+exercise+form">'
    +'<span aria-hidden="true">🖼</span> Photos</a></div>';
}

/* ---- the logbook ------------------------------------------------- */
const LOWER=['squat','rdl','legpress','bulgarian','lunge','legcurl','legext','calf'];
function repRange(s){ const m=String(s).match(/(\d+)\s*[–-]\s*(\d+)/); return m?[+m[1],+m[2]]:null; }
function lastLog(id){ const a=S.logs[id]||[]; return a.length?a[a.length-1]:null; }
function logger(id){
  const e=EX[id], draft=(S.logs[id]||[]).find(x=>x.d===TODAY);
  const cur=draft?draft.sets:[];
  const nSets=Math.max(+e.sets||3, cur.length);
  let rows='', lastW=null;
  for(let i=0;i<nSets;i++){
    const s=cur[i]||{};
    const pw=lastW!=null?lastW:'kg';          // carry the last weight you entered as the hint
    if(s.w!=null) lastW=s.w;
    rows+='<div class="setrow'+(s.done?' done':'')+'"><span class="sn">'+(i+1)+'</span>'
      +'<input class="num" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="next" placeholder="'+pw+'" data-set="'+i+'" data-f="w" value="'+(s.w!=null?s.w:'')+'" aria-label="Set '+(i+1)+' weight">'
      +'<input class="num" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="next" placeholder="reps" data-set="'+i+'" data-f="r" value="'+(s.r!=null?s.r:'')+'" aria-label="Set '+(i+1)+' reps">'
      +'<button class="ok" data-ok="'+i+'" aria-label="Set '+(i+1)+' done, start rest">✓</button>'
      +'<button class="del" data-del="'+i+'" aria-label="Clear set '+(i+1)+'">×</button></div>';
  }
  const prev=prevSession(id), vd=safeVerdict(id);
  return '<div class="logger" data-log="'+id+'">'
    +'<div class="lh"><b>Logbook</b><span class="last">'+(prev?'last '+fmtDate(prev.d)+': '+prev.sets.filter(s=>s.r).map(s=>(s.w||0)+'×'+s.r).join('  '):'no history yet')+'</span></div>'
    +'<div class="sets">'+rows+'</div>'
    +restPanel(id)
    +'<div class="lf"><button class="btn sm" data-addset>+ Set</button>'
    +(prev?'<button class="btn sm" data-repeat>Same as last time</button>':'')
    +'<button class="btn sm primary" data-savelog>Save session</button></div>'
    +'<div class="verdict '+vd.cls+'"><span class="ic">'+vd.ic+'</span><span>'+vd.txt+'</span></div>'
    +'</div>';
}
/* ---- rest timer -------------------------------------------------
   One timer at a time, keyed to an exercise. Tapping ✓ on a set row
   marks it done and starts the rest that exercise prescribes. Wall-clock
   based (end timestamp), so a throttled background tab still lands on
   time; persisted in S.ui.rest so a reload mid-rest picks it back up. */
function restSecs(e){
  const s=String(e.rest||'90s').toLowerCase();
  const m=s.match(/(\d+)\s*[–-]\s*(\d+)\s*min/); if(m) return Math.round((+m[1]+ +m[2])/2*60);
  const mm=s.match(/([\d.]+)\s*min/); if(mm) return Math.round(+mm[1]*60);
  const ss=s.match(/(\d+)\s*s/); if(ss) return +ss[1];
  return 90;
}
function fmtT(ms){ const s=Math.max(0,Math.ceil(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
let RT=null, rtTick=null, rtGoTimer=null;
function restPanel(id){
  const e=EX[id], secs=restSecs(e), mine=RT&&RT.id===id;
  if(!mine) return '<div class="rest" data-rest="'+id+'"><div class="rt-idle">'
    +'<span class="hint">Tap <b>✓</b> when a set is done — the '+fmtT(secs*1000).replace(/^0:/,'')+(secs<60?' s':'')+' rest starts itself.</span>'
    +'<button class="btn sm" data-rest-start>▶ Rest '+fmtT(secs*1000)+'</button></div></div>';
  return '<div class="rest'+(RT.done?' go':'')+'" data-rest="'+id+'">'
    +'<div class="rt-top"><span class="rt-l">'+restLabel()+'</span><span class="rt-t">'+fmtT(RT.end-Date.now())+'</span></div>'
    +'<div class="rt-bar"><i style="width:'+restPct()+'%"></i></div>'
    +'<div class="rt-ctl">'+(RT.done?'':'<button class="btn sm" data-rest-adj="-15">−15 s</button><button class="btn sm" data-rest-adj="15">+15 s</button>')
    +'<button class="btn sm skip" data-rest-stop>'+(RT.done?'Dismiss':'Skip')+'</button></div></div>';
}
function restLabel(){
  const e=EX[RT.id], n=RT.set+1, tgt=+e.sets||3;
  if(RT.done) return n>=tgt?'Go — rest done. All '+tgt+' sets in, save the session':'Go — set '+(n+1);
  return n>=tgt?'Rest · last set done · next exercise':'Rest · set '+n+' done · next: set '+(n+1);
}
function restPct(){ return Math.max(0,Math.min(100,(RT.end-Date.now())/RT.total*100)); }
function startRest(id,setIdx,secs){
  audioUnlock();
  clearTimeout(rtGoTimer);
  if(RT&&RT.id!==id){ const oid=RT.id; RT=null; $$('.rest[data-rest="'+oid+'"]').forEach(o=>{ o.outerHTML=restPanel(oid); }); }   // one timer at a time
  const total=(secs||restSecs(EX[id]))*1000;
  RT={id, set:setIdx==null?-1:setIdx, end:Date.now()+total, total, done:false, warned:false};
  S.ui.rest={id:RT.id,set:RT.set,end:RT.end,total:RT.total}; save();
  clearInterval(rtTick); rtTick=setInterval(tickRest,250);
  wakeLock(true); paintRest(true); tickRest();
}
function adjustRest(d){
  if(!RT||RT.done) return;
  RT.end=Math.max(Date.now()+400, RT.end+d*1000); RT.total=Math.max(1000,RT.total+d*1000);
  S.ui.rest={id:RT.id,set:RT.set,end:RT.end,total:RT.total}; save(); tickRest();
}
function stopRest(){
  clearInterval(rtTick); clearTimeout(rtGoTimer); rtTick=null;
  const id=RT&&RT.id; RT=null; delete S.ui.rest; save();
  wakeLock(false); document.title='FORGE 90';
  $$('.rest[data-rest="'+id+'"]').forEach(p=>{ p.outerHTML=restPanel(id); });
  $('#restPill').className='';
}
function tickRest(){
  if(!RT) return;
  const left=RT.end-Date.now();
  if(!RT.done&&!RT.warned&&left<=10000){ RT.warned=true; beep(1); buzz([120]); }
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
    if(full||!$('.rt-t',el)){ el.outerHTML=restPanel(id); }
    else{
      $('.rt-t',el).textContent=t; $('.rt-bar i',el).style.width=restPct()+'%';
      el.classList.toggle('warn', !RT.done&&left<=10000);
    }
  });
  const p=$('.rest[data-rest="'+id+'"]');
  // floating pill: only when the panel itself is not on screen
  const pill=$('#restPill'); let vis=false;
  if(p&&currentTab==='train'){ const r=p.getBoundingClientRect(); vis=r.bottom>0&&r.top<innerHeight-70; }
  pill.className=vis?'':'on'+(RT.done?' go':'');
  $('.rp-n',pill).textContent=EX[id].name; $('.rp-t',pill).textContent=RT.done?'GO':t;
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
let WL=null;
async function wakeLock(on){
  try{
    if(on&&!WL&&navigator.wakeLock&&document.visibilityState==='visible'){ WL=await navigator.wakeLock.request('screen'); WL.addEventListener('release',()=>{ WL=null; }); }
    else if(!on&&WL){ const w=WL; WL=null; await w.release(); }
  }catch(e){ WL=null; }
}
function scrollToRest(){
  if(!RT) return;
  const id=RT.id;
  const go=()=>{
    let p=$('.rest[data-rest="'+id+'"]');
    if(!p){ // card not opened yet: open the block and card that hold it
      const card=$('.ex[data-ex="'+id+'"]'); if(!card) return;
      const blk=card.closest('details'); if(blk) blk.open=true;
      if(!card.classList.contains('open')) $('.ex-h',card).click();
      p=$('.rest[data-rest="'+id+'"]');
    }
    if(p) p.scrollIntoView({behavior:'smooth',block:'center'});
  };
  if(currentTab!=='train'){ setTab('train'); setTimeout(go,80); } else go();
}

function verdict(id){
  const e=EX[id], rr=repRange(e.reps), tgt=+e.sets||3;
  // judge the most recent session that actually has reps in it — today's if you have logged it
  const withData=(S.logs[id]||[]).filter(x=>x.sets.some(s=>s.r>0));
  const ref=withData.length?withData[withData.length-1]:null;
  if(!ref||!rr) return {cls:'none', ic:ICO.dot, txt:'Log this session and the next one gets a target.'};
  const done=ref.sets.filter(s=>s.r>0);
  const lead=ref.d===TODAY?'Next session: ':'Today: ';
  const jump=LOWER.indexOf(id)>=0?5:2.5;
  const w=done[0].w||0;
  if(done.length>=tgt && done.every(s=>s.r>=rr[1]))
    return {cls:'up', ic:ICO.up, txt:lead+'you hit '+rr[1]+' on every set, so go to '+(w+jump)+' kg and start again at '+rr[0]+' reps.'};
  const weak=done.findIndex(s=>s.r<rr[0]);
  if(weak>=0)
    return {cls:'hold', ic:ICO.hold, txt:lead+'set '+(weak+1)+' fell to '+done[weak].r+'. Stay at '+w+' kg and earn '+rr[0]+' clean on every set before adding anything.'};
  const next=done.findIndex(s=>s.r<rr[1]);
  if(next<0){
    // every set logged so far is at the top of the range, but the session is short of its sets
    const left=tgt-done.length;
    return ref.d===TODAY
      ? {cls:'up', ic:ICO.up, txt:'Top of the range so far. '+left+' more '+(left===1?'set':'sets')+' — hit '+rr[1]+' on '+(left===1?'it':'each')+' and the weight goes up next session.'}
      : {cls:'hold', ic:ICO.hold, txt:lead+'you hit '+rr[1]+' last time but logged '+done.length+' of '+tgt+' sets. Same '+w+' kg, all '+tgt+' sets, then go up.'};
  }
  return {cls:'up', ic:ICO.up, txt:lead+'same '+w+' kg — chase one more rep on set '+(next+1)+' ('+done[next].r+' → '+(done[next].r+1)+').'};
}
/* The hint is advice; the logbook is the tool. If the advice cannot be worked
   out, the logbook must still draw and the rest must still start. */
function safeVerdict(id){
  try{ return verdict(id); }
  catch(err){ return {cls:'none', ic:ICO.dot, txt:'Log this session and the next one gets a target.'}; }
}

/* ===================================================================
   RENDER — MAP
   =================================================================== */
