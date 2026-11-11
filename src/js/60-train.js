/* ===================================================================
   RENDER — TRAIN
   =================================================================== */
function planSig(){ return planKey()+'|'+trainDays().join('')+'|'+JSON.stringify(S.swaps||{}); }
function renderTrain(force){
  renderPlanBar();
  // Conditioning is logged from Today, so it is always refreshed; the day
  // blocks (open cards, half-typed sets, a running rest timer) are built
  // once per plan and left alone across tab switches.
  renderCondSection();
  const list=$('#dayList'), sig=planSig();
  if(!force&&list.dataset.plan===sig) return;
  const days=trainDays();
  list.innerHTML=sessions().map((d,i)=>dayBlock(d,i,days[i])).join('');
  list.dataset.plan=sig;
  const info=infoForDate(TODAY);
  if(info&&info.idx>=0){ const blk=$('[data-dayblock="'+info.idx+'"]'); if(blk) blk.open=true; }
  $('#warmCard').innerHTML=
    '<details><summary><span class="idx">00</span>Warm-up and cool-down<span class="chev">'+ICO.chev+'</span></summary>'
    +'<div class="dbody"><p style="font-size:13.5px;color:var(--text-dim)">About ten minutes. It protects your joints, and your first heavy sets go better for it.</p>'
    +'<div class="grid2" style="margin-top:12px">'
    +'<div class="note"><b>Before</b><br>5 minutes of easy bike or incline walking, then the drills listed inside each session, then two lighter sets of your first lift: about half of today\'s weight for 8 reps, then about three-quarters for 4.</div>'
    +'<div class="note"><b>After</b><br>3 minutes of easy walking, then hold a gentle stretch for 20–30 seconds on each muscle you trained.</div>'
    +'</div></div></details>';
}
function renderPlanBar(){
  const p=program(), keys=variantKeys(p), seg=$('#splitSeg');
  seg.innerHTML=keys.map(k=>'<button data-dpw="'+k+'"'+(k===+S.profile.dpw?' class="on"':'')+'>'+k+' days a week</button>').join('');
  seg.style.display=keys.length>1?'':'none';
  const bar=$('#planBar');
  if(bar) bar.innerHTML='<div class="planbar"><div class="pb-t"><span class="pb-k">Your plan</span><span class="pb-n">'+esc(p.name)+'</span>'
    +'<span class="pb-l">'+esc(p.line)+'</span></div><button class="btn sm" data-pickplan>Change</button></div>';
}
/* two lighter sets of the day's first lift, in kilos when the log knows the working weight */
function rampLine(s){
  const it=s.items[0], ex=it&&EX[it.ex];
  if(!ex) return '';
  const prev=prevSession(it.ex), w=prev?workWeight(judged(prev,it.sets)):0, st=+ex.step||2.5;
  if(w>0&&ex.load!=='bw'&&ex.load!=='time'){
    const each=ex.load==='db'?' each':'';
    return 'Then two lighter sets of '+esc(ex.name)+': <b>'+kg(roundTo(w*0.5,st))+each+' × 8</b>, then <b>'+kg(roundTo(w*0.75,st))+each+' × 4</b>. (Last time you worked at '+kg(w)+each+'.)';
  }
  return 'Then two lighter sets of '+esc(ex.name)+': about half of today\'s weight for 8 reps, then about three-quarters for 4.';
}
function dayBlock(d,i,wd){
  const warm=WARMSETS[d.warm];
  let h='<details data-dayblock="'+i+'"><summary><span class="idx">'+String(i+1).padStart(2,'0')+'</span>'
    +'<span style="flex:1;min-width:0"><span style="display:block">'+esc(d.name)+'</span>'
    +'<span class="daytag">'+esc('Day '+(i+1)+' · '+d.tag+' · '+DOWL[wd])+'</span></span>'
    +'<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">';
  h+='<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:12px">'+esc(d.focus)+'</p>';
  if(warm){
    h+='<div class="warm"><div class="eyebrow" style="margin-bottom:6px">Warm-up first</div>'
      +'<p style="font-size:13px;color:var(--text-dim)">5 minutes of easy bike or incline walking, then:</p>'
      +'<div class="drills">'+warm.drills.map(k=>{
          if(!WARM[k]) return '';
          return '<div class="drill"><span class="dn">'+esc(WARM[k].name)+'<span class="dc">'+esc(WARM[k].cue)+'</span></span>'
            +'<span class="dr">'+esc(WARM[k].reps)+'</span>'
            +'<a class="lk v tiny" target="_blank" rel="noopener" aria-label="Video for '+esc(WARM[k].name)+'" '
            +'href="https://www.youtube.com/results?search_query='+encodeURIComponent(WARM[k].name)+'+proper+form+technique">▶</a></div>';
        }).filter(Boolean).join('')+'</div>'
      +'<p style="font-size:13px;color:var(--text-dim);margin-top:9px">'+rampLine(d)+'</p></div>';
  }
  h+=d.items.map((it,k)=>exCard(it,i+'.'+k)).join('');
  h+='</div></details>';
  return h;
}
function exCard(it,ref){
  const e=EX[it.ex]; if(!e) return '';
  return '<div class="ex" data-ex="'+it.ex+'" data-slot="'+ref+'"><button class="ex-h" aria-expanded="false">'
    +'<span class="ex-n"><span class="t">'+esc(e.name)+'</span>'
    +'<span class="s">'+esc(rxText(it))+' &nbsp;·&nbsp; '+esc(restText(it.rest))+' rest &nbsp;·&nbsp; '+esc(e.tag)+'</span></span>'
    +'<span class="chev">'+ICO.chev+'</span></button><div class="ex-b"></div></div>';
}
/* Which muscles, as one or two maps: prim drawn strong, sec lighter. */
function mapsFor(e){
  const all=(e.prim||[]).concat(e.sec||[]);
  let h='<div class="maps">';
  if(all.some(k=>FRONT_ZONES[k])) h+=muscleMap('front',e.prim||[],e.sec||[]);
  if(all.some(k=>BACK_ZONES[k]))  h+=muscleMap('back',e.prim||[],e.sec||[]);
  h+='</div><div class="mtags">'
    +(e.prim||[]).map(k=>'<span class="pill hot">'+esc(ZN[k]||k)+'</span>').join('')
    +(e.sec||[]).map(k=>'<span class="pill">'+esc(ZN[k]||k)+'</span>').join('')
    +'<span class="pill eq">'+esc(e.equip)+'</span></div>';
  return h;
}
/* The written guide. Content strings are authored (they may carry <b>); labels are plain text. */
function howTo(id){
  const e=EX[id]; let h='';
  if(e.setup&&e.setup.length)
    h+='<div class="how-sec"><div class="eyebrow">Set-up</div><ol class="steps">'+e.setup.map(s=>'<li>'+s+'</li>').join('')+'</ol></div>';
  if(e.rep&&e.rep.length)
    h+='<div class="how-sec"><div class="eyebrow">One rep, step by step</div><dl class="pos">'
      +e.rep.map(r=>'<dt>'+esc(r[0])+'</dt><dd>'+r[1]+'</dd>').join('')
      +(e.tempo?'<dt>Tempo</dt><dd>'+e.tempo+'</dd>':'')+'</dl></div>';
  if(e.feel) h+='<div class="note hot how-note"><b>Where you should feel it</b><br>'+e.feel+'</div>';
  if(e.fix&&e.fix.length)
    h+='<div class="how-sec"><div class="eyebrow">If it feels wrong</div><ul class="fixes">'
      +e.fix.map(f=>'<li><b>'+esc(f[0])+'</b><span>'+f[1]+'</span></li>').join('')+'</ul></div>';
  if(e.check) h+='<div class="note how-note"><b>Check yourself</b><br>'+e.check+'</div>';
  if(e.weight) h+='<div class="note how-note"><b>Picking the weight</b><br>'+e.weight+'</div>';
  if(e.safe) h+='<div class="avoid how-note"><span class="ic" aria-hidden="true">⚠</span><span><b>Safety:</b> '+e.safe+'</span></div>';
  return h;
}
/* A heavy barbell lift that is not the first of the day (the session's warm-up covers the first)
   still needs lighter sets before its working weight. */
