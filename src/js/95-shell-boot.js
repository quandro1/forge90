const PWA={prompt:null, installed:false, persist:null};
function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: minimal-ui)').matches
      || navigator.standalone===true;
}
function isIOS(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);   // iPadOS lies about its UA
}
/* the head tags are declared in the document, but a host that re-wraps the
   page can land them in the body where they are ignored — so ensure them. */
function ensureHeadTags(){
  const need=[
    ['link','rel','manifest',{href:'manifest.webmanifest'}],
    ['meta','name','theme-color',{content:themeColor()}],
    ['link','rel','apple-touch-icon',{href:'apple-touch-icon.png'}],
    ['meta','name','apple-mobile-web-app-capable',{content:'yes'}],
    ['meta','name','apple-mobile-web-app-status-bar-style',{content:'black-translucent'}],
    ['meta','name','apple-mobile-web-app-title',{content:'FORGE 90'}]
  ];
  need.forEach(([tag,attr,val,props])=>{
    let el=document.head.querySelector(tag+'['+attr+'="'+val+'"]');
    if(!el){ el=document.createElement(tag); el.setAttribute(attr,val); document.head.appendChild(el); }
    for(const k in props) if(!el.getAttribute(k)) el.setAttribute(k,props[k]);
  });
}
function themeColor(){
  const t=document.documentElement.getAttribute('data-theme');
  const light = t==='light' || (!t && !matchMedia('(prefers-color-scheme: dark)').matches);
  return light?'#EFF2F3':'#0D1317';
}
function paintThemeColor(){
  const m=document.head.querySelector('meta[name="theme-color"]');
  if(m) m.setAttribute('content',themeColor());
}
function registerSW(){
  if(!('serviceWorker' in navigator)) return;
  if(location.protocol!=='https:'&&location.hostname!=='localhost') return;   // file:// cannot host a worker
  navigator.serviceWorker.register('sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{
      const nw=reg.installing; if(!nw) return;
      nw.addEventListener('statechange',()=>{
        // only announce an update that replaces a copy already running
        if(nw.state==='installed'&&navigator.serviceWorker.controller) $('#updBar').classList.add('on');
      });
    });
  }).catch(()=>{});
}
function appBox(){
  const icon='<img src="icon-192.png" alt="" onerror="this.style.display=\'none\'">';
  if(PWA.installed||isStandalone())
    return '<div class="appbox"><div class="ai">'+icon+'<span class="at"><b>Installed.</b> '
      +'You are running FORGE 90 as an app — it opens from your home screen, fills the whole screen, '
      +'and works without a signal. '+(CLOUD.doc?'Your log still backs up to your account whenever you are online.':'Your log is kept on this phone — export a backup now and then.')+'</span></div></div>';
  if(PWA.prompt)
    return '<div class="appbox"><div class="ai">'+icon+'<span class="at"><b>Install it.</b> '
      +'Puts FORGE 90 on your home screen with its own icon, no browser bars, and it opens offline.</span></div>'
      +'<button class="btn primary wide" id="btnInstall" style="margin-top:11px">Install on this phone</button></div>';
  if(isIOS())
    return '<div class="appbox"><div class="ai">'+icon+'<span class="at"><b>Add it to your home screen.</b> '
      +'Safari does not offer a button for this, so it is three taps:</span></div>'
      +'<ol><li>Tap the <b>Share</b> icon at the bottom of Safari.</li>'
      +'<li>Scroll down and tap <b>Add to Home Screen</b>.</li>'
      +'<li>Tap <b>Add</b>. It gets its own icon and opens full-screen.</li></ol></div>';
  return '<div class="appbox"><div class="ai">'+icon+'<span class="at"><b>Add it to your home screen.</b> '
    +'Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>. '
    +'It then opens with its own icon, full-screen, and works offline.</span></div></div>';
}
function refreshAppBox(){
  const sheetOpen=$('#sheet')&&$('#sheet').classList.contains('on');
  if(!sheetOpen) return;
  const box=$('.appbox'); if(box) box.outerHTML=appBox();
}
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); PWA.prompt=e; refreshAppBox(); });
window.addEventListener('appinstalled',()=>{ PWA.installed=true; PWA.prompt=null; refreshAppBox(); });
/* Without this, a browser may evict localStorage to reclaim space — iOS
   clears it after ~7 days of not opening the site. Chrome grants it to an
   installed app automatically; Safari grants it on Add to Home Screen.
   It is the only thing protecting the log on a host with no cloud backup. */
