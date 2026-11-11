function renderPlan(){
  $('#fullPunch').innerHTML=punch(0,13);
  const di=todayIndex();
  let liftDone=0, liftTotal=0;
  for(let i=1;i<=BLOCK_DAYS;i++){ const d=dayInfo(i); if(d.type==='lift'){liftTotal++; if(sessionDone(d.date)) liftDone++;} }
  $('#punchPct').textContent=liftTotal?Math.round(liftDone/liftTotal*100)+'% of sessions':'—';
  const cur=di>=1&&di<=BLOCK_DAYS?dayInfo(di).phase:0;
  $('#phaseList').innerHTML=PHASES.map(p=>
    '<details'+(p.n===cur?' open':'')+'><summary><span class="idx">P'+p.n+'</span>'
    +'<span style="flex:1;min-width:0"><span style="display:block">'+esc(p.name)+'</span>'
    +'<span style="display:block;font-family:var(--font-m);font-size:10.5px;color:var(--text-faint)">'+esc(p.sub)+'</span></span>'
    +(p.n===cur?'<span class="pill hot">You are here</span>':'')
    +'<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<p style="font-size:14px;margin-bottom:13px">'+esc(p.goal)+'</p>'
    +col('Training',p.train)+col('Eating',p.eat)+col('Conditioning',p.cond)
    +'<div class="note hot" style="margin-top:13px"><b>By the end of it</b><br>'+esc(p.out)+'</div>'
    +'</div></details>').join('');
  const t=targets();
  $('#z2hr').textContent=t.z2[0]+'–'+t.z2[1]+' bpm';
}
function col(h,arr){
  return '<div style="margin-bottom:11px"><div class="eyebrow" style="margin-bottom:5px">'+esc(h)+'</div>'
    +'<ul class="klist">'+arr.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>';
}

/* ===================================================================
   RENDER — FUEL
   =================================================================== */
