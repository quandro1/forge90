/* ===================================================================
   THE PLAN — which program, which days, what each day holds
   =================================================================== */
function program(){ return PROGRAMS[S.profile.program]||PROGRAMS[DEFAULT_PROGRAM]; }
function variantKeys(p){ return Object.keys(p.variants).map(Number).sort((a,b)=>a-b); }
function variant(){ const p=program(); return p.variants[S.profile.dpw]||p.variants[p.def]; }
/* weekdays in week order, Monday first */
function sortDays(d){ return d.slice().sort((a,b)=>((a+6)%7)-((b+6)%7)); }
/* the weekdays you lift on now */
function trainDays(){
  const v=variant(), d=S.profile.days;
  return sortDays(validDays(d,v.sessions.length)?d:v.days);
}
function planKey(){ return S.profile.program+'/'+variant().sessions.length; }
function slotKey(si,k){ return planKey()+'/'+si+'/'+k; }
/* The plan in force on a date. A change of plan applies from the day it is made:
   the past keeps the plan it was trained under, so streaks and sessions done never move. */
function planOn(ds){
  const pl=S.plans; let cur=pl[0];
  for(const e of pl){ if(e.from<=ds) cur=e; else break; }
  return cur;
}
function setPlan(prog,dpw,days){
  S.profile.program=prog; S.profile.dpw=dpw; S.profile.days=days.slice();
  const from=S.profile.start>TODAY?S.profile.start:TODAY, last=S.plans[S.plans.length-1];
  const entry={from:from, program:prog, dpw:dpw, days:days.slice()};
  if(last&&last.from>=from) S.plans[S.plans.length-1]=entry; else S.plans.push(entry);
}
/* a plan's sessions in week order, with any exercise you have swapped in applied */
const _sessCache={};
function sessionsOf(prog,dpw){
  const P=PROGRAMS[prog]||PROGRAMS[DEFAULT_PROGRAM], v=P.variants[dpw]||P.variants[P.def];
  const key=(PROGRAMS[prog]?prog:DEFAULT_PROGRAM)+'/'+v.sessions.length, sig=JSON.stringify(S.swaps||{});
  const c=_sessCache[key];
  if(c&&c.sig===sig) return c.list;
  const list=v.sessions.map((s,si)=>Object.assign({},s,{items:s.items.map((it,k)=>{
    const sw=S.swaps&&S.swaps[key+'/'+si+'/'+k];
    return (sw&&EX[sw]&&sw!==it.ex)?swapItem(it,sw):it;
  })}));
  _sessCache[key]={sig:sig, list:list};
  return list;
}
/* Another exercise in a slot keeps the slot's number of sets. It keeps the reps and rest too when it is
   the same kind of lift; when it is not (seconds against reps, a small lift for a big one, a heavy lift
   for a medium one, a dumbbell or machine lift in a 3-5 rep barbell slot) it takes its own, so nobody is told to plank for 12 reps
   or to goblet squat a 5-rep maximum. "Each side" always follows the exercise that is actually done. */
function swapItem(it,sw){
  const o=Object.assign({},it,{ex:sw,base:it.ex}), a=EX[it.ex], b=EX[sw], t=b.typ;
  const misfit=(!!it.hold!==!!t.hold)||a.kind!==b.kind||a.band!==b.band||(Array.isArray(it.reps)&&it.reps[1]<=5&&b.load!=='bb');
  if(misfit){ delete o.hold; delete o.reps; if(t.hold) o.hold=t.hold.slice(); else o.reps=t.reps.slice(); o.rest=t.rest; }
  if(t.each) o.each=true; else delete o.each;
  return o;
}
function sessions(){ return sessionsOf(S.profile.program,S.profile.dpw); }
/* "2.3" -> {si,k,it} for the third item of the second session */
function slotAt(ref){
  const p=String(ref||'').split('.'), si=+p[0], k=+p[1], s=sessions()[si];
  return (s&&s.items[k])?{si, k, it:s.items[k], ref:si+'.'+k}:null;
}