async function requestPersistence(){
  try{
    if(!navigator.storage||!navigator.storage.persist){ PWA.persist='unsupported'; return; }
    if(await navigator.storage.persisted()){ PWA.persist='granted'; refreshStorageLine(); return; }
    PWA.persist = (await navigator.storage.persist()) ? 'granted' : 'best-effort';
  }catch(e){ PWA.persist='unsupported'; }
  refreshStorageLine();
}
function storageLine(){
  const p=PWA.persist;
  if(p==='granted')     return '<span class="pill good">Storage protected</span> This device will not quietly discard your log to save space.';
  if(p==='best-effort') return '<span class="pill warn">Storage is best-effort</span> Install the app (above) and the browser will protect it. Until then, export a backup now and then.';
  if(p==='unsupported') return '<span class="pill">Storage not reportable</span> This browser will not say whether it protects the log — keep an export.';
  return '<span class="pill">Checking storage…</span>';
}
function refreshStorageLine(){
  const el=$('#storageLine'); if(el) el.innerHTML=storageLine();
}
function paintOnline(){ document.documentElement.classList.toggle('offline', navigator.onLine===false); }
window.addEventListener('online',paintOnline);
window.addEventListener('offline',paintOnline);

/* ---- backup / restore / wipe --------------------------------------
   Outside claude.ai the log exists on this phone only, so a backup has to be one tap. "Back up now" hands
   the phone's share sheet a file (WhatsApp, Gmail, Drive ...). Share sheets take plain text but not the
   app's own .json, so that file is a .txt holding the same text, and Restore reads both. Where there is no
   share sheet, or the phone will not open it, the same button saves the file instead. */
