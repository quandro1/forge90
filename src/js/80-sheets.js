/* ===================================================================
   SHEET
   =================================================================== */
const sheet=$('#sheet');
function openSheet(title,html){
  $('#sheetTitle').textContent=title;
  $('#sheetBody').innerHTML=html;
  sheet.classList.add('on');
  document.body.style.overflow='hidden';
  // an open sheet is one step of history, so the phone's Back button closes it instead of leaving the app
  if(!(history.state&&history.state.sheet)){ try{ history.pushState({sheet:1},''); }catch(e){} }
}
function hideSheet(){ sheet.classList.remove('on'); document.body.style.overflow=''; PICK=null; }
let sheetBack=0;                 // history steps this code is taking back itself
function closeSheet(){
  hideSheet();
  if(history.state&&history.state.sheet){ sheetBack++; try{ history.back(); }catch(e){ sheetBack--; } }
}
window.addEventListener('popstate',()=>{
  // in first-run set-up the Back button goes to the step before
  if(SU&&SU.step>1&&!sheet.classList.contains('on')){ SU.err=''; SU.step--; setupDraw(); return; }
  if(sheetBack>0){
    sheetBack--;
    // a sheet opened again before the step back landed keeps a step of its own
    if(sheet.classList.contains('on')){ try{ history.pushState({sheet:1},''); }catch(e){} }
  }else if(sheet.classList.contains('on')&&!(history.state&&history.state.sheet)) hideSheet();
  // the step underneath may carry an older tab: keep the address on the tab that is showing
  if(TABS.indexOf(location.hash.slice(1))>=0&&location.hash.slice(1)!==currentTab){ try{ history.replaceState(history.state,'','#'+currentTab); }catch(e){} }
});
sheet.addEventListener('click',e=>{ if(e.target.closest('[data-close]')) closeSheet(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&sheet.classList.contains('on')) closeSheet(); });

function guideSheet(){
  openSheet('Reference', GUIDE.map((g,i)=>
    '<details'+(i===0?' open':'')+'><summary><span class="idx">'+String(i+1).padStart(2,'0')+'</span>'
    +esc(g.t)+'<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'+(typeof g.b==='function'?g.b():g.b)+'</div></details>').join(''));
}
/* what a deload week is, with the switch for the one in progress */
function deloadSheet(){
  const di=todayIndex(), info=(di>=1&&di<=BLOCK_DAYS)?dayInfo(di):null, wk=info?info.week:0, live=DELOAD_WEEKS.indexOf(wk)>=0;
  const p='<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:9px">';
  openSheet('Deload weeks', deloadText()
    +(live?'<div class="sec">'+(dlSkipped(wk)
        ?p+'You chose to train normally in week '+wk+'. Sessions you log now count as normal ones.</p><button class="btn wide" data-dlback>Make week '+wk+' a deload week again</button>'
        :p+'This is week '+wk+': a deload week. If you train normally instead, sessions already logged this week at your usual weight and reps count as normal ones, and easier ones stay marked as deload.</p><button class="btn wide" data-dlskip>Train normally this week</button>')
      +'</div>':''));
}
/* ---- exercise library ------------------------------------------- */
const GROUPS=['Chest','Back','Shoulders','Arms','Legs','Glutes','Core'];
function libSheet(){
  const have=GROUPS.filter(g=>Object.keys(EX).some(id=>EX[id].group===g));
  openSheet('Exercise library',
    '<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:12px">Every movement in the app. Not sure which one a name refers to? Open <b>Photos</b> for stills or <b>Video</b> for a demo — both search live, so the links never go dead.</p>'
    +'<input class="search" id="libSearch" type="search" placeholder="Search a movement or a muscle…" aria-label="Search exercises">'
    +'<div class="seg wrap" id="libSeg" style="margin-top:10px" role="group" aria-label="Filter by muscle group">'
    +'<button data-g="all" class="on">All</button>'
    +have.map(g=>'<button data-g="'+g+'">'+g+'</button>').join('')+'</div>'
    +'<div id="libList" style="margin-top:12px"></div>');
  libRender('all','');
  $('#libSearch').addEventListener('input',e=>{
    libRender($('#libSeg button.on').dataset.g, e.target.value);
  });
  // a guide is only built when someone opens it
  $('#libList').addEventListener('toggle',e=>{
    const d=e.target;
    if(d&&d.classList&&d.classList.contains('how')&&d.open&&!d.dataset.filled){
      $('.how-b',d).innerHTML=formNotes(d.dataset.how,true)+mapsFor(EX[d.dataset.how])+howTo(d.dataset.how); d.dataset.filled='1';
    }
  },true);
}
function exGroup(id){ return GROUPS.indexOf(EX[id].group)>=0?EX[id].group:'Other'; }
function libRender(g,q){
  q=(q||'').trim().toLowerCase();
  const hit=e=>!q||[e.name,e.tag,e.equip].concat((e.prim||[]).map(k=>ZN[k]||k),(e.sec||[]).map(k=>ZN[k]||k))
    .some(s=>String(s||'').toLowerCase().indexOf(q)>=0);
  const ids=Object.keys(EX).filter(id=>(g==='all'||exGroup(id)===g)&&hit(EX[id]));
  if(!ids.length){ $('#libList').innerHTML='<p style="color:var(--text-faint);font-size:13px;padding:14px 0">Nothing matches that.</p>'; return; }
  const by={};
  ids.forEach(id=>{ const k=exGroup(id); (by[k]||(by[k]=[])).push(id); });
  $('#libList').innerHTML=GROUPS.concat(['Other']).filter(k=>by[k]).map(k=>
    '<div class="eyebrow" style="margin:14px 0 7px">'+k+'</div>'
    +by[k].map(id=>{
      const e=EX[id];
      return '<div class="libitem"><div class="li-h"><span class="li-n">'+esc(e.name)+'</span>'
        +'<span class="li-t">'+esc(rxText(e.typ))+'</span></div>'
        +'<div class="mtags" style="margin-top:6px">'
        +(e.prim||[]).map(z=>'<span class="pill hot">'+esc(ZN[z]||z)+'</span>').join('')+bandPill(e)+'</div>'
        +'<p class="li-c">'+e.cue+'</p>'
        +demoLinks(e.name,true)
        +'<details class="how" data-how="'+id+'"><summary><span class="how-t">How to do it</span><span class="chev">'+ICO.chev+'</span></summary><div class="how-b"></div></details>'
        +'</div>';
    }).join('')).join('');
}

