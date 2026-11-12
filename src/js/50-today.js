function renderToday(){
  if(syncAuto()) save(true);                   // ticks the logs already prove
  const t=targets(), di=todayIndex(), info=infoForDate(TODAY);
  const started=di>=1, done=di>BLOCK_DAYS;

  $('#dayline').textContent = !started
    ? 'Starts '+fmtDate(S.profile.start)
    : done ? 'Block complete · '+fmtDate(TODAY)
    : 'Day '+di+' of '+BLOCK_DAYS+' · Week '+info.week+' · Phase '+info.phase+(info.deload?' · deload':'');

  $('#todaylede').textContent = !started
    ? 'Your block begins on '+fmtDate(S.profile.start)+'. Change the start date in Settings if that is wrong — everything on this page keys off it.'
    : done ? 'Ninety-one days done. Take the measurements, look at the photos, then set the next block.'
    : info.type==='lift' ? 'Training day. Do the session and hit your protein; everything else on this page is maintenance.'
    : info.type==='cardio' ? 'No lifting today. Zone 2 and steps — the work that costs you nothing in recovery.'
    : 'Rest day. Walk, eat, sleep. This is when you actually grow.';

  const wl=weightList(), latest=wl.length?wl[wl.length-1][1]:null;
  const startW=wl.length?wl[0][1]:t.w;
  $('#ro-today').innerHTML=[
    ro('Day', started&&!done?di:(done?BLOCK_DAYS:0), '/ '+BLOCK_DAYS, true),
    ro('Phase', started&&!done?info.phase:'—', started&&!done?PHASES[info.phase-1].name:''),
    ro('Weight', latest!=null?latest.toFixed(1):'—', latest!=null?(latest-startW>=0?'+':'')+(latest-startW).toFixed(1)+' kg':'log one'),
    ro('Streak', streak(), 'days', true)
  ].join('');

  // session card
  let sc;
  if(!started||done){
    sc='<div class="session rest"><div class="tag">'+(done?'Finished':'Not started')+'</div><h3>'+(done?'Block complete':'Waiting to begin')+'</h3><p class="focus">'
      +(done?'Ninety-one days done. Log your final weight and measurements in Progress, then start the next block: same plan or a new target. Everything you logged stays.'
            :'Day 1 is '+fmtDate(S.profile.start)+'. You can change that date in Settings.')+'</p>'
      +(done?'<button class="btn primary wide" style="margin-top:13px" data-newblock>Start the next block</button>':'')+'</div>';
  }else if(info.type==='lift'){
    const s=info.session;
    sc='<div class="session"><div class="tag">'+esc('Day '+(info.idx+1)+' · '+s.tag)+(info.deload?' · DELOAD':'')+'</div>'
      +'<h3>'+esc(s.name)+'</h3><p class="focus">'+esc(s.focus)+'</p><div class="meta">'
      +'<span class="pill hot">'+s.items.length+' exercises</span>'
      +'<span class="pill">'+condToday(info)+'</span>'
      +(info.deload?'<span class="pill warn">Deload week: easier on purpose</span>':'')
      +(sessionDone(TODAY)?'<span class="pill good">Done</span>':'')
      +'</div><button class="btn primary wide" style="margin-top:13px" data-goday="'+info.idx+'">Open the session</button></div>';
  }else{
    sc='<div class="session rest"><div class="tag">'+(info.type==='cardio'?'CONDITIONING':'REST')+'</div>'
      +'<h3>'+(info.type==='cardio'?'Zone 2 & steps':'Full rest')+'</h3>'
      +'<p class="focus">'+(info.type==='cardio'
        ?'A pace you could hold a conversation at — '+t.z2[0]+'–'+t.z2[1]+' bpm. Incline walk or bike, low joint cost, keeps your legs fresh for tomorrow.'
        :'Nothing to lift. Walk, hit your protein, sleep long.')+'</p>'
      +'<div class="meta"><span class="pill cool">'+condToday(info)+'</span>'
      +(info.checkin?'<span class="pill warn">Weekly check-in</span>':'')+'</div></div>';
  }
  $('#sessionCard').innerHTML=sc;
  $('#dlCard').innerHTML=deloadCard(started&&!done?info:null);

  renderChecklist();

  $('#logDate').textContent=fmtDate(TODAY);
  $('#qWeight').value=S.weights[TODAY]!=null?S.weights[TODAY]:'';
  $('#qWaist').value=S.waist[TODAY]!=null?S.waist[TODAY]:'';
  $('#qSteps').value=S.steps[TODAY]!=null?S.steps[TODAY]:'';

  renderHelp();
  renderCond();
  $('#miniPunch').innerHTML=punch(Math.max(0,Math.min(10,Math.ceil((started&&!done?di:1)/7)-1)),3);
}
/* ---- deload weeks, in plain words ---------------------------------- */
/* Checked against the research by an independent review on 12 Nov 2026: no promise of lifting more afterwards
   (the one controlled trial did not find it), nothing about nerves (they recover fastest), no count of hard weeks. */