/* ---- how an item is prescribed, as text ---------------------------- */
function repText(it){
  let s;
  if(it.hold) s=it.hold[0]+'–'+it.hold[1]+' s';
  else if(it.reps==='amrap') s='max reps';
  else if(Array.isArray(it.reps)) s=it.reps[0]+'–'+it.reps[1];
  else s=String(it.reps);
  return s+(it.each?' each side':'');
}
function repRange(it){                     // [low, high] in reps or seconds; null when it is "as many as you can"
  if(it.hold) return [it.hold[0],it.hold[1]];
  if(Array.isArray(it.reps)) return [it.reps[0],it.reps[1]];
  if(typeof it.reps==='number') return [it.reps,it.reps];
  return null;
}
function restText(sec){
  sec=+sec||90;
  if(sec<120) return sec+' s';
  return sec%60===0?(sec/60)+' min':Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')+' min';
}
function rxText(it){ return it.sets+' × '+repText(it); }

/* ---- computed targets -------------------------------------------
   Energy: the Mifflin-St Jeor resting burn x activity, then the goal:
     lose fat        a fifth under, never faster than 1% of bodyweight a week
     lose slowly     a tenth under
     stay            what you burn
     build muscle    8% over, kept between 150 and 400 kcal
   and never under 1,200 kcal a day (women) or 1,500 (men).
   No deficit is set for anyone under 18 or under a healthy weight (BMI 18.5):
   they are given what they burn, and told why.
   Protein per kilo by goal (2.1 / 2.0 / 1.6 / 1.8 g) on bodyweight capped at
   BMI 27, so extra bodyweight does not inflate it; never more than two-fifths
   of a rest day's calories, so carbs keep a place on a small day; never under
   1.6 g per kilo. Fat is at least 0.8 g per kilo of that same weight and a
   fifth of calories. Carbs are what is left.
   Rest days sit 200 kcal under the average and training days make it up, so
   the week still averages to the target, and no day goes under the floor. */
function noDeficit(){
  const p=S.profile;
  if(p.goal!=='cut'&&p.goal!=='recomp') return '';
  if(p.age<18) return 'age';
  if(p.w/(p.h*p.h/10000)<18.5) return 'bmi';
  return '';
}
function targets(){
  const p=S.profile, w=p.w, h=p.h, a=p.age, guard=noDeficit(), g=guard?'maintain':p.goal;
  const bmr=Math.round(10*w+6.25*h-5*a+(p.sex==='f'?-161:5));
  const tdee=Math.round(bmr*p.act);
  const floor=p.sex==='f'?1200:1500;
  let delta=0;
  if(g==='cut') delta=-Math.min(tdee*0.2, w*11);
  else if(g==='recomp') delta=-tdee*0.1;
  else if(g==='gain') delta=Math.max(150,Math.min(400,tdee*0.08));
  let kcal=Math.round((tdee+delta)/10)*10, floored=false;
  if(kcal<floor){ kcal=floor; floored=true; }
  const ref=Math.min(w, 27*h*h/10000);
  const nLift=variant().sessions.length, nRest=Math.max(1,7-nLift);
  const rest=Math.max(floor, Math.round((kcal-200)/10)*10);
  const train=Math.round((kcal+(kcal-rest)*nRest/nLift)/10)*10;
  const perKg={cut:2.1, recomp:2.0, maintain:1.6, gain:1.8}[g]||1.8;
  const prot=Math.round(Math.max(ref*1.6, Math.min(ref*perKg, rest*0.4/4))/5)*5;
  const fat=Math.round(Math.max(ref*0.8, kcal*0.2/9));
  const carbT=Math.max(0,Math.round((train-prot*4-fat*9)/4));
  const carbR=Math.max(0,Math.round((rest-prot*4-fat*9)/4));
  // expected change: 7,700 kcal to a kilo, less a tenth for the days that do not go to plan
  const weekly=(kcal-tdee)*7/7700*0.9;
  // where the block is heading, from the weight it began at (not from the weight in Settings today)
  const inBlock=weightList().filter(x=>x[0]>=p.start), startW=inBlock.length?inBlock[0][1]:w;
  let target90=Math.round((startW+weekly*13)*2)/2;
  if(weekly<0) target90=Math.max(target90, Math.min(startW, Math.ceil(18.5*h*h/10000*2)/2));   // never under a healthy weight
  const hrMax=208-0.7*a;                           // Tanaka, Monahan & Seals 2001
  // litres: 35 ml per kilo plus half a litre for training, on the same capped weight, kept between 2 and 4.5
  const water=Math.max(2,Math.min(4.5,Math.round((ref*0.035+0.5)*2)/2));
  return {bmr,tdee,kcal,cut:kcal,prot,fat,train,rest,carbT,carbR,target90,startW,weekly,floor,floored,guard,water,
          z2:[Math.round(hrMax*.6),Math.round(hrMax*.7)], w, goal:p.targetW};
}

