/* ===================================================================
   RENDER — MAP
   =================================================================== */
/* which set of advice a goal reads: losing fat, holding weight, or gaining */
function goalClass(){ const g=S.profile.goal; return g==='gain'?'gain':g==='maintain'?'hold':'lose'; }
const GOAL_NAME={cut:'Lose fat', recomp:'Lose fat slowly, build muscle', maintain:'Stay at this weight', gain:'Build muscle'};
function renderPlan(){
  $('#fullPunch').innerHTML=punch(0,13);
  const di=todayIndex(), gc=goalClass();
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
    +col('Training',p.train)+col('Eating',p.eat[gc])+col('Conditioning',p.cond)
    +'<div class="note hot" style="margin-top:13px"><b>By the end of it</b><br>'+esc(p.out[gc])+'</div>'
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
/* Training day or rest day: the plan's weekday decides, unless you chose by hand today. */
function dietType(){
  if(S.ui.dietOn===TODAY) return S.ui.diet==='rest'?'rest':'train';
  return trainDays().indexOf(parseISO(TODAY).getDay())>=0?'train':'rest';
}
/* The example day for this person. It starts from the base meals and changes
   portions until the day is close enough to the day's numbers:
     calories   within 40 kcal, and never under the safe minimum
     protein    from 5 g under to 20 g over, or up to a fifth of the day's
                calories where that is more. Ordinary food carries that much,
                and a day forced under it stops being a day anyone would eat.
   Each step is the one that buys the most closeness for the least change to
   the base day, so the result is the standard day with as little altered as
   the numbers allow. Every number is a sum of entries from the food list. */
function mealPlan(type){
  const t=targets(), wantK=type==='train'?t.train:t.rest, wantP=t.prot;
  const meals=MEALPLAN[type].map(m=>({n:m.n, tip:m.tip, items:m.items.map(x=>({id:x[0], q:x[1]}))}));
  const lev=[];
  LEVERS.forEach(L=>{
    const meal=meals.find(m=>m.n===L[0]); if(!meal) return;
    let it=meal.items.find(x=>x.id===L[1]);
    if(!it){ it={id:L[1], q:0}; meal.items.push(it); }
    lev.push({it:it, step:L[2], lo:L[3], hi:L[4], r:L[5], n:0, k:FOOD[L[1]][2]*L[2], p:FOOD[L[1]][3]*L[2]});
  });
  let K=0, P=0;
  meals.forEach(m=>m.items.forEach(it=>{ K+=FOOD[it.id][2]*it.q; P+=FOOD[it.id][3]*it.q; }));
  // how far outside "close enough" a day is; 0 when it fits
  const under=Math.max(0,Math.min(40,wantK-t.floor)), over=Math.max(20, wantK*0.2/4-wantP);
  const miss=(k,p)=>{
    const dk=k-wantK, a=(dk<-under?-under-dk:dk>40?dk-40:0)/25, d=p-wantP, b=d<-5?(-5-d)/5:d>over?(d-over)/10:0;
    return a*a+b*b;
  };
  // every legal step of one portion; c is what it costs in distance from the base day
  const steps=()=>{
    const s=[];
    lev.forEach(l=>[1,-1].forEach(d=>{
      const q=l.it.q+d*l.step;
      if(q>=l.lo-1e-9&&q<=l.hi+1e-9) s.push({l:l, d:d, k:d*l.k, p:d*l.p, c:l.r*(2*l.n*d+1)});
    }));
    return s;
  };
  const apply=m=>{ m.l.it.q=Math.round((m.l.it.q+m.d*m.l.step)*2)/2; m.l.n+=m.d; K+=m.k; P+=m.p; };
  // singles and pairs: a pair is what swaps a protein food for an energy food
  const each=(s,f)=>{ for(let i=0;i<s.length;i++){ f(s[i],null); for(let j=i+1;j<s.length;j++) if(s[j].l!==s[i].l) f(s[i],s[j]); } };
  // 1. get close: the step that closes the most distance per unit of change
  for(let guard=0; guard<300; guard++){
    const now=miss(K,P); if(now===0) break;
    let best=null, top=0;
    each(steps(),(a,b)=>{
      const gain=now-miss(K+a.k+(b?b.k:0), P+a.p+(b?b.p:0)); if(gain<=1e-9) return;
      const score=gain/Math.max(a.c+(b?b.c:0), 0.25);
      if(score>top){ top=score; best=[a,b]; }
    });
    if(!best) break;
    apply(best[0]); if(best[1]) apply(best[1]);
  }
  // 2. give back any change the day does not need
  for(let guard=0; guard<300; guard++){
    const now=miss(K,P); let best=null, low=-1e-9;
    each(steps(),(a,b)=>{
      const c=a.c+(b?b.c:0);
      if(c<low&&miss(K+a.k+(b?b.k:0), P+a.p+(b?b.p:0))<=now+1e-9){ low=c; best=[a,b]; }
    });
    if(!best) break;
    apply(best[0]); if(best[1]) apply(best[1]);
  }
  let C=0, F=0;
  const out=meals.map(m=>{
    const last={sabzi:1, salad:2};
    const items=m.items.filter(it=>it.q>0).map((it,i)=>[it,i]).sort((a,b)=>((last[a[0].id]||0)-(last[b[0].id]||0))||a[1]-b[1]).map(x=>x[0]);
    items.forEach(it=>{ C+=FOOD[it.id][4]*it.q; F+=FOOD[it.id][5]*it.q; });
    return {n:m.n, tip:m.tip, items:items,
      k:Math.round(items.reduce((a,it)=>a+FOOD[it.id][2]*it.q,0)),
      p:Math.round(items.reduce((a,it)=>a+FOOD[it.id][3]*it.q,0))};
  }).filter(m=>m.items.length);
  return {meals:out, k:out.reduce((a,m)=>a+m.k,0), p:out.reduce((a,m)=>a+m.p,0), c:Math.round(C), f:Math.round(F), wantK:wantK, wantP:wantP};
}
function renderFuel(){
  const t=targets(), type=dietType(), isT=type==='train';
  const kcal=isT?t.train:t.rest, carb=isT?t.carbT:t.carbR;
  $('#ro-macros').innerHTML=[
    ro('Calories', kcal, isT?'training day':'rest day', true),
    ro('Protein', t.prot, 'g · every day'),
    ro('Carbs', carb, 'g'),
    ro('Fat', t.fat, 'g')
  ].join('');
  $$('#dietSeg button').forEach(b=>b.classList.toggle('on', b.dataset.diet===type));
  const wk=Math.abs(t.weekly);
  $('#fuelGoal').innerHTML='<b>'+esc(GOAL_NAME[S.profile.goal])+'.</b> '
    +(S.profile.goal==='maintain'?'You eat what you burn: about '+t.tdee.toLocaleString()+' kcal a day.'
      :'You burn about '+t.tdee.toLocaleString()+' kcal a day; the plan averages '+t.kcal.toLocaleString()+', which should move the scale about '
        +wk.toFixed(1)+' kg a week '+(t.weekly<0?'down':'up')+'.')
    +(t.floored?' <b>This is the lowest safe target:</b> do not eat less than this without a doctor.':'')
    +' <span style="color:var(--text-faint)">Change your goal or your numbers in Settings.</span>';

  const d=mealPlan(type), gap=d.k-d.wantK;
  $('#mealList').innerHTML='<div class="note" style="margin-bottom:12px"><b>An example '+(isT?'training':'rest')+' day that fits your numbers.</b> '
      +'It is built from the food list in the counter above, so you can swap any item for another of the same kind. Protein is the same every day; a rest day carries fewer carbs.</div>'
    +d.meals.map(m=>
      '<div class="meal"><div class="meal-h"><span class="nm">'+esc(m.n)+'</span>'
      +'<span class="mc">'+m.k+' kcal<br>'+m.p+' g P</span></div><ul>'
      +m.items.map(it=>{ const x=MEALFOOD[it.id](it.q); return '<li><span class="q">'+esc(x[0])+'</span><span>'+esc(x[1])+'</span></li>'; }).join('')
      +'<li style="margin-top:3px;color:var(--text-faint);font-size:12.5px;display:block">'+esc(m.tip)+'</li></ul></div>').join('')
    +'<div class="note hot" style="margin-top:12px" id="mealTotal">This day adds up to <b>'+d.k+' kcal · '+d.p+' g protein</b>'
      +' (carbs '+d.c+' g, fat '+d.f+' g). Your target today is <b>'+d.wantK+' kcal</b> and <b>at least '+d.wantP+' g of protein</b>.'
      +(Math.abs(gap)<=90?'':(gap<0?' It is '+(-gap)+' kcal short: add more rice, chapati, fruit or nuts to reach your target.'
                                  :' It is '+gap+' kcal over: leave out the snack, or a chapati.'))
      +' Portions are household measures, so judge it on your weekly trend, not on one day.</div>';

  renderProt();

  $('#fuelExtra').innerHTML=
    '<div class="sec"></div>'
    +'<details open><summary><span class="idx">01</span>Portions without a scale<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<div class="note hot" style="margin-bottom:12px"><b>Palm = protein · cupped hand = carbs · thumb = fats.</b><br>'
    +'Your hand grows with your body, so it is the one measuring tool you always carry. Learn this table once and you never need to weigh food.</div>'
    +'<div class="tw"><table><thead><tr><th>Food</th><th>One portion</th><th class="n">Kcal</th><th class="n">Protein</th></tr></thead><tbody>'
    +PORTIONS.map(p=>'<tr><td>'+esc(p[0])+'</td><td>'+esc(p[1])+'</td><td class="n">'+p[2]+'</td><td class="n" style="color:var(--ember)">'+esc(p[3])+'</td></tr>').join('')
    +'</tbody></table></div></div></details>'
    +'<details><summary><span class="idx">02</span>Still hungry?<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<ul class="klist">'+HUNGRY.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'
    +'<div class="note" style="margin-top:12px">Some hunger while losing fat is normal. Hunger that ruins your sleep and your lifts means the deficit is too big: check the trend in Progress before you push through it.</div>'
    +'</div></details>'
    +'<details><summary><span class="idx">03</span>Eating out and at gatherings<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<ul class="klist">'+DAWAT.map(x=>'<li>'+x+'</li>').join('')+'</ul>'
    +'</div></details>'
    +'<details><summary><span class="idx">04</span>Swaps<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:11px">Mix freely. The plan does not care which protein you pick, only that it is there.</p>'
    +'<div class="tw"><table><thead><tr><th>Instead of</th><th>Any of these</th><th>Roughly</th></tr></thead><tbody>'
    +SWAPS.map(s=>'<tr><td>'+esc(s[0])+'</td><td>'+esc(s[1])+'</td><td class="n">'+esc(s[2])+'</td></tr>').join('')
    +'</tbody></table></div></div></details>'
    +'<details><summary><span class="idx">05</span>Weekly shop<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +GROCERY.map(g=>'<div style="margin-bottom:12px"><div class="eyebrow" style="margin-bottom:5px">'+esc(g[0])+'</div>'
      +'<div class="checks">'+g[1].map(it=>{ const k=g[0]+'|'+it[0]; return '<button class="chk" data-shop="'+esc(k)+'" aria-pressed="'+!!S.shop[k]+'"><span class="box">'+ICO.tick+'</span><span class="lbl">'+esc(it[0])+'</span><span class="hint">'+esc(it[1])+'</span></button>'; }).join('')+'</div></div>').join('')
    +'<div class="note">Cook your protein for several days at once and boil a dozen eggs at the start of the week. Five minutes of putting a meal together beats ordering food when you are tired.</div>'
    +'</div></details>'
    +'<details><summary><span class="idx">06</span>Supplements<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:11px">Training, food, sleep and steps do nearly all of this. Everything below is the small remainder, most useful first.</p>'
    +SUPPS.map(s=>'<div style="margin-bottom:13px"><div style="display:flex;gap:9px;align-items:baseline;flex-wrap:wrap">'
      +'<b style="font-family:var(--font-d);font-size:15px">'+esc(s[0])+'</b><span class="pill hot">'+esc(s[1])+'</span></div>'
      +'<p style="font-size:13px;color:var(--text-dim);margin-top:5px">'+esc(s[2])+'</p></div>').join('')
    +'</div></details>';
}
/* ---- the day counter: kcal, protein, carbs, fat ------------------ */
let foodCat=0;
function foodItems(){ return (S.food&&S.food[TODAY])||[]; }
function foodTotalsOn(ds){
  return ((S.food&&S.food[ds])||[]).reduce((a,x)=>({k:a.k+x.k, p:a.p+x.p, c:a.c+x.c, f:a.f+x.f}), {k:0,p:0,c:0,f:0});
}
function foodTotals(){ return foodTotalsOn(TODAY); }
function renderProt(){
  const t=targets(), isT=dietType()==='train';
  const goal={k:isT?t.train:t.rest, p:t.prot, c:isT?t.carbT:t.carbR, f:t.fat};
  const tot=foodTotals();
  $('#foodDate').textContent=fmtDate(TODAY);
  const bar=(lbl,got,want,unit,hot)=>{
    const pct=want?Math.min(100,Math.round(got/want*100)):0;
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
      +items.map((x,i)=>'<button class="tallyitem" data-unfood="'+i+'">'+esc(x.n)+' <b>'+esc(x.k)+'</b> ×</button>').join('')
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
/* the 7-day average: for each weigh-in, the mean of the readings dated within the 7 days ending on it */
function rolling(list){
  return list.map((p,i)=>{
    const from=iso(addDays(parseISO(p[0]),-6)); let s=0,n=0;
    for(let j=i;j>=0&&list[j][0]>=from;j--){ s+=list[j][1]; n++; }
    return [p[0], s/n];
  });
}
/* kg per week: the straight line through the last 14 days of weigh-ins. Needs five readings
   across a week; it is "firm" (worth acting on) from eight readings across ten days. */
function weeklyRate(list){
  if(!list.length) return null;
  const from=iso(addDays(parseISO(list[list.length-1][0]),-13));
  const pts=list.filter(p=>p[0]>=from).map(p=>[daysBetween(parseISO(from),parseISO(p[0])),p[1]]);
  if(pts.length<5) return null;
  const span=pts[pts.length-1][0]-pts[0][0];
  if(span<6) return null;
  const n=pts.length, mx=pts.reduce((a,p)=>a+p[0],0)/n, my=pts.reduce((a,p)=>a+p[1],0)/n;
  let sxy=0, sxx=0;
  pts.forEach(p=>{ sxy+=(p[0]-mx)*(p[1]-my); sxx+=(p[0]-mx)*(p[0]-mx); });
  return {rate:sxx?sxy/sxx*7:0, n:n, firm:n>=8&&span>=10};
}
function renderProg(){
  const t=targets(), wl=weightList(), avg=rolling(wl);
  const inBlock=wl.filter(p=>p[0]>=S.profile.start);
  const first=inBlock.length?inBlock[0][1]:(wl.length?wl[0][1]:t.w);
  const lastAvg=avg.length?avg[avg.length-1][1]:null;
  const waistKeys=Object.keys(S.waist).filter(k=>S.waist[k]).sort();
  const w0=waistKeys.length?+S.waist[waistKeys[0]]:null, w1=waistKeys.length?+S.waist[waistKeys[waistKeys.length-1]]:null;

  $('#ro-prog').innerHTML=[
    ro('7-day avg', lastAvg!=null?lastAvg.toFixed(1):'—','kg',true),
    ro('Change', lastAvg!=null?((lastAvg-first>=0?'+':'')+(lastAvg-first).toFixed(1)):'—','kg this block'),
    ro('Waist', w1!=null?w1:'—', w0!=null&&w1!=null?((w1-w0>=0?'+':'')+(w1-w0).toFixed(1)+' cm'):'cm'),
    ro('Entries', wl.length,'weigh-ins')
  ].join('');

  const tr=weeklyRate(wl);
  $('#trendPill').textContent = !tr?'need 5 readings over a week':(tr.rate>0?'+':'')+tr.rate.toFixed(2)+' kg/week'+(tr.firm?'':' · early');

  $('#chartBox').innerHTML=chart(wl,avg,t);
  $('#verdictCard').innerHTML=trendVerdict(tr,t);
  renderMeas();
  renderPR();
  renderHabit();
  renderBlocks();
}
function trendVerdict(tr,t){
  const g=S.profile.goal, w=t.w;
  let cls='note', title, body;
  if(!tr){ title='Not enough data yet';
    body='Weigh yourself in the morning, before food and after the toilet. Five readings across a week and this panel starts telling you what to change.'; }
  else if(!tr.firm){ title='Early days';
    body='About '+(tr.rate>0?'+':'')+tr.rate.toFixed(1)+' kg a week so far, from '+tr.n+' weigh-ins. Keep weighing for two weeks before you change anything: one salty meal moves the scale more than a week of fat does.'; }
  else if(g==='cut'||g==='recomp'){
    const r=tr.rate;
    if(r<-w*0.01){ cls='note hot'; title='You are losing too fast';
      body='More than 1% of your bodyweight a week takes muscle along with the fat. Add about 150 kcal a day, as carbs on training days, and hold there for two weeks.'; }
    else if(r<=t.weekly*0.6){ title='On target — change nothing';
      body='This is the pace that keeps your muscle while the fat comes off. Trying to speed it up is the thing most likely to cost you the result.'; }
    else if(r<-0.05){ title='Slower than planned, but moving';
      body='Give it another week before changing anything. If it is still slow, add 1,000 steps a day rather than cutting food.'; }
    else { cls='note hot'; title='Flat or climbing';
      body='If this lasts two to three weeks, take 150–200 kcal a day off carbs or fat, never protein, or add 1,000 steps a day. Choose one, so you know which worked. Look at the weekends first: that is usually where it hides.'; }
  }else if(g==='maintain'){
    const r=tr.rate;
    if(Math.abs(r)<=0.25){ title='Holding steady — change nothing'; body='Your weight is stable. Keep eating as you are and let the logbook show the progress.'; }
    else if(r>0){ title='Drifting up'; body='If this lasts two to three weeks, take about 150 kcal a day off carbs or fat.'; }
    else { title='Drifting down'; body='If this lasts two to three weeks, add about 150 kcal a day, as carbs around training.'; }
  }else{
    const r=tr.rate;
    if(r>w*0.005){ cls='note hot'; title='Gaining too fast';
      body='More than half a percent of your bodyweight a week is mostly fat. Take about 150 kcal a day off.'; }
    else if(r>=0.1){ title='On target — change nothing'; body='A slow, steady gain is what building muscle looks like. Keep the logbook moving.'; }
    else { title='Not gaining';
      body='If this lasts two to three weeks, add about 150 kcal a day: a glass of milk, or an extra chapati with dinner.'; }
  }
  return '<div class="card"><div class="card-h"><h3>What to do about it</h3></div><div class="'+cls+'"><b>'+esc(title)+'</b><br>'+esc(body)+'</div></div>';
}

/* ---- weight chart: raw dots + 7-day average + the block's target ------ */
function chart(wl,avg,t){
  if(wl.length<2) return '<div style="padding:26px 10px;text-align:center;color:var(--text-faint);font-size:13px">'
    +'Two weigh-ins and the trend line appears.<br><span style="font-size:12px">Same time, same conditions, every morning.</span></div>';
  const W=600,H=210,PL=34,PR=12,PT=12,PB=22;
  const xs=wl.map(p=>parseISO(p[0]).getTime());
  const x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
  const vals=wl.map(p=>p[1]).concat([t.target90]);
  let lo=Math.min.apply(null,vals), hi=Math.max.apply(null,vals);
  const pad=Math.max(0.8,(hi-lo)*0.15); lo-=pad; hi+=pad;
  // snap the axis to a round step so the labels read as kilos, not noise (never more than about six lines)
  const steps=[0.25,0.5,1,2,2.5,5,10,20,50];
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

  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Body weight over time with a 7-day average">'
    +'<defs><linearGradient id="emberfade" x1="0" y1="0" x2="0" y2="1">'
    +'<stop offset="0%" stop-color="var(--ember)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--ember)" stop-opacity="0"/></linearGradient></defs>'
    +g
    +(goalIn?'<line class="goal-l" x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'"/>'
      +'<text class="axis-t" x="'+(W-PR)+'" y="'+(+gy-5)+'" text-anchor="end" style="fill:var(--steel)">91-day target '+t.target90.toFixed(1)+'</text>':'')
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
  if(!rows.length) h+='<tr><td colspan="7" style="color:var(--text-faint)">Nothing yet. Take a first measurement today: you cannot get it back later.</td></tr>';
  rows.forEach((r,i)=>{
    h+='<tr><td>'+fmtDate(r.d)+'</td>'+['waist','chest','sh','arm','thigh'].map(k=>'<td class="n">'+(r[k]!=null?esc(r[k]):'—')+'</td>').join('')
      +'<td><button class="del" data-delmeas="'+i+'" aria-label="Delete entry">×</button></td></tr>';
  });
  $('#measTable').innerHTML=h+'</tbody></table>';
}
/* the best set of a session: the heaviest weight, then the most reps at it (a set needs reps to count) */
function bestSet(e){
  let b=null;
  (e.sets||[]).forEach(s=>{ if(!(s.r>0)) return; const w=+s.w||0; if(!b||w>b.w||(w===b.w&&s.r>b.r)) b={w:w, r:s.r}; });
  return b;
}
function renderPR(){
  const ids=Object.keys(S.logs).filter(id=>EX[id]&&(S.logs[id]||[]).some(e=>bestSet(e)));
  let h='<table><thead><tr><th>Lift</th><th class="n">Best set</th><th class="n">First</th><th class="n">Change</th></tr></thead><tbody>';
  if(!ids.length) h+='<tr><td colspan="4" style="color:var(--text-faint)">Log a session in Train and your lifts appear here.</td></tr>';
  ids.forEach(id=>{
    const hold=EX[id].load==='time', unit=hold?' s':'';
    const sess=S.logs[id].filter(e=>bestSet(e)), first=bestSet(sess[0]);
    let best=first;
    sess.forEach(e=>{ const b=bestSet(e); if(b.w>best.w||(b.w===best.w&&b.r>best.r)) best=b; });
    const txt=b=>b.w>0?b.w+' kg × '+b.r+unit:(hold?b.r+' s':'BW × '+b.r);
    let delta='—', up=false;
    if(best.w>first.w&&first.w>0){ delta='+'+(Math.round((best.w-first.w)/first.w*1000)/10)+'%'; up=true; }
    else if(best.w>first.w){ delta='+'+best.w+' kg'; up=true; }
    else if(best.r>first.r){ delta='+'+(best.r-first.r)+(hold?' s':' reps'); up=true; }
    h+='<tr><td>'+esc(EX[id].name)+'</td><td class="n">'+txt(best)+'</td><td class="n">'+txt(first)
      +'</td><td class="n" style="color:'+(up?'var(--good)':'var(--text-faint)')+'">'+delta+'</td></tr>';
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
/* blocks you have finished */
function renderBlocks(){
  const el=$('#blocksCard'); if(!el) return;
  if(!S.blocks.length){ el.innerHTML=''; return; }
  el.innerHTML='<div class="card"><div class="card-h"><h3>Past blocks</h3><span class="pill">'+S.blocks.length+'</span></div>'
    +'<div class="tw"><table><thead><tr><th>Plan</th><th>Dates</th><th class="n">Sessions</th><th class="n">Weight</th></tr></thead><tbody>'
    +S.blocks.slice().reverse().map(b=>'<tr><td>'+esc(b.name||b.program)+' · '+esc(b.dpw)+' days</td><td>'+fmtDate(b.start)+' – '+fmtDate(b.end)+'</td>'
      +'<td class="n">'+esc(b.done)+' / '+esc(b.planned)+'</td>'
      +'<td class="n">'+(b.w0!=null&&b.w1!=null?((b.w1-b.w0>=0?'+':'')+(b.w1-b.w0).toFixed(1)+' kg'):'—')+'</td></tr>').join('')
    +'</tbody></table></div></div>';
}
