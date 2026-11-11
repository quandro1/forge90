/* ===================================================================
   STATE
   One object, S, saved to localStorage['forge90_v2'].

   Version 1 saved under 'forge90_v1'. It is read once, converted, and
   never written again, so the old copy stays exactly as it was on the
   day of the upgrade. Whatever is found in storage — v1, v2, partial,
   hand-edited, damaged — goes through normalize(), which always returns
   a valid v2 state and never throws.
   =================================================================== */
const KEY='forge90_v2', KEY_V1='forge90_v1';
const DEFAULT_PROGRAM='vtaper';
const GOALS=['cut','recomp','maintain','gain'];

const DEFAULTS={
  v:2,
  profile:{sex:'m', age:25, h:175, w:75, act:1.45, goal:'recomp', targetW:null,
           program:DEFAULT_PROGRAM, dpw:0, days:[], start:TODAY, setup:false},
  checks:{}, weights:{}, waist:{}, steps:{}, meas:[], logs:{}, food:{}, cond:{}, shop:{}, swaps:{}, blocks:[],
  ui:{theme:'', diet:'train'}
};
function freshState(){ const s=clone(DEFAULTS); s.profile=cleanProfile({},false); return s; }

/* ---- normalize: any stored shape -> a valid v2 state --------------- */
const numIn=(v,lo,hi,def)=>{
  if(v==null||v===''||typeof v==='boolean'||typeof v==='object') return def;
  const n=+v; return (isFinite(n)&&n>=lo&&n<=hi)?n:def;
};
const safeKey=k=>typeof k==='string'&&k.length>0&&k.length<=120&&k!=='__proto__'&&k!=='constructor'&&k!=='prototype';
function dateMap(m,fn){
  const o={};
  if(isObj(m)) for(const k in m){ if(!isDate(k)) continue; const v=fn(m[k]); if(v!==undefined) o[k]=v; }
  return o;
}
function validDays(d,n){
  return Array.isArray(d)&&d.length===n&&d.every(x=>Number.isInteger(x)&&x>=0&&x<=6)&&new Set(d).size===n;
}
function cleanProfile(pr,legacy){
  pr=isObj(pr)?pr:{};
  const d=DEFAULTS.profile, o={};
  o.sex = pr.sex==='f'?'f':'m';
  o.age = numIn(pr.age,13,95, legacy?23:d.age);
  o.h   = numIn(pr.h,120,230, legacy?180:d.h);
  o.w   = numIn(pr.w,30,300, legacy?88:d.w);
  o.act = numIn(pr.act,1.2,2.0, 1.45);
  o.goal = legacy?'cut':(GOALS.indexOf(pr.goal)>=0?pr.goal:d.goal);
  o.targetW = numIn(legacy?pr.goal:pr.targetW,30,300,null);
  o.program = (!legacy&&typeof pr.program==='string'&&safeKey(pr.program)&&PROGRAMS[pr.program])?pr.program:DEFAULT_PROGRAM;
  const P=PROGRAMS[o.program], want=legacy?(pr.split==='four'?4:5):+pr.dpw;
  o.dpw = P.variants[want]?want:P.def;
  const v=P.variants[o.dpw];
  o.days = (!legacy&&validDays(pr.days,v.sessions.length))?pr.days.slice():v.days.slice();
  o.start = isDate(pr.start)?pr.start:TODAY;
  o.setup = legacy?true:!!pr.setup;
  return o;
}
function cleanSet(s){
  const o={};
  if(!isObj(s)) return o;
  const w=numIn(s.w,0,2000,null), r=numIn(s.r,0,100000,null);
  if(w!=null) o.w=w;
  if(r!=null) o.r=r;
  if(s.done) o.done=1;
  return o;
}
function cleanLogs(m){
  const o={};
  if(!isObj(m)) return o;
  for(const id in m){
    if(!safeKey(id)||!Array.isArray(m[id])) continue;
    const seen={}, arr=[];
    for(const e of m[id]){
      if(!isObj(e)||!isDate(e.d)||seen[e.d]) continue;
      seen[e.d]=1;
      arr.push({d:e.d, sets:(Array.isArray(e.sets)?e.sets:[]).map(cleanSet)});
    }
    arr.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
    if(arr.length) o[id]=arr;
  }
  return o;
}
function normalize(p){
  if(!isObj(p)) return freshState();
  const legacy=!(p.v>=2);
  const s=clone(DEFAULTS);
  s.profile=cleanProfile(p.profile,legacy);
  s.checks=dateMap(p.checks,a=>{
    if(!Array.isArray(a)) return undefined;
    const out=a.filter((x,i)=>typeof x==='string'&&/^[a-z0-9_-]{1,24}$/i.test(x)&&a.indexOf(x)===i);
    return out.length?out:undefined;
  });
  s.weights=dateMap(p.weights,v=>{ const n=numIn(v,1,999,null); return n==null?undefined:n; });
  s.waist  =dateMap(p.waist,  v=>{ const n=numIn(v,1,999,null); return n==null?undefined:n; });
  s.steps  =dateMap(p.steps,  v=>{ const n=numIn(v,0,500000,null); return n==null?undefined:n; });
  s.meas=(Array.isArray(p.meas)?p.meas:[]).filter(r=>isObj(r)&&isDate(r.d)).map(r=>{
    const o={d:r.d};
    ['waist','chest','sh','arm','thigh'].forEach(k=>{ const n=numIn(r[k],1,999,null); if(n!=null) o[k]=n; });
    return o;
  });
  s.logs=pruneLogs(cleanLogs(p.logs));
  s.food=dateMap(p.food,a=>{
    if(!Array.isArray(a)) return undefined;
    const out=a.filter(isObj).map(x=>({n:String(x.n==null?'':x.n).slice(0,80), k:numIn(x.k,0,20000,0), p:numIn(x.p,0,2000,0), c:numIn(x.c,0,5000,0), f:numIn(x.f,0,2000,0)}));
    return out.length?out:undefined;
  });
  s.cond=dateMap(p.cond,a=>{
    if(!Array.isArray(a)) return undefined;
    const out=a.filter(x=>x==='z2'||x==='hiit');
    return out.length?out:undefined;
  });
  if(isObj(p.shop)) for(const k in p.shop) if(safeKey(k)&&p.shop[k]) s.shop[k]=true;
  if(isObj(p.swaps)) for(const k in p.swaps){ const id=p.swaps[k]; if(safeKey(k)&&typeof id==='string'&&safeKey(id)&&EX[id]) s.swaps[k]=id; }
  s.blocks=(Array.isArray(p.blocks)?p.blocks:[]).filter(b=>isObj(b)&&isDate(b.start)&&isDate(b.end)).map(b=>({
    program:String(b.program||'').slice(0,40), name:String(b.name||'').slice(0,60), dpw:numIn(b.dpw,1,7,0), start:b.start, end:b.end,
    w0:numIn(b.w0,1,999,null), w1:numIn(b.w1,1,999,null), done:numIn(b.done,0,999,0), planned:numIn(b.planned,0,999,0)
  }));
  const u=isObj(p.ui)?p.ui:{};
  s.ui.theme=(u.theme==='light'||u.theme==='dark')?u.theme:'';
  s.ui.diet=u.diet==='rest'?'rest':'train';
  if(u.helpSeen) s.ui.helpSeen=1;
  if(numIn(u.savedAt,1,1e15,null)!=null) s.ui.savedAt=+u.savedAt;
  if(isObj(u.rest)&&typeof u.rest.id==='string'&&EX[u.rest.id]&&numIn(u.rest.end,1,1e15,null)!=null&&numIn(u.rest.total,1,1e8,null)!=null)
    s.ui.rest={id:u.rest.id, set:numIn(u.rest.set,-1,99,-1), end:+u.rest.end, total:+u.rest.total, slot:typeof u.rest.slot==='string'?u.rest.slot.slice(0,12):''};
  if(legacy) s.ui.from=1;                   // came from version 1 (shows the what-is-new note once)
  else if(u.from) s.ui.from=u.from===2?2:1;
  return s;
}
/* A stray tap used to leave a dated-but-empty session behind, which then
   posed as "last time" forever. Past sessions with no numbers are not history. */