function settingsSheet(){
  const p=S.profile, P=program(), keys=variantKeys(P);
  const sel=(key,opts,cur)=>'<select id="f-'+key+'" data-prof="'+key+'">'
    +opts.map(o=>'<option value="'+o[0]+'"'+(String(cur)===String(o[0])?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';
  openSheet('Your numbers',
    '<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:14px">Every target in the app recalculates from these. Change one and the whole plan follows.</p>'
    +'<div class="card">'
    +srow('Start date','start','date',p.start)
    +'<div class="frow"><label for="f-sex">Sex</label>'+sel('sex',[['m','Male'],['f','Female']],p.sex)+'</div>'
    +srow('Bodyweight (kg)','w','number',p.w)
    +srow('Height (cm)','h','number',p.h)
    +srow('Age','age','number',p.age)
    +'<div class="frow"><label for="f-act">Activity outside the gym</label>'
      +sel('act',[['1.35','Mostly sitting'],['1.45','Some walking'],['1.55','A lot of walking'],['1.65','On my feet all day']],p.act)+'</div>'
    +'<div class="frow"><label for="f-goal">Goal</label>'
      +sel('goal',[['cut','Lose fat'],['recomp','Lose fat slowly, build muscle'],['maintain','Stay at this weight'],['gain','Build muscle']],p.goal)+'</div>'
    +srow('Target weight (kg), optional','targetW','number',p.targetW==null?'':p.targetW)
    +'</div>'
    +'<div class="sec"><div class="eyebrow">Plan</div>'
    +'<p style="font-size:13.5px;margin-bottom:9px"><b>'+esc(P.name)+'</b> <span style="color:var(--text-dim)">— '+esc(P.line)+'</span></p>'
    +'<button class="btn wide" data-pickplan style="margin-bottom:9px">Choose another target, or change your days</button>'
    +(keys.length>1?'<div class="seg" id="setDpw" role="group" aria-label="Days a week">'
      +keys.map(k=>'<button data-dpw="'+k+'"'+(k===+p.dpw?' class="on"':'')+'>'+k+' days a week</button>').join('')+'</div>':'')
    +'</div>'
    +'<div class="sec"><div class="eyebrow">App</div>'+appBox()+'</div>'
    +'<div class="sec"><div class="eyebrow">Data</div>'
    +'<p style="font-size:12.5px;color:var(--text-dim);margin-bottom:8px">'+(CLOUD.doc||CLOUD.status==='connecting'
        ?'Everything you log is saved on this device and backed up privately to your Claude account, so a cleared browser or a second phone picks up where you left off.'
        :'Everything you log lives in this browser only — nothing is sent anywhere. Clearing site data or using a different device starts you fresh, so export a backup now and then.')+'</p>'
    +'<p style="margin-bottom:8px"><span id="cloudBadge" class="pill"></span></p>'
    +(lsGet(KEY_DMG)?'<div id="damagedNote" class="note hot" style="margin-bottom:10px"><b>Some saved data could not be read.</b><br>A copy of it was put aside so it is not lost. '
      +'<span style="display:flex;gap:8px;margin-top:8px"><button class="btn sm" id="btnDmgExport">Save that copy as a file</button><button class="btn sm danger" id="btnDmgDrop">Discard it</button></span></div>':'')
    +'<p id="storageLine" style="font-size:12.5px;color:var(--text-dim);margin-bottom:10px">'+storageLine()+'</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="btnExport">Export a backup</button>'
    +'<button class="btn" id="btnImport">Restore</button>'
    +'<button class="btn danger" id="btnWipe">Erase everything</button></div></div>'
    +'<p class="credits">The body drawing in "How to do it" is from MuscleMap by Jsplice, used under the MIT licence.</p>');
  cloudBadge();
}
function srow(label,key,type,val){
  return '<div class="frow"><label for="f-'+key+'">'+esc(label)+'</label>'
    +'<input class="num" id="f-'+key+'" data-prof="'+key+'" type="'+type+'" value="'+esc(val)+'"'
    +(type==='number'?' step="'+(key==='w'||key==='targetW'?'0.5':'1')+'" inputmode="decimal"':'')+'></div>';
}
function daySheet(i){
  const d=dayInfo(i), t=targets();
  let body='<div class="readout" style="margin-bottom:14px">'
    +ro('Day',i,'of '+BLOCK_DAYS,true)+ro('Week',d.week,d.deload?'deload':'')+ro('Phase',d.phase,PHASES[d.phase-1].name)+'</div>';
  if(d.type==='lift'){
    body+='<div class="session"><div class="tag">'+esc('Day '+(d.idx+1)+' · '+d.session.tag)+'</div><h3>'+esc(d.session.name)+'</h3>'
      +'<p class="focus">'+esc(d.session.focus)+'</p></div>'
      +'<div class="tw" style="margin-top:12px"><table><thead><tr><th>Exercise</th><th class="n">Sets × reps</th><th class="n">Rest</th></tr></thead><tbody>'
      +d.session.items.map(it=>EX[it.ex]?'<tr><td>'+esc(EX[it.ex].name)+'</td><td class="n">'+esc(rxText(it))+'</td><td class="n">'+esc(restText(it.rest))+'</td></tr>':'').join('')
      +'</tbody></table></div>';
    if(d.deload) body+='<div class="note hot" style="margin-top:12px"><b>Deload week.</b> A planned easy week: the same exercises with about a tenth less weight (10%), one set fewer, and every set stopped early. You should leave the gym feeling you could have done much more. <button class="lkbtn" data-dlwhy>What is this?</button></div>';
  }else if(d.type==='cardio'){
    body+='<div class="session rest"><div class="tag">Conditioning</div><h3>Zone 2 &amp; steps</h3>'
      +'<p class="focus">'+esc(condToday(d))+' at '+t.z2[0]+'–'+t.z2[1]+' bpm. Incline walk, bike or elliptical — low joint cost, legs stay fresh.</p></div>';
  }else{
    body+='<div class="session rest"><div class="tag">Rest</div><h3>Nothing to lift</h3>'
      +'<p class="focus">Walk, hit protein, sleep long. Muscle is built on these days, not in the gym.</p></div>';
  }
  if(d.date<TODAY){            // a day that has passed: what was ticked, still open to correction
    const c=S.checks[d.date]||[];
    body+='<div class="card" style="margin-top:14px"><div class="frow"><label for="dayWeight">Weight that morning (kg)</label>'
      +'<input class="num" id="dayWeight" data-dayweight="'+d.date+'" type="text" inputmode="decimal" autocomplete="off" placeholder="none" value="'+(S.weights[d.date]!=null?esc(S.weights[d.date]):'')+'"></div></div>'
      +'<div class="eyebrow" style="margin:16px 0 7px">What you did that day · tap to correct</div><div class="checks">'
      +checkList(d.date).map(x=>chkButton(x, c.indexOf(x.k)>=0, 'data-daychk="'+x.k+'" data-date="'+d.date+'"')).join('')+'</div>';
  }
  if(d.checkin) body+='<div class="note" style="margin-top:12px"><b>Weekly check-in.</b> Log the 7-day average weight, waist at the navel, photos front/side/back in the same light, and your key lifts. Judge on trends, act only on 2–3 weeks of them.</div>';
  openSheet(fmtDate(d.date), body);
}