function rampNote(id,ref){
  const sl=ref?slotAt(ref):null, ex=EX[id];
  if(!sl||sl.k===0||ex.load!=='bb'||!Array.isArray(sl.it.reps)||sl.it.reps[1]>6) return '';
  const prev=prevSession(id), w=prev?workWeight(judged(prev,sl.it.sets)):0, st=+ex.step||2.5;
  return '<div class="note ramp"><b>Two lighter sets first.</b> '
    +(w>0?kg(roundTo(w*0.5,st))+' × 5, then '+kg(roundTo(w*0.75,st))+' × 3.'
         :'About half of today\'s weight for 5 reps, then about three-quarters for 3.')+'</div>';
}
/* another exercise for the same muscle, when the station is taken or the gym does not have it */
function swapRow(id,ref){
  const sl=ref?slotAt(ref):null; if(!sl) return '';
  const base=sl.it.base||sl.it.ex;
  // not something already in this session: two cards for one exercise would share one logbook
  const taken=sessions()[sl.si].items.filter((o,k)=>k!==sl.k).map(o=>o.ex);
  const opts=[base].concat(EX[base].swap||[]).filter((x,i,a)=>EX[x]&&a.indexOf(x)===i&&x!==id&&taken.indexOf(x)<0);
  if(!opts.length) return '';
  return '<div class="how-sec"><div class="eyebrow">Station taken, or not in your gym?</div><div class="swaps">'
    +opts.map(x=>'<button class="btn sm" data-swap="'+x+'">'+(x===base?'Back to ':'Use ')+esc(EX[x].name)+'</button>').join('')
    +'</div><p class="swapnote">The number of sets stays the same. Each exercise keeps its own history.</p></div>';
}
function fillEx(box,id,ref){
  // Order: what you need between sets first (the one-line cue, the demo links,
  // the logbook), then the full guide. The guide starts open the first time you
  // meet a lift and folded once it is in your log. No stick-figure poses: the
  // muscle map and a real video or photo do that job better.
  const e=EX[id];
  const known=(S.logs[id]||[]).some(x=>loggedSets(x).length>0);
  box.innerHTML='<p class="cue">'+e.cue+'</p>'
    +demoLinks(e.name)
    +rampNote(id,ref)
    +logger(id,ref)
    +'<details class="how"'+(known?'':' open')+'><summary><span class="how-t">How to do it</span><span class="chev">'+ICO.chev+'</span></summary>'
    +'<div class="how-b">'+mapsFor(e)+howTo(id)+swapRow(id,ref)+'</div></details>';
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
