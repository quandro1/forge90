const KEY='forge90_v1';
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.prototype.slice.call((r||document).querySelectorAll(s));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ---- date helpers (local, no timezone drift) -------------------- */
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parseISO=s=>{const p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x;};
const daysBetween=(a,b)=>Math.round((parseISO(iso(b))-parseISO(iso(a)))/86400000);
const TODAY=iso(new Date());
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const fmtDate=s=>{const d=parseISO(s);return DOW[d.getDay()]+' '+d.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];};

/* ---- state ------------------------------------------------------ */
const DEFAULTS={
  profile:{start:TODAY, w:88, h:180, age:23, act:1.45, goal:75, split:'five'},
  checks:{}, weights:{}, waist:{}, steps:{}, meas:[], logs:{}, food:{}, cond:{},
  ui:{theme:'', diet:'train'}
};
let S=load();
function mergeState(p){                    // any stored shape onto DEFAULTS
  const d=JSON.parse(JSON.stringify(DEFAULTS));
  for(const k in d) if(p[k]!==undefined) d[k]=(typeof d[k]==='object'&&!Array.isArray(d[k]))?Object.assign(d[k],p[k]):p[k];
  return d;
}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw) return JSON.parse(JSON.stringify(DEFAULTS));
    return pruneLogs(mergeState(JSON.parse(raw)));
  }catch(e){ return JSON.parse(JSON.stringify(DEFAULTS)); }
}
/* A stray tap used to leave a dated-but-empty session behind, which then
   posed as "last time" forever. Past sessions with no reps are not history. */
function pruneLogs(st){
  const logs=st.logs||{};
  for(const id in logs){
    logs[id]=(logs[id]||[]).filter(x=>x && x.d===TODAY ? true
      : (x && (x.sets||[]).some(s=>s&&(s.r>0||s.w!=null))));
    if(!logs[id].length) delete logs[id];
  }
  return st;
}
let saveTimer=null;
function writeNow(){
  clearTimeout(saveTimer); saveTimer=null;
  try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){}
}
function save(){
  S.ui.savedAt=Date.now();                 // lets two copies of the state say which is newer
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{ writeNow(); cloudQueue(); },160);
}
/* The debounce above is a 160 ms window in which a rep you just typed is in
   memory only. Lock the phone inside that window and it was gone. Anything
   that can end the page's life must land the write first. */
function saveNow(){ writeNow(); cloudQueue(); }

/* ---- cloud copy (published page only) ----------------------------
   localStorage is the fast local copy and the only copy in the
   standalone file. On the hosted page the same state is also mirrored
   to the viewer's private db document (data/users/<id>/state — nobody
   else, owner included, can read it), so a browser that clears site
   data, or a second device, never loses the log. Newer savedAt wins. */
const CLOUD={doc:null, timer:null, busy:false, dirty:false, status:'local', at:0};
async function cloudInit(){
  if(typeof claude==='undefined'||!claude.use) return;
  CLOUD.status='connecting'; cloudBadge();
  try{
    const db=await claude.use('db'), user=db?await claude.use('user'):null;
    const uid=user?await user.id():null;
    if(!db||!uid){ CLOUD.status='local'; cloudBadge(); return; }
    CLOUD.doc=db.doc('data/users/'+uid+'/state');
    const snap=await CLOUD.doc.get();
    const remote=snap.exists?snap.data():null;
    const remoteAt=remote?(+(remote.ui&&remote.ui.savedAt)||0):0, localAt=+(S.ui.savedAt)||0;
    if(remote&&remoteAt>localAt){
      S=mergeState(JSON.parse(JSON.stringify(remote)));
      try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){}
      CLOUD.status='synced'; CLOUD.at=remoteAt; rerenderAll();
    }else{
      CLOUD.status='synced'; CLOUD.at=localAt;
      if(localAt>remoteAt) cloudPush();      // this device has the newer log
    }
  }catch(e){ CLOUD.status='error'; }
  cloudBadge();
}
function cloudQueue(){
  if(!CLOUD.doc) return;
  CLOUD.dirty=true; clearTimeout(CLOUD.timer);
  CLOUD.timer=setTimeout(cloudPush,1500);   // a burst of typing becomes one write
}
async function cloudPush(){
  if(!CLOUD.doc||CLOUD.busy) return;
  CLOUD.busy=true; CLOUD.dirty=false; clearTimeout(CLOUD.timer);
  try{ await CLOUD.doc.set(JSON.parse(JSON.stringify(S))); CLOUD.status='synced'; CLOUD.at=+(S.ui.savedAt)||Date.now(); }
  catch(e){ CLOUD.status='error'; }
  CLOUD.busy=false; cloudBadge();
  if(CLOUD.dirty) cloudQueue();            // something changed mid-write
}
function cloudBadge(){
  const el=$('#cloudBadge'); if(!el) return;
  const t=CLOUD.at?new Date(CLOUD.at):null, hm=t?String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0'):'';
  el.className='pill '+(CLOUD.status==='synced'?'good':CLOUD.status==='error'?'warn':'');
  el.textContent=CLOUD.status==='synced'?'Backed up to your account · '+hm
    :CLOUD.status==='connecting'?'Connecting…'
    :CLOUD.status==='error'?'Backup failed — kept on this device'
    :'This device only';
}
function rerenderAll(){
  if(S.ui.theme) document.documentElement.setAttribute('data-theme',S.ui.theme);
  $$('#dietSeg button').forEach(b=>b.classList.toggle('on', b.dataset.diet===S.ui.diet));
  const dl=$('#dayList'); if(dl) delete dl.dataset.split;   // Train is cached per split — invalidate
  setTab(currentTab,true);
}

