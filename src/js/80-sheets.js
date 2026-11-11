const sheet=$('#sheet');
function openSheet(title,html){
  $('#sheetTitle').textContent=title;
  $('#sheetBody').innerHTML=html;
  sheet.classList.add('on');
  document.body.style.overflow='hidden';
}
function closeSheet(){ sheet.classList.remove('on'); document.body.style.overflow=''; }
sheet.addEventListener('click',e=>{ if(e.target.closest('[data-close]')) closeSheet(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&sheet.classList.contains('on')) closeSheet(); });

function guideSheet(){
  openSheet('Reference', GUIDE.map((g,i)=>
    '<details'+(i===0?' open':'')+'><summary><span class="idx">'+String(i+1).padStart(2,'0')+'</span>'
    +esc(g.t)+'<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'+g.b+'</div></details>').join(''));
  const t=targets();
  if($('#g-bmr')){
    $('#g-bmr').textContent=t.bmr.toLocaleString()+' kcal';
    $('#g-act').textContent='× '+S.profile.act;
    $('#g-tdee').textContent=t.tdee.toLocaleString()+' kcal';
    $('#g-cut').textContent=t.cut.toLocaleString()+' kcal';
  }
}
/* ---- exercise library ------------------------------------------- */
const GROUPS=['Chest','Back','Shoulders','Arms','Legs','Core'];
function libSheet(){
  openSheet('Exercise library',
    '<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:12px">Every movement in both programs. Not sure which one a name refers to? Open <b>Photos</b> for stills or <b>Video</b> for a demo — both search live, so the links never go dead.</p>'
    +'<input class="search" id="libSearch" type="search" placeholder="Search a movement…" aria-label="Search exercises">'
    +'<div class="seg" id="libSeg" style="margin-top:10px" role="group" aria-label="Filter by muscle group">'
    +'<button data-g="all" class="on">All</button>'
    +GROUPS.map(g=>'<button data-g="'+g+'">'+g.slice(0,5)+'</button>').join('')+'</div>'
    +'<div id="libList" style="margin-top:12px"></div>');
  libRender('all','');
  $('#libSearch').addEventListener('input',e=>{
    libRender($('#libSeg button.on').dataset.g, e.target.value);
  });
}
function exGroup(id){
  for(const g in EXGROUP) if(EXGROUP[g].indexOf(id)>=0) return g;
  return 'Other';
}
function libRender(g,q){
  q=(q||'').trim().toLowerCase();
  const ids=Object.keys(EX).filter(id=>EX[id]&&EX[id].cue)
    .filter(id=>g==='all'||exGroup(id)===g)
    .filter(id=>!q||EX[id].name.toLowerCase().indexOf(q)>=0||(EX[id].tag||'').toLowerCase().indexOf(q)>=0);
  if(!ids.length){ $('#libList').innerHTML='<p style="color:var(--text-faint);font-size:13px;padding:14px 0">Nothing matches that.</p>'; return; }
  const by={};
  ids.forEach(id=>{ const k=exGroup(id); (by[k]||(by[k]=[])).push(id); });
  $('#libList').innerHTML=GROUPS.concat(['Other']).filter(k=>by[k]).map(k=>
    '<div class="eyebrow" style="margin:14px 0 7px">'+k+'</div>'
    +by[k].map(id=>{
      const e=EX[id];
      return '<div class="libitem"><div class="li-h"><span class="li-n">'+esc(e.name)+'</span>'
        +'<span class="li-t">'+esc(e.sets)+' × '+esc(e.reps)+'</span></div>'
        +'<div class="mtags" style="margin-top:6px"><span class="pill hot">'+esc(e.tag)+'</span></div>'
        +'<p class="li-c">'+e.cue+'</p>'
        +(AVOID[id]?'<p class="li-a"><b>Avoid:</b> '+AVOID[id]+'</p>':'')
        +demoLinks(e.name,true)+'</div>';
    }).join('')).join('');
}

