/* ===================================================================
   THE PLAN — which program, which days, what each day holds
   =================================================================== */
const BLOCK_DAYS=91;

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
    return (sw&&EX[sw]&&sw!==it.ex)?Object.assign({},it,{ex:sw,base:it.ex}):it;
  })}));
  _sessCache[key]={sig:sig, list:list};
  return list;
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

/* ---- computed targets ------------------------------------------- */
function targets(){
  const p=S.profile, w=p.w, h=p.h, a=p.age, act=p.act;
  const bmr=Math.round(10*w+6.25*h-5*a+(p.sex==='f'?-161:5));
  const tdee=Math.round(bmr*act);
  const factor={cut:0.8, recomp:0.9, maintain:1, gain:1.08}[p.goal]||1;
  const kcal=Math.round((tdee*factor)/10)*10;
  const prot=Math.round(w*2.1/5)*5;
  const fat=Math.round(w*0.8);
  const nLift=variant().sessions.length, nRest=Math.max(1,7-nLift);
  // training days carry the extra carbs; the week still averages to `kcal`
  const train=Math.round((kcal+80)/10)*10;
  const rest=Math.round(((kcal*7)-(train*nLift))/nRest/10)*10;
  const carbT=Math.max(0,Math.round((train-prot*4-fat*9)/4));
  const carbR=Math.max(0,Math.round((rest-prot*4-fat*9)/4));
  const shift={cut:-6, recomp:-3, maintain:0, gain:2}[p.goal]||0;
  const target90=Math.round((w+shift)*10)/10;
  const maxHR=220-a;
  return {bmr,tdee,kcal,cut:kcal,prot,fat,train,rest,carbT,carbR,target90,
          z2:[Math.round(maxHR*.6),Math.round(maxHR*.7)], w, goal:p.targetW};
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
function dayInfo(i){                       // i = 1..91
  const date=addDays(parseISO(S.profile.start), i-1);
  const wd=date.getDay(), week=Math.ceil(i/7);
  const phase=week<=4?1:week<=8?2:3;
  const ds=iso(date), pe=planOn(ds), days=sortDays(pe.days), li=days.indexOf(wd);
  let type='rest', idx=-1;
  if(li>=0){ type='lift'; idx=li; }
  else if(cardioDaysFor(days,phase).indexOf(wd)>=0) type='cardio';
  return {i, date:ds, wd, week, phase, type, idx,
          deload:(week===6||week===12), checkin:(wd===checkinDayFor(days)), session:idx>=0?sessionsOf(pe.program,pe.dpw)[idx]:null};
}
function todayIndex(){ return daysBetween(parseISO(S.profile.start), parseISO(TODAY))+1; }
function infoForDate(ds){
  const i=daysBetween(parseISO(S.profile.start), parseISO(ds))+1;
  return (i>=1&&i<=BLOCK_DAYS)?dayInfo(i):null;
}

/* ---- checklist -------------------------------------------------- */
function checkList(){
  const t=targets(), i=infoForDate(TODAY);
  const lifting=i&&i.type==='lift';
  const ft=foodTotals();   // live from the day counter, so the list reflects what you logged
  return [
    {k:'protein', l:'Hit protein',        h:(ft.p?Math.round(ft.p)+' / ':'')+t.prot+' g'},
    {k:'cals',    l:'Stay near calories', h:(ft.k?Math.round(ft.k)+' / ':'')+(lifting?t.train:t.rest)+' kcal'},
    {k:'steps',   l:'Walk',               h:'8–10k steps'},
    {k:'water',   l:'Water',              h:'3.5–4 L'},
    {k:'session', l:lifting?'Train':'Session or rest as planned', h:lifting?(i.session.name):'—'},
    {k:'sleep',   l:'Sleep 7–9 h',        h:'last night'},
    {k:'creatine',l:'Creatine',           h:'5 g'}
  ];
}
const CORE=['protein','steps','sleep'];
function dayDone(ds){
  const c=S.checks[ds]||[], i=infoForDate(ds);
  if(!CORE.every(k=>c.indexOf(k)>=0)) return false;
  if(i&&i.type==='lift'&&c.indexOf('session')<0) return false;
  return true;
}
function streak(){
  let n=0, d=parseISO(TODAY);
  if(!dayDone(iso(d))) d=addDays(d,-1);          // today still in progress
  for(let g=0; g<400; g++){ if(dayDone(iso(d))){n++; d=addDays(d,-1);} else break; }
  return n;
}
function sessionDone(ds){ return (S.checks[ds]||[]).indexOf('session')>=0; }