function flash(btn,msg){                       // a word on the button for a moment, then its own label again
  if(!btn) return;
  if(!btn.dataset.label) btn.dataset.label=btn.textContent;
  btn.textContent=msg;
  clearTimeout(btn._flash);
  btn._flash=setTimeout(()=>{ if(btn.isConnected) btn.textContent=btn.dataset.label; },1800);
}
function backupName(ext){ return 'forge90-backup-'+TODAY+'.'+ext; }
function canShareFiles(){                      // can this phone's share sheet take a text file?
  if(typeof claude!=='undefined'&&claude.use) return false;       // inside claude.ai the viewer saves files
  try{ return !!(navigator.share&&navigator.canShare&&navigator.canShare({files:[new File(['{}'],'forge90-backup.txt',{type:'text/plain'})]})); }
  catch(e){ return false; }
}
/* when the last backup was made, in whole days before today (null: never) */
function backupAge(){ const at=+S.ui.bk||0; return at?Math.max(0,daysBetween(new Date(at),parseISO(TODAY))):null; }
function backupLine(){
  const age=backupAge();
  if(age==null) return '<span class="pill warn">No backup yet</span> A copy outside this phone is the only thing that survives a lost phone.';
  return '<span class="pill '+(age>=14?'warn':'good')+'">Last backup: '+(age===0?'today':age===1?'yesterday':age+' days ago')+'</span>'
    +(age>0?' '+esc(fmtDate(iso(new Date(+S.ui.bk))))+'.':'');
}
function markBackedUp(){
  S.ui.bk=Date.now(); delete S.ui.bkLater; save(true);
  const l=$('#bkLine'); if(l) l.innerHTML=backupLine();
  renderBackupCard();
}
async function backupNow(btn){
  if(canShareFiles()){
    try{
      const file=new File([JSON.stringify(S,null,2)],backupName('txt'),{type:'text/plain'});
      await navigator.share({files:[file], title:'FORGE 90 backup'});
      markBackedUp(); flash(btn,'Backed up'); return;
    }catch(err){
      if(err&&err.name==='AbortError'){ flash(btn,'Cancelled'); return; }      // the sheet was closed: nothing was sent
      // anything else: the phone would not open the sheet, so the file is saved instead
    }
  }
  return exportBackup(btn);
}
async function exportBackup(btn){
  const json=JSON.stringify(S,null,2), name=backupName('json');
  // published page: the viewer mediates the save. standalone file: ordinary download.
  let dl=null;
  try{ dl=(typeof claude!=='undefined'&&claude.use)?await claude.use('downloads'):null; }catch(err){ dl=null; }
  if(dl){
    try{ await dl.save({filename:name,data:json}); markBackedUp(); flash(btn,'Saved'); }
    catch(err){ flash(btn, err&&err.code==='declined'?'Cancelled':'Could not save'); }
    return;
  }
  try{
    const blob=new Blob([json],{type:'application/json'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },400);
    markBackedUp(); flash(btn,'Saved as a file');
  }catch(err){ flash(btn,'Could not save'); }
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-reload]')){ location.reload(); return; }
  if(e.target.id==='btnInstall'){
    const p=PWA.prompt; if(!p) return;
    e.target.disabled=true;
    p.prompt();
    p.userChoice.then(r=>{
      PWA.prompt=null;
      if(r&&r.outcome==='accepted') PWA.installed=true;
      refreshAppBox();
    }).catch(()=>{ e.target.disabled=false; });
    return;
  }
  if(e.target.id==='btnBackup'||e.target.closest('[data-bknow]')){ backupNow(e.target.closest('button')); return; }
  if(e.target.closest('[data-bklater]')){ S.ui.bkLater=TODAY; save(true); renderBackupCard(); return; }
  if(e.target.id==='btnExport'||e.target.closest('[data-export]')) exportBackup(e.target.closest('button'));
  if(e.target.id==='btnDmgExport'){
    const raw=lsGet(KEY_DMG)||'';
    try{ const blob=new Blob([raw],{type:'text/plain'}), url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download='forge90-unreadable-copy-'+TODAY+'.txt'; document.body.appendChild(a); a.click();
      setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },400); }catch(err){}
  }
  if(e.target.id==='btnDmgDrop'){ lsDrop(KEY_DMG); const n=$('#damagedNote'); if(n) n.remove(); }
  if(e.target.id==='btnImport'){
    const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,.txt,application/json,text/plain';   // a backup sent through the share sheet is a .txt
    inp.addEventListener('change',()=>{
      const f=inp.files[0]; if(!f) return;
      const r=new FileReader();
      r.onload=()=>{
        let p;
        try{
          const raw=JSON.parse(r.result);
          // only something that looks like a backup may replace what is on the device
          if(!isObj(raw)||!(isObj(raw.profile)||isObj(raw.logs)||isObj(raw.weights))) throw new Error('not a backup');
          p=normalize(raw);
        }catch(err){ e.target.textContent='Could not read that file'; return; }
        p.ui.savedAt=Date.now(); p.profile.setup=true;
        p.ui.bk=Date.now(); delete p.ui.bkLater;               // the file just read is a backup of exactly this state
        const at=v1Stamp(readStore(KEY_V1)); if(at) p.ui.v1At=at;      // a restore is not topped up from the old copy on this phone
        // The restored state becomes THE state before the page reloads: the save
        // that runs as a page closes would otherwise write the old one back.
        const before=S, wasDirty=DIRTY;
        S=p; DIRTY=true; REV=storedRev(); writeNow();      // a restore replaces what is stored: no merge
        if(!SAVE_OK){ S=before; DIRTY=wasDirty; e.target.textContent='Could not save it: storage is full or blocked'; return; }
        cloudQueue(); SAVE_HALT=true; location.reload();
      };
      r.readAsText(f);
    });
    inp.click();
  }
  if(e.target.id==='btnWipe'){
    if(e.target.dataset.armed){
      SAVE_HALT=true;                        // nothing may write the old state back while the page closes
      lsDrop(KEY); lsDrop(KEY_V1); lsDrop(KEY_DMG); lsDrop(KEY_REV); lsDrop(KEY_THEME);     // the revision goes too: the next copy starts from nothing
      const done=()=>location.reload();
      if(CLOUD.doc){ e.target.textContent='Erasing…'; CLOUD.doc.delete().then(done,done); } else done();
    }
    else{ e.target.dataset.armed='1'; e.target.textContent='Tap again to erase';
      setTimeout(()=>{ if(e.target){ delete e.target.dataset.armed; e.target.textContent='Erase everything'; } },4000); }
  }
});