/* ---- computed targets ------------------------------------------- */
function targets(){
  const p=S.profile, w=+p.w||88, h=+p.h||180, a=+p.age||23, act=+p.act||1.45;
  const bmr=Math.round(10*w+6.25*h-5*a+5);
  const tdee=Math.round(bmr*act);
  const cut=Math.round((tdee*0.8)/10)*10;
  const prot=Math.round(w*2.1/5)*5;
  const fat=Math.round(w*0.8);
  const nLift=PROGRAMS[p.split].days.length, nRest=7-nLift;
  // training days carry the extra carbs; the week still averages to `cut`
  const train=Math.round((cut+80)/10)*10;
  const rest=Math.round(((cut*7)-(train*nLift))/nRest/10)*10;
  const carbT=Math.max(0,Math.round((train-prot*4-fat*9)/4));
  const carbR=Math.max(0,Math.round((rest-prot*4-fat*9)/4));
  const target90=Math.round((w-6)*10)/10;
  const maxHR=220-a;
  return {bmr,tdee,cut,prot,fat,train,rest,carbT,carbR,target90,
          z2:[Math.round(maxHR*.6),Math.round(maxHR*.7)], w, goal:+p.goal||75};
}

/* ---- the 91-day schedule ---------------------------------------- */
function prog(){ return PROGRAMS[S.profile.split]; }
function dayInfo(i){                       // i = 1..91
  const date=addDays(parseISO(S.profile.start), i-1);
  const wd=date.getDay(), week=Math.ceil(i/7);
  const phase=week<=4?1:week<=8?2:3;
  const p=prog(), li=p.days.indexOf(wd);
  let type='rest', idx=-1;
  if(li>=0){ type='lift'; idx=li; }
  else if(wd===6||wd===3) type='cardio';
  return {i, date:iso(date), wd, week, phase, type, idx,
          deload:(week===6||week===12), checkin:(wd===0), session:idx>=0?p.list[idx]:null};
}
function todayIndex(){ return daysBetween(parseISO(S.profile.start), new Date())+1; }
function infoForDate(ds){
  const i=daysBetween(parseISO(S.profile.start), parseISO(ds))+1;
  return (i>=1&&i<=91)?dayInfo(i):null;
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
  let n=0, d=new Date();
  if(!dayDone(iso(d))) d=addDays(d,-1);          // today still in progress
  for(let g=0; g<400; g++){ if(dayDone(iso(d))){n++; d=addDays(d,-1);} else break; }
  return n;
}
function sessionDone(ds){ return (S.checks[ds]||[]).indexOf('session')>=0; }

/* ===================================================================
   RENDER — TODAY
   =================================================================== */
const ICO={
  tick:'<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  up:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  hold:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  dot:'<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="12" cy="12" r="3.5"/></svg>'
};