function pruneLogs(logs){
  for(const id in logs){
    logs[id]=logs[id].filter(x=>x.d===TODAY||x.sets.some(s=>s.r>0||s.w!=null));
    if(!logs[id].length) delete logs[id];
  }
  return logs;
}

/* ---- load ----------------------------------------------------------- */
let BOOT={migrated:false, write:false};
function readStore(key){
  try{ const raw=localStorage.getItem(key); return raw?JSON.parse(raw):null; }catch(e){ return null; }
}
function load(){
  const v2=readStore(KEY);
  if(isObj(v2)&&v2.v>=2) return normalize(v2);
  const v1=readStore(KEY_V1);
  if(isObj(v1)){ BOOT.migrated=true; BOOT.write=true; return normalize(v1); }
  if(isObj(v2)){ BOOT.write=true; return normalize(v2); }
  return freshState();
}
let S=load();

/* ---- save ----------------------------------------------------------- */
let saveTimer=null, SAVE_OK=true;
let SAVE_HALT=false;                       // set just before a wipe or a restore reloads the page
function writeNow(){
  clearTimeout(saveTimer); saveTimer=null;
  if(SAVE_HALT) return;
  try{ localStorage.setItem(KEY,JSON.stringify(S)); SAVE_OK=true; }
  catch(e){ SAVE_OK=false; }
  if(typeof paintSaveState==='function') paintSaveState();
}
function save(){
  S.ui.savedAt=Date.now();                 // lets two copies of the state say which is newer
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{ writeNow(); cloudQueue(); },160);
}
/* The debounce above is a 160 ms window in which a rep you just typed is in
   memory only. Anything that can end the page's life must land the write first. */
function saveNow(){ writeNow(); cloudQueue(); }

/* ---- cloud copy (published claude.ai page only) -------------------
   localStorage is the fast local copy, and the only copy everywhere
   except inside claude.ai, where the same state is also mirrored to the
   viewer's private db document so a cleared browser or a second device
   never loses the log. Newer savedAt wins. */
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
      S=normalize(clone(remote));
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
  try{ await CLOUD.doc.set(clone(S)); CLOUD.status='synced'; CLOUD.at=+(S.ui.savedAt)||Date.now(); }
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
  const dl=$('#dayList'); if(dl) delete dl.dataset.plan;   // Train is cached per plan — invalidate
  setTab(currentTab,true);
}