function renderFuel(){
  const t=targets(), type=S.ui.diet, isT=type==='train';
  const kcal=isT?t.train:t.rest, carb=isT?t.carbT:t.carbR;
  $('#ro-macros').innerHTML=[
    ro('Calories', kcal, isT?'training day':'rest day', true),
    ro('Protein', t.prot, 'g · the floor'),
    ro('Carbs', carb, 'g'),
    ro('Fat', t.fat, 'g · min 60')
  ].join('');
  $$('#dietSeg button').forEach(b=>b.classList.toggle('on', b.dataset.diet===type));

  const d=DIET[type];
  $('#mealList').innerHTML='<div class="note" style="margin-bottom:12px">'+esc(d.note)+'</div>'
    +d.meals.map(m=>
      '<div class="meal"><div class="meal-h"><span class="tm">'+esc(m.t)+'</span><span class="nm">'+esc(m.n)+'</span>'
      +'<span class="mc">'+m.k+' kcal<br>'+m.p+' g P</span></div><ul>'
      +m.items.map(it=>'<li><span class="q">'+esc(it[0])+'</span><span>'+esc(it[1])+'</span></li>').join('')
      +'<li style="margin-top:3px;color:var(--text-faint);font-size:12.5px;display:block">'+esc(m.tip)+'</li></ul></div>').join('')
    +(function(){
        const budget=isT?t.train:t.rest, over=d.kcal-budget;
        return '<div class="note hot" style="margin-top:12px">Template total: <b>'+d.kcal+' kcal · '+d.prot+' g protein</b>'
          +' against a target of <b>'+budget+' kcal</b>'
          +(over>0?' — it runs <b>'+over+' kcal over</b>. Drop the evening chapati (−120) or halve the almonds (−70) and it lands. '
                  :' — it lands inside the target. ')
          +'Every figure above is the sum of the items listed under it, priced from the same database the counter uses. '
          +'Portions are household measures, not scales — adjust off your weekly trend, not one hungry evening.</div>';
      })();

  renderProt();

  $('#fuelExtra').innerHTML=
    '<div class="sec"></div>'
    +'<details open><summary><span class="idx">01</span>Portions — ditch the scale<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<div class="note hot" style="margin-bottom:12px"><b>Palm = protein · cupped hand = carbs · thumb = fats.</b><br>'
    +'Your hand scales with your body, so it is the one measuring tool you never leave at home. Learn this table once and you never weigh anything again.</div>'
    +'<div class="tw"><table><thead><tr><th>Food</th><th>One portion</th><th class="n">Kcal</th><th class="n">Protein</th></tr></thead><tbody>'
    +PORTIONS.map(p=>'<tr><td>'+esc(p[0])+'</td><td>'+esc(p[1])+'</td><td class="n">'+p[2]+'</td><td class="n" style="color:var(--ember)">'+esc(p[3])+'</td></tr>').join('')
    +'</tbody></table></div></div></details>'
    +'<details><summary><span class="idx">02</span>Still hungry?<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<ul class="klist">'+HUNGRY.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'
    +'<div class="note" style="margin-top:12px">Hunger on a deficit is normal and manageable. Hunger that wrecks your sleep and your lifts is a signal you cut too hard — check the trend in Progress before you white-knuckle it.</div>'
    +'</div></details>'
    +'<details><summary><span class="idx">03</span>Eating out &amp; dawat survival<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<ul class="klist">'+DAWAT.map(x=>'<li>'+x+'</li>').join('')+'</ul>'
    +'</div></details>'
    +'<details><summary><span class="idx">04</span>Swaps<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:11px">Mix freely. The plan does not care which protein you pick, only that it turns up.</p>'
    +'<div class="tw"><table><thead><tr><th>Instead of</th><th>Any of these</th><th>Roughly</th></tr></thead><tbody>'
    +SWAPS.map(s=>'<tr><td>'+esc(s[0])+'</td><td>'+esc(s[1])+'</td><td class="n">'+esc(s[2])+'</td></tr>').join('')
    +'</tbody></table></div></div></details>'
    +'<details><summary><span class="idx">05</span>Weekly shop<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +GROCERY.map(g=>'<div style="margin-bottom:12px"><div class="eyebrow" style="margin-bottom:5px">'+esc(g[0])+'</div>'
      +'<div class="checks">'+g[1].map(it=>'<button class="chk" data-shop="'+esc(g[0]+'|'+it[0])+'" aria-pressed="false"><span class="box">'+ICO.tick+'</span><span class="lbl">'+esc(it[0])+'</span><span class="hint">'+esc(it[1])+'</span></button>').join('')+'</div></div>').join('')
    +'<div class="note">Batch-cook 1.5 kg of chicken and boil a dozen eggs at the start of the week. Five minutes of assembly beats takeout every time your willpower is low.</div>'
    +'</div></details>'
    +'<details><summary><span class="idx">06</span>Supplements<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:11px">Training, food, sleep and steps do 95% of this. Everything below is the remaining 5%, in priority order.</p>'
    +SUPPS.map(s=>'<div style="margin-bottom:13px"><div style="display:flex;gap:9px;align-items:baseline;flex-wrap:wrap">'
      +'<b style="font-family:var(--font-d);font-size:15px">'+esc(s[0])+'</b><span class="pill hot">'+esc(s[1])+'</span></div>'
      +'<p style="font-size:13px;color:var(--text-dim);margin-top:5px">'+esc(s[2])+'</p></div>').join('')
    +'</div></details>';
}
/* ---- the day counter: kcal, protein, carbs, fat ------------------ */
let foodCat=0;
function foodItems(){ return (S.food&&S.food[TODAY])||[]; }
function foodTotals(){
  return foodItems().reduce((a,x)=>({k:a.k+x.k, p:a.p+x.p, c:a.c+x.c, f:a.f+x.f}), {k:0,p:0,c:0,f:0});
}
function renderProt(){
  const t=targets(), isT=S.ui.diet==='train';
  const goal={k:isT?t.train:t.rest, p:t.prot, c:isT?t.carbT:t.carbR, f:t.fat};
  const tot=foodTotals();
  $('#foodDate').textContent=fmtDate(TODAY);
  const bar=(lbl,got,want,unit,hot)=>{
    const pct=Math.min(100,Math.round(got/want*100));
    const over=got>want*1.08;
    return '<div class="mrow"><div class="mtop"><span class="ml">'+lbl+'</span>'
      +'<span class="mv num'+(hot?' hot':'')+'">'+Math.round(got)+'<span class="mu"> / '+want+' '+unit+'</span></span></div>'
      +'<div class="pbar sm"><i class="'+(over?'over':'')+'" style="width:'+pct+'%"></i></div>'
      +'<div class="mrem num">'+(got>=want?(over?'over by '+Math.round(got-want):'target hit'):Math.round(want-got)+' '+unit+' to go')+'</div></div>';
  };
  $('#foodTotals').innerHTML=
    bar('Calories',tot.k,goal.k,'kcal',true)+bar('Protein',tot.p,goal.p,'g')
    +bar('Carbs',tot.c,goal.c,'g')+bar('Fat',tot.f,goal.f,'g');
  $('#foodCats').innerHTML=FOODCATS.map((c,i)=>
    '<button data-fcat="'+i+'"'+(i===foodCat?' class="on"':'')+'>'+esc(c[0].split(' ')[0])+'</button>').join('');
  $('#foodChips').innerHTML=FOODCATS[foodCat][1].map((f,i)=>
    '<button class="chip" data-food="'+foodCat+'|'+i+'"><span class="cn">'+esc(f[0])+'</span>'
    +'<span class="cp">'+esc(f[1])+'</span>'
    +'<span class="cg">'+f[2]+' kcal · '+f[3]+'g P</span></button>').join('');
  const items=foodItems();
  $('#foodTally').innerHTML=items.length
    ? '<div class="eyebrow" style="margin:14px 0 7px">Eaten today · tap to remove</div><div class="tally">'
      +items.map((x,i)=>'<button class="tallyitem" data-unfood="'+i+'">'+esc(x.n)+' <b>'+x.k+'</b> ×</button>').join('')
      +'</div>'
    : '<p style="font-size:12.5px;color:var(--text-faint);margin-top:14px">Nothing logged yet today.</p>';
}

