/* ===================================================================
   SET-UP — first run, choosing a target, training days, the next block
   =================================================================== */
const WEEK=[1,2,3,4,5,6,0];                        // Monday first
function nextMonday(){ const d=parseISO(TODAY); return iso(addDays(d,((8-d.getDay())%7)||7)); }
function blockState(){ const di=todayIndex(); return di<1?'before':di>BLOCK_DAYS?'done':'active'; }
/* a session's length from its sets, reps and rests (the same model tools/validate.mjs uses) */
function sessionMinutes(s){
  const work=it=>(it.hold?(it.hold[0]+it.hold[1])/2:((it.reps[0]+it.reps[1])/2)*3.5)*(it.each?2:1);
  return Math.round((s.items.reduce((t,it)=>t+it.sets*(work(it)+it.rest)+90,0)+600)/60/5)*5;
}
function weekHtml(P,k){
  const V=P.variants[k];
  return '<div class="eyebrow" style="margin:12px 0 6px">'+k+' days a week</div><ol class="steps">'
    +V.sessions.map(s=>'<li><b>'+esc(s.name)+'</b> — '+s.items.length+' exercises, about '+sessionMinutes(s)+' min<br>'
      +'<span style="color:var(--text-faint)">'+s.items.map(it=>esc(EX[it.ex].name)).join(' · ')+'</span></li>').join('')+'</ol>';
}
function planCardHtml(pid,opts){
  const P=PROGRAMS[pid], keys=variantKeys(P), o=opts||{};
  return '<div class="plancard'+(o.on?' on':'')+'" data-plan="'+pid+'"'+(o.su?' data-su="program" data-v="'+pid+'" role="button" tabindex="0" aria-pressed="'+!!o.on+'"':'')+'>'
    +'<div class="pc-h"><span class="pc-n">'+esc(P.name)+'</span>'
    +(o.cur?'<span class="pill hot">Your plan</span>':'')+(o.rec?'<span class="pill hot">Suggested for you</span>':'')
    +(P.level===1?'<span class="pill good">Good for beginners</span>':'')+'</div>'
    +'<p class="pc-l">'+esc(P.line)+'</p><p class="pc-w">'+esc(P.who)+'</p>'
    +'<div class="mtags">'+P.focus.map(z=>'<span class="pill">'+esc(ZN[z]||z)+'</span>').join('')
    +'<span class="pill cool">'+keys.join(' or ')+' days a week</span></div>'
    +'<details class="how"><summary><span class="how-t">See the week</span><span class="chev">'+ICO.chev+'</span></summary><div class="how-b">'
    +P.about.map(a=>'<p style="font-size:13px;color:var(--text-dim);margin-top:8px">'+esc(a)+'</p>').join('')
    +keys.map(k=>weekHtml(P,k)).join('')+'</div></details>'
    +(o.su?'':'<button class="btn primary wide" data-useplan style="margin-top:12px">'+(o.cur?'Change my days, or restart':'Use this plan')+'</button>')
    +'</div>';
}
function daysHtml(days,attr){
  return '<div class="wdays">'+WEEK.map(d=>'<button '+attr+'="'+d+'" aria-pressed="'+(days.indexOf(d)>=0)+'">'+DOW[d]+'</button>').join('')+'</div>';
}

