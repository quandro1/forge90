/* ===================================================================
   STATE
   One object, S, saved to localStorage['forge90_v2'].

   Version 1 saved under 'forge90_v1'. It is read once, converted, and
   never written again, so the old copy stays exactly as it was on the
   day of the upgrade. Whatever is found in storage — v1, v2, partial,
   hand-edited, damaged — goes through normalize(), which always returns
   a valid v2 state and never throws.
   =================================================================== */
const KEY='forge90_v2', KEY_V1='forge90_v1', KEY_THEME='forge90_theme';
const DEFAULT_PROGRAM='vtaper';
const GOALS=['cut','recomp','maintain','gain'];

const DEFAULTS={
  v:2,
  profile:{sex:'m', age:25, h:175, w:75, act:1.45, goal:'recomp', targetW:null,
           program:DEFAULT_PROGRAM, dpw:0, days:[], start:TODAY, setup:false},
  checks:{}, weights:{}, waist:{}, steps:{}, meas:[], logs:{}, food:{}, cond:{}, shop:{}, swaps:{}, blocks:[],
  ui:{theme:'', diet:'train'}
};
function freshState(){ return normalize({v:2}); }

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
  else if(s.pre) o.pre=1;                    // copied from last time, not yet done
  return o;
}
function cleanLogs(m,legacy){
  const o={};
  if(!isObj(m)) return o;
  for(const id in m){
    if(!safeKey(id)||!Array.isArray(m[id])) continue;
    const seen={}, arr=[];
    for(const e of m[id]){
      if(!isObj(e)||!isDate(e.d)||seen[e.d]) continue;
      seen[e.d]=1;
      const o={d:e.d, sets:(Array.isArray(e.sets)?e.sets:[]).map(cleanSet)};
      if(e.dl) o.dl=1;
      // A row with reps but no weight takes the weight of the row above (version 1 showed it there in grey and never
      // stored it). On a bodyweight lift in version 2 an empty weight means no added weight, so it is left alone.
      if(!(EX[id]&&(EX[id].load==='time'||(EX[id].load==='bw'&&!legacy)))){ let lw=null; o.sets.forEach(s=>{ if(s.w!=null) lw=s.w; else if(s.r>0&&lw!=null) s.w=lw; }); }
      arr.push(o);
    }
    arr.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
    if(arr.length) o[id]=arr;
  }
  return o;
}
function normalize(p){
  if(!isObj(p)) p={v:2};
  const legacy=!(p.v>=2);
  const s=clone(DEFAULTS);
  s.profile=cleanProfile(p.profile,legacy);
  s.checks=dateMap(p.checks,a=>{
    if(!Array.isArray(a)) return undefined;
    const out=a.filter((x,i)=>typeof x==='string'&&/^[a-z0-9_-]{1,24}$/i.test(x)&&a.indexOf(x)===i);
    return out.length?out:undefined;
  });
  s.weights=dateMap(p.weights,v=>{ const n=numIn(v,30,300,null); return n==null?undefined:n; });   // the range a profile accepts
  s.waist  =dateMap(p.waist,  v=>{ const n=numIn(v,1,999,null); return n==null?undefined:n; });
  s.steps  =dateMap(p.steps,  v=>{ const n=numIn(v,0,500000,null); return n==null?undefined:n; });
  s.meas=(Array.isArray(p.meas)?p.meas:[]).filter(r=>isObj(r)&&isDate(r.d)).map(r=>{
    const o={d:r.d};
    ['waist','chest','sh','arm','thigh'].forEach(k=>{ const n=numIn(r[k],1,999,null); if(n!=null) o[k]=n; });
    return o;
  });
  s.logs=pruneLogs(cleanLogs(p.logs,legacy));
  if(legacy){        // version 1 prescribed a lighter week in weeks 6 and 12 but did not mark those sessions
    const st=parseISO(s.profile.start);
    for(const id in s.logs) s.logs[id].forEach(e=>{
      const n=daysBetween(st,parseISO(e.d)), wk=Math.floor(n/7)+1;
      if(n>=0&&n<BLOCK_DAYS&&(wk===6||wk===12)) e.dl=1;
    });
  }
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
  if(numIn(u.v1At,1,1e15,null)!=null) s.ui.v1At=+u.v1At;     // how much of the version 1 copy is already in here
  if(isObj(u.rest)&&typeof u.rest.id==='string'&&EX[u.rest.id]&&numIn(u.rest.end,1,1e15,null)!=null&&numIn(u.rest.total,1,1e8,null)!=null)
    s.ui.rest={id:u.rest.id, set:numIn(u.rest.set,-1,99,-1), end:+u.rest.end, total:+u.rest.total, slot:typeof u.rest.slot==='string'?u.rest.slot.slice(0,12):''};
  if(legacy) s.ui.from=1;                   // came from version 1 (shows the what-is-new note once)
  else if(u.from) s.ui.from=u.from===2?2:1;
  if(isDate(u.autoSess)) s.ui.autoSess=u.autoSess;
  if(isDate(u.dietOn)) s.ui.dietOn=u.dietOn;
  if(isObj(u.auto)&&isDate(u.auto.d)){
    const ks=x=>Array.isArray(x)?x.filter(k=>k==='protein'||k==='steps'):[];
    const a={d:u.auto.d, k:ks(u.auto.k), off:ks(u.auto.off)};
    if(a.k.length||a.off.length) s.ui.auto=a;
  }
  // plan history: which plan was in force from which date, so a change never re-judges the past
  s.plans=(Array.isArray(p.plans)?p.plans:[]).filter(x=>isObj(x)&&isDate(x.from)&&typeof x.program==='string'&&safeKey(x.program)
      &&PROGRAMS[x.program]&&PROGRAMS[x.program].variants[x.dpw]&&validDays(x.days,PROGRAMS[x.program].variants[x.dpw].sessions.length))
    .map(x=>({from:x.from, program:x.program, dpw:+x.dpw, days:x.days.slice()}))
    .sort((a,b)=>a.from<b.from?-1:a.from>b.from?1:0);
  const cur=s.profile, last=s.plans[s.plans.length-1];
  if(!last) s.plans.push({from:cur.start, program:cur.program, dpw:cur.dpw, days:cur.days.slice()});
  else if(last.program!==cur.program||last.dpw!==cur.dpw||last.days.join()!==cur.days.join())
    s.plans.push({from:last.from>TODAY?last.from:TODAY, program:cur.program, dpw:cur.dpw, days:cur.days.slice()});
  return s;
}
/* Two copies of the state that both changed (the app open twice): keep what
   either one has. Where both hold the same day, this copy's entry stays and the
   other fills its gaps. */