/* ===================================================================
   RENDER — PROGRESS
   =================================================================== */
function weightList(){
  return Object.keys(S.weights).filter(k=>S.weights[k]!=null&&S.weights[k]!=='')
    .sort().map(k=>[k,+S.weights[k]]);
}
function rolling(list,n){
  return list.map((p,i)=>{
    const from=Math.max(0,i-n+1), seg=list.slice(from,i+1);
    return [p[0], seg.reduce((a,b)=>a+b[1],0)/seg.length];
  });
}
function renderProg(){
  const t=targets(), wl=weightList(), avg=rolling(wl,7);
  const first=wl.length?wl[0][1]:t.w, last=wl.length?wl[wl.length-1][1]:null;
  const lastAvg=avg.length?avg[avg.length-1][1]:null;
  const waistKeys=Object.keys(S.waist).filter(k=>S.waist[k]).sort();
  const w0=waistKeys.length?+S.waist[waistKeys[0]]:null, w1=waistKeys.length?+S.waist[waistKeys[waistKeys.length-1]]:null;

  $('#ro-prog').innerHTML=[
    ro('7-day avg', lastAvg!=null?lastAvg.toFixed(1):'—','kg',true),
    ro('Change', lastAvg!=null?((lastAvg-first>=0?'+':'')+(lastAvg-first).toFixed(1)):'—','kg since day 1'),
    ro('Waist', w1!=null?w1:'—', w0!=null&&w1!=null?((w1-w0>=0?'+':'')+(w1-w0).toFixed(1)+' cm'):'cm'),
    ro('Entries', wl.length,'weigh-ins')
  ].join('');

  // weekly rate from the last 14 days of average
  let rate=null;
  if(avg.length>=8){
    const a=avg[Math.max(0,avg.length-15)], b=avg[avg.length-1];
    const days=Math.max(1,daysBetween(parseISO(a[0]),parseISO(b[0])));
    rate=(b[1]-a[1])/days*7;
  }
  $('#trendPill').textContent = rate==null?'need 8+ readings':(rate>0?'+':'')+rate.toFixed(2)+' kg/week';

  $('#chartBox').innerHTML=chart(wl,avg,t);
  $('#verdictCard').innerHTML=trendVerdict(rate,t);
  renderMeas();
  renderPR();
  renderHabit();
}
function trendVerdict(rate,t){
  let cls='note', title, body;
  if(rate==null){ title='Not enough data yet';
    body='Weigh yourself every morning, fasted, after the toilet. Eight readings and this panel starts telling you what to change.'; }
  else if(rate<-t.w*0.01){ cls='note hot'; title='You are losing too fast';
    body='More than 1% of bodyweight a week means you are burning muscle along with the fat. Add about 150 kcal back — carbs on training days — and hold there for two weeks.'; }
  else if(rate<=-0.35){ title='On target — change nothing';
    body='This is exactly the rate that keeps muscle while the fat comes off. The temptation to speed it up is the thing most likely to cost you the result.'; }
  else if(rate<0){ title='Slower than target, but moving';
    body='Give it another week before touching anything. If it is still under 0.35 kg/week, add 1,000 steps a day rather than cutting food.'; }
  else { cls='note hot'; title='Flat or climbing';
    body='If this holds for two to three weeks: cut 150–200 kcal from carbs or fat — never protein — or add 1,000 steps a day. Pick one, not both, so you know which worked. Check the weekends first; that is usually where it hides.'; }
  return '<div class="card"><div class="card-h"><h3>What to do about it</h3></div><div class="'+cls+'"><b>'+esc(title)+'</b><br>'+esc(body)+'</div></div>';
}