function settingsSheet(){
  const p=S.profile;
  openSheet('Your numbers',
    '<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:14px">Every target in the app recalculates from these. Change one and the whole plan follows.</p>'
    +'<div class="card">'
    +srow('Start date','start','date',p.start)
    +srow('Bodyweight (kg)','w','number',p.w)
    +srow('Height (cm)','h','number',p.h)
    +srow('Age','age','number',p.age)
    +'<div class="frow"><label for="f-act">Activity outside the gym</label><select id="f-act" data-prof="act">'
      +[['1.35','Desk-bound, under 5k steps'],['1.45','Lifting + 8k steps'],['1.55','Lifting + 10k steps'],['1.65','On your feet all day']]
        .map(o=>'<option value="'+o[0]+'"'+(String(p.act)===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')
    +'</select></div>'
    +srow('Long-term goal (kg)','goal','number',p.goal)
    +'</div>'
    +'<div class="sec"><div class="eyebrow">Split</div><div class="seg" id="setSplit">'
    +'<button data-split="five"'+(p.split==='five'?' class="on"':'')+'>5-Day</button>'
    +'<button data-split="four"'+(p.split==='four'?' class="on"':'')+'>4-Day</button></div></div>'
    +'<div class="sec"><div class="eyebrow">App</div>'+appBox()+'</div>'
    +'<div class="sec"><div class="eyebrow">Data</div>'
    +'<p style="font-size:12.5px;color:var(--text-dim);margin-bottom:8px">'+(CLOUD.doc||CLOUD.status==='connecting'
        ?'Everything you log is saved on this device and backed up privately to your Claude account, so a cleared browser or a second phone picks up where you left off.'
        :'Everything you log lives in this browser only — nothing is sent anywhere. Clearing site data or using a different device starts you fresh, so export before you switch.')+'</p>'
    +'<p style="margin-bottom:8px"><span id="cloudBadge" class="pill"></span></p>'
    +'<p id="storageLine" style="font-size:12.5px;color:var(--text-dim);margin-bottom:10px">'+storageLine()+'</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="btnExport">Export a backup</button>'
    +'<button class="btn" id="btnImport">Restore</button>'
    +'<button class="btn danger" id="btnWipe">Erase everything</button></div></div>');
  cloudBadge();
}
function srow(label,key,type,val){
  return '<div class="frow"><label for="f-'+key+'">'+esc(label)+'</label>'
    +'<input class="num" id="f-'+key+'" data-prof="'+key+'" type="'+type+'" value="'+esc(val)+'"'
    +(type==='number'?' step="'+(key==='w'?'0.5':'1')+'" inputmode="decimal"':'')+'></div>';
}
function daySheet(i){
  const d=dayInfo(i), t=targets();
  let body='<div class="readout" style="margin-bottom:14px">'
    +ro('Day',i,'of 91',true)+ro('Week',d.week,d.deload?'deload':'')+ro('Phase',d.phase,PHASES[d.phase-1].name)+'</div>';
  if(d.type==='lift'){
    body+='<div class="session"><div class="tag">'+esc(d.session.tag)+'</div><h3>'+esc(d.session.name)+'</h3>'
      +'<p class="focus">'+esc(d.session.focus)+'</p></div>'
      +'<div class="tw" style="margin-top:12px"><table><thead><tr><th>Exercise</th><th class="n">Sets × reps</th><th class="n">Rest</th></tr></thead><tbody>'
      +d.session.ex.map(id=>EX[id]?'<tr><td>'+esc(EX[id].name)+'</td><td class="n">'+esc(EX[id].sets)+' × '+esc(EX[id].reps)+'</td><td class="n">'+esc(EX[id].rest)+'</td></tr>':'').join('')
      +'</tbody></table></div>';
    if(d.deload) body+='<div class="note hot" style="margin-top:12px"><b>Deload week.</b> Same exercises, cut the load about 10% and drop a set or two. You should leave the gym feeling you could have done much more. Skipping deloads is how intermediates stall for months.</div>';
  }else if(d.type==='cardio'){
    body+='<div class="session rest"><div class="tag">Conditioning</div><h3>Zone 2 &amp; steps</h3>'
      +'<p class="focus">'+esc(condToday(d))+' at '+t.z2[0]+'–'+t.z2[1]+' bpm. Incline walk, bike or elliptical — low joint cost, legs stay fresh.</p></div>';
  }else{
    body+='<div class="session rest"><div class="tag">Rest</div><h3>Nothing to lift</h3>'
      +'<p class="focus">Walk, hit protein, sleep long. Muscle is built on these days, not in the gym.</p></div>';
  }
  if(d.checkin) body+='<div class="note" style="margin-top:12px"><b>Weekly check-in.</b> Log the 7-day average weight, waist at the navel, photos front/side/back in the same light, and your key lifts. Judge on trends, act only on 2–3 weeks of them.</div>';
  openSheet(fmtDate(d.date), body);
}

/* ===================================================================
   EVENTS
   =================================================================== */