/* ---- choosing a target (from Train, from Settings, and after a block ends) ---- */
let PICK=null;
function planSheet(newBlock){
  PICK={newBlock:!!newBlock};
  openSheet(newBlock?'Start the next block':'Choose your target',
    '<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:12px">'
    +(newBlock?'Pick the plan for your next 91 days. Everything you have logged stays.'
              :'Each plan is a full program built for one goal. You can change at any time; your log stays.')+'</p>'
    +PROGRAM_ORDER.map(pid=>planCardHtml(pid,{cur:pid===S.profile.program})).join(''));
}
function planConfirm(pid){
  const P=PROGRAMS[pid], cur=pid===S.profile.program, st=blockState();
  PICK.program=pid;
  PICK.dpw=(cur&&P.variants[S.profile.dpw])?+S.profile.dpw:P.def;
  PICK.days=sortDays((cur&&PICK.dpw===+S.profile.dpw)?S.profile.days:P.variants[PICK.dpw].days);
  PICK.when=(PICK.newBlock||st==='done')?'new':(st==='before'?'now':null);
  PICK.start=null;
  drawConfirm();
}
function pickReady(){
  return PICK.days.length===+PICK.dpw&&!!PICK.when&&(PICK.when!=='new'||!!PICK.start);
}
function drawConfirm(){
  const P=PROGRAMS[PICK.program], keys=variantKeys(P), need=+PICK.dpw, st=blockState();
  let h='<button class="btn sm" data-plan-back>‹ All plans</button>'
    +'<h3 class="pc-n" style="margin:14px 0 2px;font-size:22px">'+esc(P.name)+'</h3><p class="pc-l">'+esc(P.line)+'</p>';
  if(keys.length>1)
    h+='<div class="sec"><div class="eyebrow">Days a week</div><div class="seg">'
      +keys.map(k=>'<button data-plan-dpw="'+k+'"'+(k===need?' class="on"':'')+'>'+k+' days</button>').join('')+'</div></div>';
  h+='<div class="sec"><div class="eyebrow">Which days you train</div>'+daysHtml(PICK.days,'data-plan-day')
    +'<p class="pc-w" style="margin-top:8px">'+(PICK.days.length===need?'Sessions run in this order through the week, Monday first.'
      :'<b style="color:var(--warn)">'+PICK.days.length+' of '+need+' chosen.</b> Choose exactly '+need+'.')+'</p></div>';
  if(st==='active'&&!PICK.newBlock)
    h+='<div class="sec"><div class="eyebrow">When</div><div class="choice">'
      +'<button data-plan-when="now" aria-pressed="'+(PICK.when==='now')+'"><b>From today</b><span>Keep my 91-day block. Today stays day '+todayIndex()+'.</span></button>'
      +'<button data-plan-when="new" aria-pressed="'+(PICK.when==='new')+'"><b>Start a new 91-day block</b><span>Day 1 again. Everything you logged stays.</span></button></div></div>';
  if(PICK.when==='new')
    h+='<div class="sec"><div class="eyebrow">The new block starts</div><div class="seg">'
      +'<button data-plan-start="today"'+(PICK.start==='today'?' class="on"':'')+'>Today</button>'
      +'<button data-plan-start="monday"'+(PICK.start==='monday'?' class="on"':'')+'>Next Monday</button></div></div>';
  h+='<button class="btn primary wide" data-plan-confirm style="margin-top:18px"'+(pickReady()?'':' disabled')+'>Confirm</button>';
  $('#sheetBody').innerHTML=h;
}
/* the block that is ending goes into the history; targets follow your current weight */
function startBlock(ds){
  const p=S.profile;
  if(blockState()!=='before'){
    const end=iso(addDays(parseISO(p.start),BLOCK_DAYS-1)), last=end<TODAY?end:TODAY;
    let planned=0, done=0;
    for(let i=1;i<=BLOCK_DAYS;i++){ const d=dayInfo(i); if(d.date>last) break; if(d.type==='lift'){ planned++; if(sessionDone(d.date)) done++; } }
    const wl=weightList().filter(x=>x[0]>=p.start&&x[0]<=last);
    S.blocks.push({program:p.program, name:program().name, dpw:+p.dpw, start:p.start, end:last,
      w0:wl.length?wl[0][1]:null, w1:wl.length?wl[wl.length-1][1]:null, done:done, planned:planned});
  }
  // the average of this week's weigh-ins, if there are any
  const from=iso(addDays(parseISO(TODAY),-6)), recent=weightList().filter(x=>x[0]>=from&&x[0]<=TODAY);
  if(recent.length){
    const w=Math.round(recent.reduce((a,x)=>a+x[1],0)/recent.length*10)/10;
    if(w>=30&&w<=300) p.w=w;
  }
  p.start=ds;
}
function applyPick(){
  if(!pickReady()) return;
  if(PICK.when==='new') startBlock(PICK.start==='monday'?nextMonday():TODAY);
  setPlan(PICK.program,+PICK.dpw,sortDays(PICK.days));
  S.profile.setup=true;
  save(); closeSheet(); rerenderAll();
}