function mergeStates(theirs,mine){
  const out=clone(mine);
  ['weights','waist','steps','food','cond'].forEach(k=>{ for(const d in theirs[k]) if(!(d in out[k])) out[k][d]=theirs[k][d]; });
  for(const d in theirs.checks){
    const a=out.checks[d];
    if(!a) out.checks[d]=theirs.checks[d]; else theirs.checks[d].forEach(x=>{ if(a.indexOf(x)<0) a.push(x); });
  }
  for(const id in theirs.logs){
    const arr=out.logs[id]||(out.logs[id]=[]);
    theirs.logs[id].forEach(e=>{
      const m=arr.find(x=>x.d===e.d);
      if(!m){ arr.push(e); return; }
      e.sets.forEach((st,i)=>{
        if(i>=m.sets.length) m.sets.push(st);
        else if(blankSet(m.sets[i])&&!blankSet(st)) m.sets[i]=st;
      });
    });
    arr.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
  }
  theirs.meas.forEach(r=>{ const k=JSON.stringify(r); if(!out.meas.some(x=>JSON.stringify(x)===k)) out.meas.push(r); });
  for(const k in theirs.shop) out.shop[k]=true;
  for(const k in theirs.swaps) if(!(k in out.swaps)) out.swaps[k]=theirs.swaps[k];
  theirs.blocks.forEach(b=>{ if(!out.blocks.some(x=>x.start===b.start)) out.blocks.push(b); });
  return out;
}
/* A stray tap used to leave a dated-but-empty session behind, which then
   posed as "last time" forever. Past sessions with no numbers are not history. */