/* ---- the 91-day schedule ---------------------------------------- */
/* the weekly check-in falls on Sunday, or on your last rest day if you lift on Sundays */
function checkinDayFor(days){
  for(const wd of [0,6,5,4,3,2,1]) if(days.indexOf(wd)<0) return wd;
  return 0;
}
function checkinDay(){ return checkinDayFor(trainDays()); }
/* rest days that carry Zone 2: the first ones of the week, as many as the phase asks for */
function cardioDays(phase){ return cardioDaysFor(trainDays(),phase); }
function cardioDaysFor(days,phase){
  const ci=checkinDayFor(days), want=(COND[phase]&&+COND[phase].z2)||2, out=[];
  for(const wd of [1,2,3,4,5,6,0]){ if(days.indexOf(wd)<0&&wd!==ci&&out.length<want) out.push(wd); }
  return out;
}
/* ---- deload weeks: weeks 6 and 12, unless this block's one was skipped by hand ---- */
function dlState(){
  const d=S.ui.dl;
  return (d&&d.start===S.profile.start)?d:{start:S.profile.start, off:[], seen:[]};
}
function dlSkipped(week){ return dlState().off.indexOf(week)>=0; }
function dlSeen(week){ return dlState().seen.indexOf(week)>=0; }
function dlMark(list,week,on){
  const d=dlState();
  d[list]=d[list].filter(x=>x!==week); if(on) d[list].push(week);
  if(d.off.length||d.seen.length) S.ui.dl=d; else delete S.ui.dl;
}
/* Train normally in a deload week, or take the deload again.
   Skipping: a session already logged that week counts as a normal one when it was not easier than the last
   normal session (heavier, or the same weight with about the same reps on as many sets; today's session may
   still be in progress, so it is compared set for set). A session that really was easier keeps its mark and is
   still not a number to beat. Rows that were only planned for the deload go with the mark.
   Taking it again: a logbook of today with nothing logged in it is a deload session again. */
function setDeloadSkipped(week,skip){
  dlMark('off',week,skip);
  const unplan=e=>{ e.sets=e.sets.map(s=>planned(s)?{}:s); };
  if(!skip){
    for(const id in S.logs){
      const e=S.logs[id].find(x=>x.d===TODAY);
      if(e&&!e.dl&&!loggedSets(e).length){ e.dl=1; unplan(e); }
    }
    return;
  }
  const from=iso(addDays(parseISO(S.profile.start),(week-1)*7)), to=iso(addDays(parseISO(S.profile.start),week*7-1));
  for(const id in S.logs){
    const arr=S.logs[id];
    arr.forEach((e,i)=>{
      if(!e.dl||e.d<from||e.d>to) return;
      const mine=judged(e,99), before=arr.slice(0,i).filter(x=>!x.dl&&loggedSets(x).length), ref=before.length?before[before.length-1]:null;
      const was=ref?judged(ref,99):[], tot=r=>r.reduce((a,s)=>a+s.r,0), mw=workWeight(mine), rw=workWeight(was);
      const full=e.d===TODAY||mine.length>=was.length;
      if(!mine.length||!ref||mw>rw||(mw===rw&&full&&tot(mine)>=tot(was.slice(0,mine.length))*0.9)){ delete e.dl; unplan(e); }
    });
  }
}
function dayInfo(i){                       // i = 1..91
  const date=addDays(parseISO(S.profile.start), i-1);
  const wd=date.getDay(), week=Math.ceil(i/7);
  const phase=week<=4?1:week<=8?2:3;
  const ds=iso(date), pe=planOn(ds), days=sortDays(pe.days), li=days.indexOf(wd);
  let type='rest', idx=-1;
  if(li>=0){ type='lift'; idx=li; }
  else if(cardioDaysFor(days,phase).indexOf(wd)>=0) type='cardio';
  return {i, date:ds, wd, week, phase, type, idx,
          deload:(DELOAD_WEEKS.indexOf(week)>=0&&!dlSkipped(week)), checkin:(wd===checkinDayFor(days)), session:idx>=0?sessionsOf(pe.program,pe.dpw)[idx]:null};
}
function todayIndex(){ return daysBetween(parseISO(S.profile.start), parseISO(TODAY))+1; }
function infoForDate(ds){
  const i=daysBetween(parseISO(S.profile.start), parseISO(ds))+1;
  return (i>=1&&i<=BLOCK_DAYS)?dayInfo(i):null;
}