const DELOAD_WHAT='<ol class="steps big">'
  +'<li><b>About a tenth less weight</b> than last time (10%). The logbook works out the number for each lift. Where the weight cannot go down, it takes reps off instead.</li>'
  +'<li><b>One set fewer</b> on each lift. A lift with only two sets keeps both.</li>'
  +'<li><b>Stop each set early</b>, when you could still do about three more reps. Nothing should feel hard.</li></ol>';
function deloadText(){
  return '<p><b>A deload is a planned easy week.</b> You still train, but you do less on purpose, so your body can finish recovering from the weeks before. Same exercises, same days. Three things change:</p>'
    +DELOAD_WHAT
    +'<p style="margin-top:12px"><b>Why.</b> Every hard session makes you a little stronger and a little more tired. The tiredness adds up from week to week. Tendons also get stronger more slowly than muscle, so tendons and joints are the first to ache. One easy week clears the tiredness and gives them a rest, so you start the next weeks fresh. You do not lose muscle or strength in one lighter week.</p>'
    +'<p style="margin-top:10px"><b>Like half-time in a match:</b> nobody gets weaker during the break. The players come back less tired, and they have lost nothing.</p>'
    +'<p style="margin-top:10px"><b>Like charging a phone:</b> you plug it in before it reaches zero, not after it has switched off. The easy week is planned ahead for the same reason.</p>'
    +'<p style="margin-top:10px"><b>When.</b> Week 6 and week 12 of the 13 weeks.</p>'
    +'<p style="margin-top:10px"><b>Cardio.</b> Keep your steps and the easy cardio. Leave the hard intervals out this week.</p>'
    +'<p style="margin-top:10px"><b>In the logbook.</b> Sessions logged in that week are marked "Deload". They are easier on purpose, so they are not used as numbers to beat: the week after, your targets continue from your last normal session.</p>'
    +'<p style="margin-top:10px"><b>Can you skip it?</b> Yes, if your lifts are still going up, nothing aches and you are sleeping well. Take it if your lifts have stopped going up, a joint aches, or you feel very tired. If you are not sure, take it. If you skip week 6, do not skip week 12.</p>';
}
/* On Today, any day of a deload week: the full explanation until "Got it", then one line that leads back to it. */
function deloadCard(info){
  if(!info||DELOAD_WEEKS.indexOf(info.week)<0) return '';
  const wk=info.week;
  if(dlSkipped(wk)) return '<p class="dlline">Week '+wk+' is a planned easy week (a deload). You chose to train normally. <button class="lkbtn" data-dlwhy>Change</button></p>';
  if(dlSeen(wk)) return '<p class="dlline">Deload week: easier on purpose. <button class="lkbtn" data-dlwhy>What is this?</button></p>';
  return '<div class="card help dlcard"><div class="card-h"><h3>Week '+wk+' is a deload week</h3><button class="btn sm" data-dlok>Got it</button></div>'
    +'<p class="dl-p"><b>A deload is a planned easy week.</b> You still train, but you do less on purpose. Same exercises, same days. Three things change:</p>'
    +DELOAD_WHAT
    +'<p class="dl-p">It clears the tiredness that builds up over weeks of training and gives your tendons and joints a rest, so you start the next weeks fresh. You do not lose muscle in one lighter week.</p>'
    +'<div class="dl-b"><button class="btn sm" data-dlwhy>More about this</button><button class="btn sm" data-dlskip>Train normally this week</button></div></div>';
}
function chkButton(x,on,attr){
  return '<button class="chk" '+attr+' aria-pressed="'+!!on+'">'
    +'<span class="box">'+ICO.tick+'</span><span class="lbl">'+esc(x.l)+'</span><span class="hint">'+esc(x.h)+'</span></button>';
}
function renderChecklist(){
  const list=checkList(), c=S.checks[TODAY]||[];
  $('#checklist').innerHTML=list.map(x=>chkButton(x, c.indexOf(x.k)>=0, 'data-chk="'+x.k+'"')).join('');
  // creatine is optional: it joins the count only once it is ticked
  const optional=list.some(x=>x.k==='creatine')&&c.indexOf('creatine')<0;
  $('#chkCount').textContent=c.length+' / '+(list.length-(optional?1:0));
}
function renderHelp(){
  if(S.ui.from===1){                         // came from the earlier version: say what changed, once
    $('#helpCard').innerHTML='<div class="card help">'
      +'<div class="card-h"><h3>The app was updated</h3><button class="btn sm" data-hidenew>Got it</button></div>'
      +'<ol class="steps big">'
      +'<li><b>Everything you logged is here.</b> The old copy is still on this phone as a backup.</li>'
      +'<li><b>Your sessions were revised.</b> Some exercises, set counts and rep ranges changed. Open Train to see this week; the history of every lift is kept.</li>'
      +'<li><b>Choose a target.</b> Train → Change: six plans, with the days you train.</li>'
      +'<li><b>Clearer exercise guides.</b> Each lift now shows where a rep starts and finishes, where you should feel it, and what to change if you do not.</li>'
      +'<li><b>The rest timer always starts,</b> and today\'s target stays on screen until your last set.</li>'
      +'<li><b>Station taken?</b> Open the lift: the buttons under Video and Photos swap it for another lift for the same muscle.</li>'
      +'</ol></div>';
    return;
  }
  if(S.ui.helpSeen&&(+S.ui.news||0)<NEWS){   // someone who already uses the app: what the latest update changed, once
    $('#helpCard').innerHTML='<div class="card help">'
      +'<div class="card-h"><h3>New in this update</h3><button class="btn sm" data-hidenews>Got it</button></div>'
      +'<ol class="steps big">'
      +'<li><b>Angles, grip and range on every exercise.</b> Open a lift in Train: each angle is drawn above the logbook, with the grip, the range and a line called Like that compares the movement with something from everyday life. Tap the title to close the block, and it stays closed.</li>'
      +'<li><b>Deload weeks are explained.</b> Week 6 and week 12 are planned easy weeks. The Today screen says what to do and why, and you can choose to train normally instead.</li>'
      +'<li><b>The "Same as last time" button works in every week.</b> In a deload week it fills in last time\'s sets made easier. If you finish a lift with sets you did not tick, the app asks whether you did them.</li>'
      +'</ol></div>';
    return;
  }
  if(S.ui.helpSeen){ $('#helpCard').innerHTML=''; return; }
  $('#helpCard').innerHTML='<div class="card help">'
    +'<div class="card-h"><h3>How to use this</h3><button class="btn sm" data-hidehelp>Got it</button></div>'
    +'<ol class="steps big">'
    +'<li><b>Today</b> — the screen you open first. Tick the list and log your weight and steps.</li>'
    +'<li><b>Train</b> — open today\'s session, then type the weight and reps for each set. The app reads your history and tells you what to do next time.</li>'
    +'<li><b>Map</b> — all 91 days. Tap any square to see what that day holds.</li>'
    +'<li><b>Fuel</b> — your calories and protein, an example day of meals, and the counter where you tap what you ate.</li>'
    +'<li><b>Progress</b> — weigh in daily, but only ever react to the <b>orange 7-day line</b>, never one morning\'s number.</li>'
    +'</ol>'
    +'<p style="font-size:12.5px;color:var(--text-dim);margin-top:11px">Everything saves on this device by itself. Nothing to press.</p>'
    +'</div>';
}
function ro(k,v,u,hot){
  return '<div><div class="k">'+esc(k)+'</div><div class="v'+(hot?' hot':'')+'">'+esc(v)+'</div><div class="u">'+esc(u||'')+'</div></div>';
}
function condToday(info){
  const c=COND[info.phase];
  if(info.type==='cardio') return 'Zone 2 · '+c.z2min;
  return stepsTarget(info.week).toLocaleString()+' steps';
}
/* ---- conditioning tracking --------------------------------------- */
function stepsTarget(week){
  if(week<=4) return Math.min(8000, 5000+week*1000);   // ramp ~1k a week
  return week<=8?8500:9500;
}
function weekDates(week){
  const out=[];
  for(let k=0;k<7;k++){ const i=(week-1)*7+k+1; if(i<=BLOCK_DAYS) out.push(dayInfo(i).date); }
  return out;
}
function condCount(week,kind){
  return weekDates(week).reduce((n,d)=>n+((S.cond&&S.cond[d]||[]).filter(x=>x===kind).length),0);
}
function logCond(kind){
  S.cond=S.cond||{};
  const a=S.cond[TODAY]||(S.cond[TODAY]=[]);
  a.push(kind); save();
}
function unlogCond(kind){
  if(!S.cond||!S.cond[TODAY]) return;
  const i=S.cond[TODAY].lastIndexOf(kind);
  if(i>=0) S.cond[TODAY].splice(i,1);
  if(!S.cond[TODAY].length) delete S.cond[TODAY];
  save();
}
function dots(done,target){
  if(!target) return '<span class="dots none">not this phase</span>';
  let h='<span class="dots">';
  for(let i=0;i<Math.max(target,done);i++) h+='<i class="'+(i<done?'on':'')+'"></i>';
  return h+'</span>';
}
function renderCond(){
  const di=todayIndex();
  if(di<1||di>BLOCK_DAYS){ $('#condCard').innerHTML='<div class="card-h"><h3>Conditioning</h3></div>'
    +'<p style="font-size:13px;color:var(--text-dim)">Starts with the block.</p>'; return; }
  const info=dayInfo(di), c=COND[info.phase], t=targets();
  const st=stepsTarget(info.week), today=S.steps[TODAY]||0;
  const z2=condCount(info.week,'z2'), hi=condCount(info.week,'hiit');
  const pct=Math.min(100,Math.round(today/st*100));
  $('#condCard').innerHTML=
    '<div class="card-h"><h3>Conditioning</h3><span class="pill cool">Week '+info.week+' · Phase '+info.phase+'</span></div>'
    +'<div class="condrow"><span class="cl">Steps today</span>'
      +'<span class="cv num">'+(today?today.toLocaleString():'—')+'</span>'
      +'<span class="ct num">of '+st.toLocaleString()+'</span></div>'
    +'<div class="pbar" style="margin:8px 0 14px"><i style="width:'+pct+'%"></i></div>'
    +'<div class="condrow"><span class="cl">Zone 2 this week</span>'+dots(z2,c.z2)
      +'<span class="ct num">'+z2+' / '+c.z2+'</span></div>'
    +'<div class="condrow" style="margin-top:8px"><span class="cl">Intervals this week</span>'+dots(hi,c.hiit)
      +'<span class="ct num">'+(c.hiit?hi+' / '+c.hiit:'—')+'</span></div>'
    +'<div style="display:flex;gap:8px;margin-top:13px;flex-wrap:wrap">'
      +'<button class="btn sm" data-cond="z2">+ Zone 2</button>'
      +(c.hiit?'<button class="btn sm" data-cond="hiit">+ Intervals</button>':'')
      +((S.cond&&S.cond[TODAY]&&S.cond[TODAY].length)?'<button class="btn sm danger" data-uncond="1">Undo today</button>':'')
    +'</div>'
    +'<div class="note" style="margin-top:13px">'+esc(c.note)+'<br>'
      +'Zone 2 pace for you is about <b>'+t.z2[0]+'–'+t.z2[1]+' bpm</b> — a pace you could still talk at.</div>';
}
/* which days of this person's week carry Zone 2, and which is the check-in */
function condDaysLine(phase){
  const cd=cardioDays(phase).map(d=>DOWL[d]), ci=DOWL[checkinDay()];
  return (cd.length?'Zone 2 days in your week: '+cd.join(' and ')+'. ':'You lift six days a week, so do your Zone 2 after an upper-body session. ')
    +ci+' is full rest and the weekly check-in.';
}
function renderCondSection(){
  const di=todayIndex(), ph=(di>=1&&di<=BLOCK_DAYS)?dayInfo(di).phase:1;
  $('#condSection').innerHTML=
    CONDTOOLS.map((x,i)=>{
      const c=COND[ph];
      const dose=x.k==='steps'?c.steps+' a day':x.k==='z2'?c.z2+'× a week · '+c.z2min:(c.hiit?c.hiit+'× a week · ≤20 min':'none in this phase');
      return '<details'+(i===0?' open':'')+'><summary><span class="idx">'+String(i+1).padStart(2,'0')+'</span>'
        +'<span style="flex:1;min-width:0"><span style="display:block">'+esc(x.n)+'</span>'
        +'<span style="display:block;font-family:var(--font-m);font-size:10.5px;color:var(--text-faint)">'+esc(x.tag)+'</span></span>'
        +'<span class="pill hot">'+esc(dose)+'</span><span class="chev">'+ICO.chev+'</span></summary>'
        +'<div class="dbody"><p style="font-size:13.5px;color:var(--text-dim)">'+x.b+'</p>'
        +'<div class="note" style="margin-top:11px"><b>In practice</b><br>'+x.how+'</div></div></details>';
    }).join('')
    +'<details><summary><span class="idx">04</span>Where it goes in the week<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<div class="tw"><table><thead><tr><th>Phase</th><th class="n">Steps</th><th>Zone 2</th><th>Intervals</th></tr></thead><tbody>'
    +[1,2,3].map(p=>'<tr'+(p===ph?' style="background:var(--ember-wash)"':'')+'><td>'+p+' · '+PHASES[p-1].name+'</td>'
      +'<td class="n">'+COND[p].steps+'</td><td>'+COND[p].z2+'× · '+COND[p].z2min+'</td>'
      +'<td>'+(COND[p].hiit?COND[p].hiit+'×':'none')+'</td></tr>').join('')
    +'</tbody></table></div>'
    +'<ul class="klist" style="margin-top:12px">'
    +'<li><b>Never</b> do hard cardio the day before you train legs.</li>'
    +'<li>Zone 2 goes on a rest day, or <em>after</em> you lift — never before.</li>'
    +'<li>'+esc(condDaysLine(ph))+'</li>'
    +'<li>If your lifts drop from week to week, <b>cut the intervals first</b>, then some Zone 2. Never cut protein or sleep to make room for cardio.</li>'
    +'</ul></div></details>'
    +'<details><summary><span class="idx">05</span>What these look like<span class="chev">'+ICO.chev+'</span></summary><div class="dbody">'
    +'<p style="font-size:13.5px;color:var(--text-dim);margin-bottom:11px">Not sure what a machine or an interval actually looks like? Same photo and video buttons as the lifts.</p>'
    +CARDIO_DEMOS.map(d=>'<div class="libitem"><div class="li-h"><span class="li-n">'+esc(d[0])+'</span></div>'
      +'<p class="li-c">'+esc(d[1])+'</p>'+demoLinks(d[0],true)+'</div>').join('')
    +'</div></details>';
}

