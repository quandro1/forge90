/* ===================================================================
   MUSCLES THIS WEEK (Progress)
   How many sets each muscle has had so far this week, shaded on the body, against what the plan asks for.
   A set counts 1 for a muscle the lift names as main (prim) and half for one it names as a helper (sec):
   the same rule tools/validate.mjs counts a plan's weekly volume by.
   "This week" is the week of the block that today is in; before or after a block, the last seven days.
   =================================================================== */
function weekSpan(){
  const info=infoForDate(TODAY);
  if(info) return {dates:weekDates(info.week), label:'Week '+info.week};
  const out=[]; for(let k=6;k>=0;k--) out.push(iso(addDays(parseISO(TODAY),-k)));
  return {dates:out, label:'Last 7 days'};
}
/* n sets of a lift, added to a tally of {zone: sets} */
function setCredit(tally,id,n){
  const e=EX[id]; if(!e||!(n>0)) return;
  const prim=e.prim||[];
  prim.forEach(z=>{ tally[z]=(tally[z]||0)+n; });
  (e.sec||[]).forEach(z=>{ if(prim.indexOf(z)<0) tally[z]=(tally[z]||0)+n*0.5; });
}
/* what was logged on those days: sets with reps, the same sets the logbook and the Strength log count */
function weekDone(dates){
  const t={}, on={}; dates.forEach(d=>{ on[d]=1; });
  for(const id in S.logs) S.logs[id].forEach(e=>{ if(on[e.d]) setCredit(t,id,loggedSets(e).length); });
  return t;
}
function weekSets(dates){
  const on={}; dates.forEach(d=>{ on[d]=1; }); let n=0;
  for(const id in S.logs) if(EX[id]) S.logs[id].forEach(e=>{ if(on[e.d]) n+=loggedSets(e).length; });
  return n;
}
/* what the plan in force on each of those days asks for; a deload week asks for one set fewer on each lift */
function weekPlanned(dates){
  const t={};
  dates.forEach(ds=>{
    const info=infoForDate(ds);
    if(info&&info.type==='lift'&&info.session) info.session.items.forEach(it=>{ const n=+it.sets||3; setCredit(t,it.ex,info.deload?deloadSets(n):n); });
  });
  return t;
}
/* three steps of one colour: under 5 sets, 5 to 9, 10 or more */
function weekStep(v){ return !(v>0)?0:v<5?1:v<10?2:3; }
function fmtSets(v){ return String(Math.round(v*2)/2); }
function renderMuscleWeek(){
  const el=$('#muscleWeek'); if(!el) return;
  if(!Object.keys(S.logs).some(id=>EX[id])){ el.innerHTML=''; return; }       // nothing logged yet: no empty figure
  const span=weekSpan(), done=weekDone(span.dates), plan=weekPlanned(span.dates), n=weekSets(span.dates);
  const zones=Object.keys(ZN).filter(z=>done[z]>0||plan[z]>0)
    .sort((a,b)=>((plan[b]||0)-(plan[a]||0))||((done[b]||0)-(done[a]||0)));
  const step=zs=>{ const s=Math.max.apply(null,zs.map(z=>weekStep(done[z]))); return s?'v'+s:''; };
  let top=null; zones.forEach(z=>{ if(done[z]>0&&(top==null||done[z]>done[top])) top=z; });
  const todo=zones.filter(z=>plan[z]>0&&!(done[z]>0)).map(z=>ZN[z]);
  let line=n?('<b>'+n+(n===1?' set':' sets')+'</b> logged so far.'+(top?' Most: '+esc(ZN[top])+' ('+fmtSets(done[top])+').':''))
            :'Nothing logged yet this week.';
  if(todo.length) line+=' Not trained yet this week: '+esc(todo.slice(0,6).join(', '))+(todo.length>6?' and '+(todo.length-6)+' more':'')+'.';
  el.innerHTML='<div class="card"><div class="card-h"><h3>Muscles this week</h3><span class="pill cool">'+esc(span.label)+'</span></div>'
    +'<div class="maps mw"><div class="figs">'+bodyFigure('front',step)+bodyFigure('back',step)+'</div>'
    +'<div class="mkey mw-key"><span><i class="k"></i>none</span><span><i class="k v1"></i>under 5</span><span><i class="k v2"></i>5 to 9</span><span><i class="k v3"></i>10 or more</span></div></div>'
    +'<p class="mw-line">'+line+'</p>'
    +(zones.length?'<details class="mw-all"><summary><span class="how-t">Every muscle: sets done'+(Object.keys(plan).length?' of planned':'')+'</span><span class="chev">'+ICO.chev+'</span></summary>'
      +'<div class="mw-list">'+zones.map(z=>{
          const d=done[z]||0, p=plan[z]||0, pct=p?Math.min(100,Math.round(d/p*100)):(d?100:0);
          return '<div class="mw-row"><span class="mw-n">'+esc(ZN[z])+'</span><span class="pbar sm"><i style="width:'+pct+'%"></i></span>'
            +'<span class="mw-v num">'+fmtSets(d)+(p?' of '+fmtSets(p):'')+'</span></div>';
        }).join('')
      +'<p class="mw-note">A set counts once for the main muscle of a lift and as half a set for each muscle that helps.'+(Object.keys(plan).length?' "Planned" is what your plan asks for this week.':'')+'</p></div></details>':'')
    +'</div>';
}