/* ---- first run ------------------------------------------------------- */
let SU=null;
const SU_GOALS=[
  ['cut','Lose fat','Eat less than you burn and keep your muscle.'],
  ['recomp','Lose fat slowly and build muscle','A small deficit. Works best if you are new to lifting or coming back.'],
  ['maintain','Stay at this weight','Eat what you burn and get stronger.'],
  ['gain','Build muscle','Eat a little more than you burn.']
];
function suggestPlan(){ return SU.exp==='no'?'foundation':SU.goal==='cut'?'lean':'build'; }
function setupOpen(){
  SU={step:1, sex:'m', age:'', h:'', w:'', act:'1.45', goal:'recomp', exp:'yes', program:null, dpw:null, days:null, start:'today', err:''};
  $('#setup').classList.add('on'); document.body.style.overflow='hidden';
  setupDraw();
}
function setupClose(){ $('#setup').classList.remove('on'); document.body.style.overflow=''; SU=null; }
function setupDraw(){
  const top='<div class="su-top"><div class="brand"><b>FORGE</b><i>90</i></div><span class="pill">Step '+SU.step+' of 3</span></div>';
  const seg=(key,opts)=>'<div class="seg">'+opts.map(o=>'<button data-su="'+key+'" data-v="'+o[0]+'"'+(String(SU[key])===String(o[0])?' class="on"':'')+'>'+esc(o[1])+'</button>').join('')+'</div>';
  const num=(id,label,key,ph)=>'<div class="frow"><label for="'+id+'">'+label+'</label><input class="num" id="'+id+'" data-su-in="'+key+'" type="text" inputmode="decimal" autocomplete="off" placeholder="'+ph+'" value="'+esc(SU[key])+'"></div>';
  let h=top;
  if(SU.step===1){
    h+='<h2 id="setupTitle">About you</h2>'
      +'<p class="lede">Your calories, protein and heart-rate numbers are worked out from these. They stay on this phone.</p>'
      +'<div class="card"><div class="frow"><label>Sex</label><div style="width:170px">'+seg('sex',[['m','Male'],['f','Female']])+'</div></div>'
      +num('su-age','Age','age','years')+num('su-h','Height','h','cm')+num('su-w','Weight','w','kg')
      +'<div class="frow"><label for="su-act">Outside the gym</label><select id="su-act" data-su-in="act">'
      +[['1.35','Mostly sitting'],['1.45','Some walking'],['1.55','A lot of walking'],['1.65','On my feet all day']]
        .map(o=>'<option value="'+o[0]+'"'+(SU.act===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')+'</select></div></div>'
      +'<div class="sec"><div class="eyebrow">Your goal</div><div class="choice">'
      +SU_GOALS.map(g=>'<button data-su="goal" data-v="'+g[0]+'" aria-pressed="'+(SU.goal===g[0])+'"><b>'+g[1]+'</b><span>'+g[2]+'</span></button>').join('')+'</div></div>'
      +'<div class="sec"><div class="eyebrow">Have you lifted weights regularly for three months or more?</div>'+seg('exp',[['yes','Yes'],['no','No, or not lately']])+'</div>';
  }else if(SU.step===2){
    const rec=suggestPlan();
    if(!SU.program) SU.program=rec;
    h+='<h2 id="setupTitle">Your target</h2><p class="lede">Each plan is a full program built for one goal. You can change it later without losing anything.</p>'
      +[rec].concat(PROGRAM_ORDER.filter(p=>p!==rec)).map(pid=>planCardHtml(pid,{su:true,on:pid===SU.program,rec:pid===rec})).join('');
  }else{
    const P=PROGRAMS[SU.program], keys=variantKeys(P);
    if(!P.variants[SU.dpw]) SU.dpw=P.def;
    if(!SU.days) SU.days=sortDays(P.variants[SU.dpw].days);
    const need=+SU.dpw;
    h+='<h2 id="setupTitle">Your week</h2><p class="lede"><b>'+esc(P.name)+'</b> — '+esc(P.line)+'</p>'
      +(keys.length>1?'<div class="sec"><div class="eyebrow">Days a week</div>'+seg('dpw',keys.map(k=>[k,k+' days']))+'</div>':'')
      +'<div class="sec"><div class="eyebrow">Which days you train</div>'+daysHtml(SU.days,'data-su-day')
      +'<p class="pc-w" style="margin-top:8px">'+(SU.days.length===need?'Sessions run in this order through the week, Monday first.'
        :'<b style="color:var(--warn)">'+SU.days.length+' of '+need+' chosen.</b> Choose exactly '+need+'.')+'</p></div>'
      +'<div class="sec"><div class="eyebrow">Day 1 is</div>'+seg('start',[['today','Today'],['monday','Next Monday']])+'</div>';
  }
  h+='<p class="su-err" role="alert">'+esc(SU.err)+'</p><div class="su-nav">'
    +(SU.step>1?'<button class="btn" data-su-back>Back</button>':'')
    +(SU.step<3?'<button class="btn primary" data-su-next>Next</button>':'<button class="btn primary" data-su-done'+(SU.days&&SU.days.length===+SU.dpw?'':' disabled')+'>Start</button>')+'</div>';
  $('#setupBody').innerHTML=h;
  $('#setup').scrollTop=0;
}
function setupNext(){
  if(SU.step===1){
    const bad=[];
    if(numIn(latinNumber(SU.age),13,95,null)==null) bad.push('age (13–95)');
    if(numIn(latinNumber(SU.h),120,230,null)==null) bad.push('height (120–230 cm)');
    if(numIn(latinNumber(SU.w),30,300,null)==null) bad.push('weight (30–300 kg)');
    if(bad.length){ SU.err='Please check your '+bad.join(', ')+'.'; setupDraw(); return; }
  }
  SU.err=''; SU.step++; setupDraw();
}
function setupDone(){
  if(!SU.days||SU.days.length!==+SU.dpw) return;
  const start=SU.start==='monday'?nextMonday():TODAY, days=sortDays(SU.days);
  S.profile=cleanProfile({sex:SU.sex, age:latinNumber(SU.age), h:latinNumber(SU.h), w:latinNumber(SU.w), act:SU.act, goal:SU.goal,
    targetW:null, program:SU.program, dpw:+SU.dpw, days:days, start:start, setup:true},false);
  S.plans=[{from:start, program:S.profile.program, dpw:S.profile.dpw, days:S.profile.days.slice()}];
  S.ui.helpSeen=0;
  save(); setupClose(); rerenderAll();
}
$('#setup').addEventListener('input',e=>{
  const k=e.target.dataset&&e.target.dataset.suIn; if(k&&SU) SU[k]=e.target.value;
});
$('#setup').addEventListener('click',e=>{
  if(!SU) return;
  const T=e.target;
  if(T.closest('summary')) return;                               // "See the week" just opens
  const day=T.closest('[data-su-day]');
  if(day){
    const d=+day.dataset.suDay, at=SU.days.indexOf(d);
    if(at>=0) SU.days.splice(at,1); else SU.days.push(d);
    SU.days=sortDays(SU.days); setupDraw(); return;
  }
  const su=T.closest('[data-su]');
  if(su&&!T.closest('details.how')){
    const k=su.dataset.su;
    SU[k]=su.dataset.v;
    if(k==='program'){ SU.dpw=null; SU.days=null; }
    if(k==='dpw'){ SU.dpw=+su.dataset.v; SU.days=sortDays(PROGRAMS[SU.program].variants[SU.dpw].days); }
    setupDraw(); return;
  }
  if(T.closest('[data-su-next]')){ setupNext(); return; }
  if(T.closest('[data-su-back]')){ SU.err=''; SU.step--; setupDraw(); return; }
  if(T.closest('[data-su-done]')){ setupDone(); return; }
});

/* ---- the plan sheet's own clicks (it lives inside the shared sheet) ---- */
sheet.addEventListener('click',e=>{
  if(!PICK) return;
  const T=e.target;
  const use=T.closest('[data-useplan]');
  if(use){ planConfirm(use.closest('[data-plan]').dataset.plan); return; }
  if(T.closest('[data-plan-back]')){ planSheet(PICK.newBlock); return; }
  const dpw=T.closest('[data-plan-dpw]');
  if(dpw){ PICK.dpw=+dpw.dataset.planDpw; PICK.days=sortDays(PROGRAMS[PICK.program].variants[PICK.dpw].days); drawConfirm(); return; }
  const day=T.closest('[data-plan-day]');
  if(day){
    const d=+day.dataset.planDay, at=PICK.days.indexOf(d);
    if(at>=0) PICK.days.splice(at,1); else PICK.days.push(d);
    PICK.days=sortDays(PICK.days); drawConfirm(); return;
  }
  const when=T.closest('[data-plan-when]');
  if(when){ PICK.when=when.dataset.planWhen; if(PICK.when!=='new') PICK.start=null; drawConfirm(); return; }
  const st=T.closest('[data-plan-start]');
  if(st){ PICK.start=st.dataset.planStart; drawConfirm(); return; }
  if(T.closest('[data-plan-confirm]')){ if(pickReady()){ applyPick(); PICK=null; } return; }
});
