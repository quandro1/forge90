/* ===================================================================
   MEASURE WITH PHONE
   On the angle rows that are set on equipment (an incline bench, a seat back) the phone can measure the
   slope itself: it lies on the pad and the sheet shows the angle, in the same terms as the row.
   An angle row opts in with {phone: 1} as part of its sixth entry (10-exercises.js); only "up" (from flat)
   and "lean" (from upright) rows can.

   The slope comes from the phone's own tilt sensor (the deviceorientation event): beta is the tilt front to
   back, gamma the tilt side to side. The angle between the screen and level ground is
   acos(|cos beta x cos gamma|), which is the same whichever way round the phone lies, face up or face down.
   iPhones ask before sharing movement, and only from a tap, so the question is asked when the link is tapped.
   Nothing is stored and nothing leaves the phone.
   =================================================================== */
let TILT=null;                               // the measuring in progress: {row, v, heard, timer}
function tiltAngle(beta,gamma){
  const r=Math.PI/180, c=Math.abs(Math.cos((+beta||0)*r)*Math.cos((+gamma||0)*r));
  return Math.acos(Math.min(1,c))/r;
}
function tiltLink(id,i,a){
  if(!(a[5]&&a[5].phone)||typeof DeviceOrientationEvent==='undefined') return '';
  return '<button class="lkbtn tilt" data-tilt="'+id+'|'+i+'">Measure with phone</button>';
}
/* the reading, in the row's own terms: up from flat, or back from upright */
function tiltValue(kind,deg){ return kind==='lean'?90-deg:deg; }
function tiltJudge(row,v){
  const d=row[2], lo=typeof d==='number'?d-3:Math.min(d[0],d[1])-1, hi=typeof d==='number'?d+3:Math.max(d[0],d[1])+1;
  if(v>=lo&&v<=hi) return {ok:true, txt:'Right. Leave it there.'};
  if(row[1]==='lean') return {ok:false, txt:v<lo?'Too upright. Tilt it further back.':'Too far back. Bring it more upright.'};
  return {ok:false, txt:v<lo?'Too flat. Raise it.':'Too steep. Lower it.'};
}
function tiltPaint(){
  const num=$('#tiltNum'), st=$('#tiltState'); if(!TILT||!num||!st) return;
  if(TILT.v==null){ num.textContent='—'; return; }
  const v=Math.round(tiltValue(TILT.row[1],TILT.v)), j=tiltJudge(TILT.row,v);
  num.textContent=v+'°';
  st.textContent=j.txt; st.className='tilt-s '+(j.ok?'ok':'off');
  num.className='tilt-n num'+(j.ok?' ok':'');
}
function tiltOn(e){
  if(!TILT||e.beta==null||e.gamma==null) return;
  const now=tiltAngle(e.beta,e.gamma);
  // the first reading and any big move are taken as they are; small changes are smoothed so the number holds still
  TILT.v=(TILT.v==null||Math.abs(now-TILT.v)>8)?now:TILT.v+(now-TILT.v)*0.35;
  TILT.heard=true;
  tiltPaint();
}
function tiltStop(){
  if(!TILT) return;
  window.removeEventListener('deviceorientation',tiltOn);
  clearTimeout(TILT.timer);
  TILT=null;
}
function tiltSay(txt){ const st=$('#tiltState'); if(st){ st.textContent=txt; st.className='tilt-s off'; } }
function tiltOpen(id,i){
  const row=EX[id]&&EX[id].form&&EX[id].form.angles[i]; if(!row) return;
  tiltStop();
  const lean=row[1]==='lean', what=row[0].toLowerCase();
  openSheet('Measure the '+what,
    '<p class="tilt-how">'+(lean?'Hold the phone flat against the '+esc(what)+', with its back on the pad.'
        :'Lay the phone flat on the pad your back rests on, screen up. It can lie any way round.')+'</p>'
    +'<div class="tilt-box"><div class="tilt-n num" id="tiltNum">—</div>'
    +'<div class="tilt-t" id="tiltTarget">Target <b>'+esc(degText(row[2]))+'</b> '+esc(row[3])+'</div>'
    +'<div class="tilt-s wait" id="tiltState" role="status">Waiting for the phone to report its tilt.</div></div>'
    +'<p class="tilt-note">Good to about two degrees. A thick case or a camera bump can add a degree or two. Nothing is saved.</p>');
  const t=TILT={row:row, v:null, heard:false, timer:null, ready:false};
  // Listening starts at once. A phone that asks first sends nothing until it has said yes.
  window.addEventListener('deviceorientation',tiltOn);
  // Once the phone has answered (or never asks), three seconds without a reading means there is no sensor to read.
  const wait=()=>{
    if(TILT!==t) return;
    t.ready=true; clearTimeout(t.timer);
    t.timer=setTimeout(()=>{ if(TILT===t&&!t.heard) tiltSay('No reading from this phone. Its browser does not report tilt, so set the angle by the notches on the bench.'); },3000);
  };
  // iPhones (and newer Chrome) ask before sharing movement, and only from a tap: this runs inside the tap on the link
  const ask=typeof DeviceOrientationEvent!=='undefined'&&DeviceOrientationEvent.requestPermission;
  if(typeof ask!=='function'){ wait(); return; }
  t.timer=setTimeout(wait,10000);             // a question that is never answered does not leave the sheet waiting for ever
  Promise.resolve().then(()=>ask.call(DeviceOrientationEvent)).then(ans=>{
    if(TILT!==t) return;
    if(ans==='denied'){                       // a clear "no": stop listening and say what to change
      t.ready=true; clearTimeout(t.timer);
      window.removeEventListener('deviceorientation',tiltOn);
      t.v=null; tiltPaint();
      tiltSay('Not allowed: the phone did not let the app read its movement. In the phone\'s settings for this site, allow "Motion and Orientation", then try again.');
    }else wait();
  },()=>wait());                              // the question could not be asked: readings may still arrive
}