/* ===================================================================
   BOOT
   =================================================================== */
(function init(){
  if(S.ui.theme) document.documentElement.setAttribute('data-theme',S.ui.theme);
  rememberTheme();
  if(BOOT.write){ DIRTY=true; writeNow(); }   // a converted or repaired state gets its own copy at once
  paintSaveState();
  ensureHeadTags(); paintThemeColor(); paintOnline(); registerSW(); requestPersistence();
  if(isStandalone()) document.documentElement.classList.add('standalone');
  if(history.state&&history.state.sheet){ try{ history.replaceState(null,''); }catch(e){} }   // a sheet step left over from before a reload
  // a rest timer that was running when the page closed picks up where it was
  const r=S.ui.rest;
  if(r&&EX[r.id]&&r.end>Date.now()){ RT={id:r.id,ref:r.slot||'',set:r.set,end:r.end,total:r.total,done:false,warned:r.end-Date.now()<=10000}; rtTick=setInterval(tickRest,250); wakeLock(true); }
  else if(r){ delete S.ui.rest; save(true); }
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState!=='visible') return;
    // a new training day began while the app was away: start it clean (never in the middle of a rest)
    const resting=RT&&!RT.done&&RT.end>Date.now();           // only a rest still counting down may hold the day
    if(dayOf(new Date())!==TODAY&&!resting){ writeNow(); location.reload(); return; }
    if(RT&&!RT.done){ tickRest(); wakeLock(true); }
    // another copy of the app wrote while this one was away: show its data
    if(adoptIfStale()||STALE_VIEW){ STALE_VIEW=false; const a=document.activeElement; if(!(a&&a.closest&&a.closest('.logger'))) rerenderAll(); }
  });
  const h=location.hash.slice(1);
  if(TABS.indexOf(h)>=0) setTab(h,true); else renderToday();
  if(RT) paintRest(true);
  segSync();
  // A new person is asked who they are before a plan is shown. Inside claude.ai the saved copy may be
  // in the cloud, so the question waits for that answer first.
  const cloud=cloudInit();
  if(!S.profile.setup&&!BOOT.newer){
    if(typeof claude!=='undefined'&&claude.use) cloud.then(()=>{ if(!S.profile.setup&&!SU) setupOpen(); });
    else setupOpen();
  }
  const flush=()=>{ saveNow(); if(CLOUD.dirty||CLOUD.timer){ clearTimeout(CLOUD.timer); cloudPush(); } };
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') flush(); });
  window.addEventListener('pagehide',flush);
  window.addEventListener('hashchange',()=>{
    const n=location.hash.slice(1);
    if(TABS.indexOf(n)>=0&&n!==currentTab) setTab(n,true);
  });
})();