/* ---- checklist -------------------------------------------------- */
function checkList(ds){
  ds=ds||TODAY;
  const t=targets(), i=infoForDate(ds), now=ds===TODAY;
  const lifting=i&&i.type==='lift';
  const ft=foodTotalsOn(ds);   // live from the day counter, so the list reflects what you logged
  const kc=(now?dietType()==='train':lifting)?t.train:t.rest, st=i?stepsTarget(i.week):8000, walked=S.steps[ds];
  return [
    {k:'protein', l:'Hit protein',        h:(ft.p?Math.round(ft.p)+' / ':'')+t.prot+' g'},
    {k:'cals',    l:'Stay near calories', h:(ft.k?Math.round(ft.k)+' / ':'')+kc+' kcal'},
    {k:'steps',   l:'Walk',               h:(walked?walked.toLocaleString()+' / ':'')+st.toLocaleString()+' steps'},
    {k:'water',   l:'Water',              h:'about '+t.water+' L'},
    {k:'session', l:lifting?'Train':'Session or rest as planned', h:lifting?(i.session.name):'—'},
    {k:'sleep',   l:'Sleep 7–9 h',        h:now?'last night':'the night before'},
    {k:'creatine',l:'Creatine',           h:'3–5 g, if you take it'}
  ].filter(x=>x.k!=='creatine'||S.profile.age>=18);        // not a supplement for under-18s
}
/* Ticks the app can see for itself: protein from the day counter, steps from the step log.
   S.ui.auto remembers which of today's ticks it made (k) and which you took off by hand (off),
   so a tick you made is never removed and one you removed is never put back. True if anything changed. */
function syncAuto(){
  const t=targets(), i=infoForDate(TODAY);
  const reached={protein:foodTotals().p>=t.prot, steps:(+S.steps[TODAY]||0)>=(i?stepsTarget(i.week):8000)};
  const au=S.ui.auto&&S.ui.auto.d===TODAY?S.ui.auto:{k:[],off:[]};
  let mine=(au.k||[]).slice(), arr=(S.checks[TODAY]||[]).slice(), changed=!!(S.ui.auto&&S.ui.auto.d!==TODAY);
  const off=au.off||[];
  ['protein','steps'].forEach(k=>{
    const has=arr.indexOf(k)>=0, own=mine.indexOf(k)>=0;
    if(reached[k]&&!has&&off.indexOf(k)<0){ arr.push(k); mine.push(k); changed=true; }
    else if(!reached[k]&&has&&own){ arr=arr.filter(x=>x!==k); mine=mine.filter(x=>x!==k); changed=true; }
    else if(!has&&own){ mine=mine.filter(x=>x!==k); changed=true; }
  });
  if(!changed) return false;
  if(arr.length) S.checks[TODAY]=arr; else delete S.checks[TODAY];
  if(mine.length||off.length) S.ui.auto={d:TODAY, k:mine, off:off.slice()}; else delete S.ui.auto;
  return true;
}
/* a tick changed by hand today: from now on the app leaves that one alone */
function manualTick(k,nowOn){
  if(k!=='protein'&&k!=='steps') return;
  const au=S.ui.auto&&S.ui.auto.d===TODAY?S.ui.auto:{k:[],off:[]};
  const mine=(au.k||[]).filter(x=>x!==k), off=(au.off||[]).filter(x=>x!==k);
  if(!nowOn) off.push(k);
  if(mine.length||off.length) S.ui.auto={d:TODAY, k:mine, off:off}; else delete S.ui.auto;
}
const CORE=['protein','steps','sleep'];
function dayDone(ds){
  const c=S.checks[ds]||[], i=infoForDate(ds);
  if(!CORE.every(k=>c.indexOf(k)>=0)) return false;
  // a lifting day also needs its session: of this block, or of a block that came before it
  const lift=i?i.type==='lift':(S.blocks.some(b=>b.start<=ds&&ds<=b.end)&&planOn(ds).days.indexOf(parseISO(ds).getDay())>=0);
  if(lift&&c.indexOf('session')<0) return false;
  return true;
}
function streak(){
  let n=0, d=parseISO(TODAY);
  if(!dayDone(iso(d))) d=addDays(d,-1);          // today still in progress
  for(let g=0; g<400; g++){ if(dayDone(iso(d))){n++; d=addDays(d,-1);} else break; }
  return n;
}
function sessionDone(ds){ return (S.checks[ds]||[]).indexOf('session')>=0; }