/* ---- punch card -------------------------------------------------- */
function punch(fromWeek,weeks){
  const start=fromWeek||0, end=Math.min(13,start+(weeks||13));
  // columns run from whatever weekday the block starts on — not from Monday
  const w0=parseISO(S.profile.start).getDay();
  let h='<div class="hd"></div>';
  for(let k=0;k<7;k++) h+='<div class="hd">'+DOW[(w0+k)%7].charAt(0)+'</div>';
  for(let w=start; w<end; w++){
    h+='<div class="wk">'+(w+1)+'</div>';
    for(let k=0;k<7;k++){
      const i=w*7+k+1;
      if(i>BLOCK_DAYS){ h+='<div></div>'; continue; }
      const d=dayInfo(i), isToday=d.date===TODAY, past=parseISO(d.date)<parseISO(TODAY);
      const done=d.type!=='rest'&&sessionDone(d.date);
      const cls=['day',d.type==='lift'?'lift':d.type==='cardio'?'cardio':'',
                 done?'done':'', d.deload?'deload':'', isToday?'today':'', past&&!isToday?'past':''].filter(Boolean).join(' ');
      const lbl=d.type==='lift'?(d.idx+1):d.type==='cardio'?'·':'';
      h+='<button class="'+cls+'" data-day="'+i+'" title="Day '+i+' — '+fmtDate(d.date)+'" aria-label="Day '+i+'">'+lbl+'</button>';
    }
  }
  return h;
}

/* ===================================================================
   RENDER — TRAIN
   =================================================================== */