/* ---- weight chart: raw dots + 7-day average + goal reference ------ */
function chart(wl,avg,t){
  if(wl.length<2) return '<div style="padding:26px 10px;text-align:center;color:var(--text-faint);font-size:13px">'
    +'Two weigh-ins and the trend line appears.<br><span style="font-size:12px">Same time, same conditions, every morning.</span></div>';
  const W=600,H=210,PL=34,PR=12,PT=12,PB=22;
  const xs=wl.map(p=>parseISO(p[0]).getTime());
  const x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
  const vals=wl.map(p=>p[1]).concat([t.target90]);
  let lo=Math.min.apply(null,vals), hi=Math.max.apply(null,vals);
  const pad=Math.max(0.8,(hi-lo)*0.15); lo-=pad; hi+=pad;
  // snap the axis to a round step so the labels read as kilos, not noise
  const steps=[0.25,0.5,1,2,2.5,5];
  let step=steps[steps.length-1];
  for(let i=0;i<steps.length;i++){ if((hi-lo)/steps[i]<=5){ step=steps[i]; break; } }
  lo=Math.floor(lo/step)*step; hi=Math.ceil(hi/step)*step;
  const X=v=>PL+(x1===x0?0:(v-x0)/(x1-x0))*(W-PL-PR);
  const Y=v=>PT+(1-(v-lo)/(hi-lo))*(H-PT-PB);
  const line=a=>a.map((p,i)=>(i?'L':'M')+X(parseISO(p[0]).getTime()).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
  const area=line(avg)+' L'+X(x1).toFixed(1)+' '+(H-PB)+' L'+X(x0).toFixed(1)+' '+(H-PB)+' Z';

  let g='';
  const dec=step<1?1:0;
  for(let v=lo; v<=hi+1e-9; v+=step){
    const y=Y(v).toFixed(1);
    g+='<line class="grid-l" x1="'+PL+'" y1="'+y+'" x2="'+(W-PR)+'" y2="'+y+'"/>'
      +'<text class="axis-t" x="'+(PL-6)+'" y="'+(+y+3)+'" text-anchor="end">'+v.toFixed(dec)+'</text>';
  }
  const gy=Y(t.target90).toFixed(1);
  const goalIn=t.target90>lo&&t.target90<hi;
  const dots=wl.map(p=>'<circle class="raw" cx="'+X(parseISO(p[0]).getTime()).toFixed(1)+'" cy="'+Y(p[1]).toFixed(1)+'" r="2.4"/>').join('');
  const lastP=avg[avg.length-1];

  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Body weight over time with a 7-day rolling average">'
    +'<defs><linearGradient id="emberfade" x1="0" y1="0" x2="0" y2="1">'
    +'<stop offset="0%" stop-color="var(--ember)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--ember)" stop-opacity="0"/></linearGradient></defs>'
    +g
    +(goalIn?'<line class="goal-l" x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'"/>'
      +'<text class="axis-t" x="'+(W-PR)+'" y="'+(+gy-5)+'" text-anchor="end" style="fill:var(--steel)">90-day target '+t.target90.toFixed(1)+'</text>':'')
    +'<path class="area" d="'+area+'"/>'
    +dots
    +'<path class="trend" d="'+line(avg)+'"/>'
    +'<circle class="endcap" cx="'+X(parseISO(lastP[0]).getTime()).toFixed(1)+'" cy="'+Y(lastP[1]).toFixed(1)+'" r="4.2"/>'
    +'<text class="axis-t" x="'+PL+'" y="'+(H-6)+'">'+fmtDate(wl[0][0])+'</text>'
    +'<text class="axis-t" x="'+(W-PR)+'" y="'+(H-6)+'" text-anchor="end">'+fmtDate(wl[wl.length-1][0])+'</text>'
    +'</svg>';
}

function renderMeas(){
  const rows=S.meas.slice().sort((a,b)=>a.d<b.d?-1:1);
  let h='<table><thead><tr><th>Date</th><th class="n">Waist</th><th class="n">Chest</th><th class="n">Shoulders</th><th class="n">Arm</th><th class="n">Thigh</th><th></th></tr></thead><tbody>';
  if(!rows.length) h+='<tr><td colspan="7" style="color:var(--text-faint)">Nothing yet. Take a baseline today — you cannot get it back later.</td></tr>';
  rows.forEach((r,i)=>{
    h+='<tr><td>'+fmtDate(r.d)+'</td>'+['waist','chest','sh','arm','thigh'].map(k=>'<td class="n">'+(r[k]!=null?esc(r[k]):'—')+'</td>').join('')
      +'<td><button class="del" data-delmeas="'+i+'" aria-label="Delete entry">×</button></td></tr>';
  });
  $('#measTable').innerHTML=h+'</tbody></table>';
}
function renderPR(){
  const ids=Object.keys(S.logs).filter(id=>EX[id]&&(S.logs[id]||[]).length);
  let h='<table><thead><tr><th>Lift</th><th class="n">Best set</th><th class="n">First</th><th class="n">Change</th></tr></thead><tbody>';
  if(!ids.length) h+='<tr><td colspan="4" style="color:var(--text-faint)">Log a session in Train and your lifts appear here.</td></tr>';
  const peak=(sets,f)=>sets.reduce((m,x)=>Math.max(m,+x[f]||0),0);
  ids.forEach(id=>{
    const sess=S.logs[id];
    const maxW=sess.reduce((m,s)=>Math.max(m,peak(s.sets,'w')),0);
    let bestTxt,firstTxt,delta;
    if(maxW>0){
      const best=sess.reduce((m,s)=>{const b=peak(s.sets,'w'); return b>m.w?{w:b,s:s}:m;},{w:0,s:null});
      const first=peak(sess[0].sets,'w');
      const bestRep=best.s.sets.filter(x=>+x.w===best.w&&x.r).map(x=>x.r)[0]||'';
      bestTxt=best.w+' kg'+(bestRep?' × '+bestRep:'');
      firstTxt=first?first+' kg':'—';
      delta=first?Math.round((best.w-first)/first*1000)/10:null;
    }else{
      // bodyweight lift — progress is reps, not load
      const bestR=sess.reduce((m,s)=>Math.max(m,peak(s.sets,'r')),0);
      const firstR=peak(sess[0].sets,'r');
      bestTxt=bestR?'BW × '+bestR:'—';
      firstTxt=firstR?'BW × '+firstR:'—';
      delta=firstR?Math.round((bestR-firstR)/firstR*1000)/10:null;
    }
    h+='<tr><td>'+esc(EX[id].name)+'</td><td class="n">'+bestTxt+'</td><td class="n">'+firstTxt
      +'</td><td class="n" style="color:'+(delta>0?'var(--good)':'var(--text-faint)')+'">'
      +(delta!=null?(delta>0?'+':'')+delta+'%':'—')+'</td></tr>';
  });
  $('#prTable').innerHTML=h+'</tbody></table>';
  $('#prCount').textContent=ids.length+(ids.length===1?' lift':' lifts');
}
function renderHabit(){
  $('#streakPill').textContent=streak()+(streak()===1?' day':' days');
  const total=checkList().length;
  let h='<div style="display:flex;gap:4px;align-items:flex-end;height:74px;margin-top:4px">';
  for(let w=1;w<=13;w++){
    let hit=0, poss=0;
    for(let k=0;k<7;k++){
      const i=(w-1)*7+k+1; if(i>BLOCK_DAYS) break;
      const d=dayInfo(i);
      if(parseISO(d.date)>parseISO(TODAY)) continue;
      poss+=total; hit+=(S.checks[d.date]||[]).length;
    }
    const pct=poss?Math.round(hit/poss*100):0;
    h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px" title="Week '+w+': '+pct+'%">'
      +'<div style="width:100%;height:'+Math.max(2,pct*0.52)+'px;background:'+(pct>=85?'var(--ember)':pct>0?'var(--steel-dim)':'var(--line)')+';border-radius:3px 3px 0 0"></div>'
      +'<span class="num" style="font-size:8.5px;color:var(--text-faint)">'+w+'</span></div>';
  }
  $('#habitGrid').innerHTML=h+'</div>';
}

/* ===================================================================
   SHEET
   =================================================================== */