function pruneLogs(logs){
  for(const id in logs){
    logs[id]=logs[id].filter(x=>x.d>=TODAY||x.sets.some(s=>!s.pre&&(s.r>0||s.w!=null||s.done)));
    if(!logs[id].length) delete logs[id];
  }
  return logs;
}

/* ---- load ----------------------------------------------------------- */
const STATE_V=2, KEY_REV='forge90_v2_rev', KEY_DMG='forge90_v2_damaged';
let BOOT={migrated:false, write:false, damaged:false, newer:false};
let saveTimer=null, SAVE_OK=true;
let SAVE_HALT=false;                       // true when this copy must not write: a wipe or restore in flight, or newer data in storage
let DIRTY=false;                           // something changed here since the last write
let REV=0;                                 // revision of the stored state this copy last read or wrote
function readStore(key){
  try{ const raw=localStorage.getItem(key); return raw?JSON.parse(raw):null; }catch(e){ return null; }
}
function storedRev(){ try{ return +localStorage.getItem(KEY_REV)||0; }catch(e){ return 0; } }
function lsGet(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
function lsDrop(key){ try{ localStorage.removeItem(key); }catch(e){} }
/* when the version 1 copy on this phone was last saved (0 if there is none) */
function v1Stamp(v1){ return (isObj(v1)&&isObj(v1.ui))?numIn(v1.ui.savedAt,1,1e15,0):0; }
function load(){
  REV=storedRev();
  let raw=null, v2=null, bad=false;
  try{ raw=localStorage.getItem(KEY); }catch(e){}
  if(raw){ try{ v2=JSON.parse(raw); }catch(e){ bad=true; } if(!bad&&!isObj(v2)){ bad=true; v2=null; } }
  // Stored data that cannot be read is put aside before anything is written, so it can still be recovered by hand.
  if(bad){ try{ localStorage.setItem(KEY_DMG,raw); }catch(e){} BOOT.damaged=true; }
  // Data written by a newer version: show it as well as this version can, and never write over it.
  if(isObj(v2)&&v2.v>STATE_V){ BOOT.newer=true; SAVE_HALT=true; return normalize(v2); }
  const v1=readStore(KEY_V1), at=v1Stamp(v1);
  if(isObj(v2)&&v2.v>=2){
    const s=normalize(v2);
    // A copy of the earlier version that was still open kept saving under its own key.
    // Whatever it logged after the conversion is folded in here, once.
    if(at>(+s.ui.v1At||0)){ const m=mergeStates(normalize(v1),s); m.ui.v1At=at; BOOT.write=true; return m; }
    return s;
  }
  if(isObj(v1)){ BOOT.migrated=true; BOOT.write=true; const s=normalize(v1); if(at) s.ui.v1At=at; return s; }
  if(isObj(v2)){ BOOT.write=true; return normalize(v2); }
  return freshState();
}
let S=load();

/* ---- save -----------------------------------------------------------
   A copy of the app writes only when something changed in it. Before it
   writes, it checks whether another copy (a second tab, the installed app
   next to the browser tab) wrote in the meantime, and folds that in first:
   a stale copy can never wipe what a newer one logged. */
/* The stored state is gone although this copy has read or written one: it was erased in
   another copy of the app. This copy must not write its old data back; it starts again too. */
function erasedElsewhere(){
  if(SAVE_HALT||REV<1) return false;
  let raw='x'; try{ raw=localStorage.getItem(KEY); }catch(e){}
  if(raw!==null) return false;
  SAVE_HALT=true; location.reload(); return true;
}
function writeNow(){
  clearTimeout(saveTimer); saveTimer=null;
  if(SAVE_HALT||!DIRTY) return;
  if(erasedElsewhere()) return;
  try{
    const now=storedRev();
    if(now!==REV){
      const other=readStore(KEY);
      if(isObj(other)&&other.v>STATE_V){ SAVE_HALT=true; BOOT.newer=true; paintSaveState(); return; }
      if(isObj(other)&&other.v>=2){ S=mergeStates(normalize(other),S); STALE_VIEW=true; }
    }
    localStorage.setItem(KEY,JSON.stringify(S));
    REV=now+1; localStorage.setItem(KEY_REV,String(REV));
    DIRTY=false; SAVE_OK=true;
  }catch(e){ SAVE_OK=false; }
  paintSaveState();
}
/* Another copy wrote and this one has nothing unsaved: take the stored state. Returns true if S changed. */
let STALE_VIEW=false;
function adoptIfStale(){
  if(erasedElsewhere()) return false;
  if(SAVE_HALT||storedRev()===REV) return false;
  if(DIRTY){ writeNow(); return true; }
  const other=readStore(KEY);
  if(!isObj(other)||!(other.v>=2)) return false;
  if(other.v>STATE_V){ SAVE_HALT=true; BOOT.newer=true; paintSaveState(); return false; }
  S=normalize(other); REV=storedRev();
  return true;
}
function onStorage(e){
  // erased in another copy of the app (or all site data cleared): let go of the old data at once
  if((e.key===KEY&&e.newValue===null)||e.key===null){ if(!SAVE_HALT){ SAVE_HALT=true; location.reload(); } return; }
  if(e.key===KEY||e.key===KEY_REV) STALE_VIEW=true;
}
window.addEventListener('storage',onStorage);
function paintSaveState(){
  const sb=$('#saveBar'); if(sb) sb.classList.toggle('on',!SAVE_OK);
  const vb=$('#verBar'); if(vb) vb.classList.toggle('on',!!BOOT.newer);
}
/* quiet: housekeeping the app does by itself (dropping a finished rest, a tick it can see).
   It is written, but it does not make this copy look newer than one the user has changed since. */
function save(quiet){
  DIRTY=true;
  if(!quiet) S.ui.savedAt=Date.now();      // lets two copies of the state say which is newer
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
    const doc=db.doc('data/users/'+uid+'/state');
    const snap=await doc.get();
    const remote=snap.exists?snap.data():null;
    const remoteAt=remote?(+(remote.ui&&remote.ui.savedAt)||0):0, localAt=+(S.ui.savedAt)||0;
    CLOUD.doc=doc;                           // only now: nothing may upload before the two copies are compared
    if(remote&&remoteAt>localAt){
      S=normalize(clone(remote)); DIRTY=true; REV=storedRev(); writeNow();
      CLOUD.status='synced'; CLOUD.at=remoteAt;
      if(S.profile.setup&&SU) setupClose();  // the data arrived: no need to ask who this is
      rerenderAll();
    }else{
      CLOUD.status='synced'; CLOUD.at=localAt;
      if(localAt>remoteAt) cloudPush();      // this device has the newer log
    }
  }catch(e){ CLOUD.status='error'; }
  cloudBadge();
}
function cloudQueue(){
  if(!CLOUD.doc||SAVE_HALT) return;       // a copy that must not write locally must not upload either
  CLOUD.dirty=true; clearTimeout(CLOUD.timer);
  CLOUD.timer=setTimeout(cloudPush,1500);   // a burst of typing becomes one write
}
async function cloudPush(){
  if(!CLOUD.doc||CLOUD.busy||SAVE_HALT) return;
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
/* the theme also lives in its own small key, read before the first paint */
function rememberTheme(){ try{ localStorage.setItem(KEY_THEME,S.ui.theme||''); }catch(e){} }
function rerenderAll(){
  if(S.ui.theme) document.documentElement.setAttribute('data-theme',S.ui.theme);
  rememberTheme();
  const dl=$('#dayList'); if(dl) delete dl.dataset.plan;   // Train is cached per plan — invalidate
  setTab(currentTab,true);
}
