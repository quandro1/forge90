/* ===================================================================
   A LIFT'S HISTORY, AND "NEW BEST"
   Every lift has a history sheet: its best set, a graph of the best set of each session, and every session
   as it was logged. It opens from the logbook's "last time" line and from the Strength log in Progress.

   One rule decides what "best" means everywhere: the best set of a session is the heaviest, then the most
   reps at that weight (bestSet). The Strength log, this sheet and the "New best" line all use it, so two
   screens can never name different bests.
   =================================================================== */
function betterSet(a,b){ return !b||a.w>b.w||(a.w===b.w&&a.r>b.r); }
function bestText(id,b){
  const hold=EX[id].load==='time';
  return b.w>0?b.w+' kg × '+b.r+(hold?' s':''):(hold?b.r+' s':'BW × '+b.r);
}
/* the sessions of a lift that have a best set, oldest first */
function liftSessions(id){
  return (S.logs[id]||[]).filter(e=>bestSet(e)).map(e=>({d:e.d, dl:!!e.dl, best:bestSet(e), e:e}));
}
/* Today's best set, when it beats the best set of every earlier session: {now, was}. Otherwise null.
   A lift's first session is not a "new best": there is nothing to beat yet. */
function newBestToday(id){
  const all=liftSessions(id), now=all.find(x=>x.d===TODAY), past=all.filter(x=>x.d<TODAY);
  if(!now||!past.length) return null;
  let was=null; past.forEach(x=>{ if(betterSet(x.best,was)) was=x.best; });
  return betterSet(now.best,was)?{now:now.best, was:was}:null;
}
/* the logbook must draw and the rest must start whatever happens here, so these two never throw */
function pbKey(id){ try{ const p=newBestToday(id); return p?p.now.w+'x'+p.now.r:''; }catch(e){ return ''; } }
let PB_FLASH=null;                           // the lift whose "New best" line has just appeared or changed: it pops once
function pbLine(id){
  try{
    const p=newBestToday(id); if(!p) return '';
    return '<p class="pbline'+(PB_FLASH===id?' fresh':'')+'" role="status"><span aria-hidden="true">★</span> <b>New best: '+esc(bestText(id,p.now))+'</b>'
      +'<span class="was">before: '+esc(bestText(id,p.was))+'</span></p>';
  }catch(e){ return ''; }
}
/* A rough estimate of the heaviest single from one set (Epley: weight × (1 + reps/30)). Only for sets of
   10 reps or fewer, where such formulas hold up; it is shown as a sentence with its warning, never as a target. */
function est1(b){ return (b&&b.w>0&&b.r>=1&&b.r<=10)?Math.round(b.w*(b.r>1?1+b.r/30:1)*2)/2:null; }

let HIST=null;                               // what the open history sheet shows: {id, all, usesW}
function histValue(x){ return HIST.usesW?x.best.w:x.best.r; }
function histReadText(x){ return fmtDate(x.d)+' · '+bestText(HIST.id,x.best)+(x.dl?' · deload week':''); }
function histRead(i){
  const el=$('#histRead'); if(!el||!HIST||!HIST.all[i]) return;
  el.textContent=histReadText(HIST.all[i]);
  $$('#sheetBody .lchart .pt').forEach((c,k)=>c.classList.toggle('sel',k===i));
}
function historySheet(id){
  const ex=EX[id]; if(!ex) return;
  const all=liftSessions(id); if(!all.length) return;
  const hold=ex.load==='time', usesW=all.some(x=>x.best.w>0), it=Object.assign({ex:id},ex.typ);
  let best=null, bestAt=null; all.forEach(x=>{ if(betterSet(x.best,best)){ best=x.best; bestAt=x.d; } });
  const e1=hold?null:est1(best);
  HIST={id:id, all:all, usesW:usesW};
  let h='<p class="hist-s"><b>Best so far: '+esc(bestText(id,best))+'</b>, on '+fmtDate(bestAt)+'.</p>';
  if(all.length>1) h+='<p class="hist-s dim">First session: '+esc(bestText(id,all[0].best))+', on '+fmtDate(all[0].d)+'.</p>';
  if(e1) h+='<p class="hist-s dim">Estimated best single: about '+e1+' kg. Worked out from that set, as a rough guide to how your strength is moving. It is not a weight to try.</p>';
  if(all.length>1){
    h+='<div class="card hist-c"><div class="card-h"><h3>Best set of each session</h3><span class="pill">'+(usesW?'kg':hold?'seconds':'reps')+'</span></div>'
      +'<p class="hist-r num" id="histRead">'+esc(histReadText(all[all.length-1]))+'</p>'
      +liftChart(id,all,usesW,hold)
      +'<p class="hist-n">Tap a point to read that session.'+(all.some(x=>x.dl)?' A hollow point is a deload week: easier on purpose.':'')+'</p></div>';
  }else h+='<p class="hist-s dim">One session so far. The graph starts with the second.</p>';
  h+='<div class="eyebrow" style="margin:16px 0 7px">Every session</div><div class="tw"><table><thead><tr><th>Date</th><th>Sets</th></tr></thead><tbody>'
    +all.slice().reverse().map(x=>'<tr><td>'+fmtDate(x.d)+(x.dl?' <span class="pill">Deload</span>':'')+'</td><td class="num">'
      +loggedSets(x.e).map(s=>esc(setText(ex,it,s))).join('&nbsp; ')+'</td></tr>').join('')
    +'</tbody></table></div>';
  openSheet('History · '+ex.name,h);
  if(all.length>1) histRead(all.length-1);
}
/* One line, one colour: the best set of each session over time. Normal sessions are joined; a deload session
   is a hollow point off the line, since it is easier on purpose. Drawn at about one unit to a pixel on a
   phone, so the points (9 px), their tap areas (26 px) and the labels (10 px) keep their size. */
function liftChart(id,all,usesW,hold){
  const W=340,H=176,PL=30,PR=14,PT=16,PB=22;
  const val=x=>usesW?x.best.w:x.best.r, t=x=>parseISO(x.d).getTime();
  const x0=t(all[0]), x1=t(all[all.length-1]);
  let lo=Math.min.apply(null,all.map(val)), hi=Math.max.apply(null,all.map(val));
  const pad=Math.max(usesW?2.5:1,(hi-lo)*0.18); lo=Math.max(0,lo-pad); hi+=pad;
  const steps=[0.5,1,2,2.5,5,10,20,25,50,100,200];
  let step=steps[steps.length-1];
  for(let i=0;i<steps.length;i++){ if((hi-lo)/steps[i]<=4){ step=steps[i]; break; } }
  lo=Math.floor(lo/step)*step; hi=Math.ceil(hi/step)*step; if(hi===lo) hi=lo+step;
  // the first and last points sit a little inside the plot, clear of the numbers on the left
  const X=v=>PL+8+(x1===x0?0.5:(v-x0)/(x1-x0))*(W-PL-PR-16), Y=v=>PT+(1-(v-lo)/(hi-lo))*(H-PT-PB);
  const f=n=>n.toFixed(1), dec=step<1?1:0;
  let g='';
  for(let v=lo; v<=hi+1e-9; v+=step){
    const y=f(Y(v));
    g+='<line class="grid-l" x1="'+PL+'" y1="'+y+'" x2="'+(W-PR)+'" y2="'+y+'"/><text class="lc-t" x="'+(PL-5)+'" y="'+(+y+3.5)+'" text-anchor="end">'+v.toFixed(dec)+'</text>';
  }
  const normal=all.filter(x=>!x.dl);
  const line=normal.length>1?'<path class="trend" d="'+normal.map((x,i)=>(i?'L':'M')+f(X(t(x)))+' '+f(Y(val(x)))).join(' ')+'"/>':'';
  const pts=all.map(x=>'<circle class="pt'+(x.dl?' dl':'')+'" cx="'+f(X(t(x)))+'" cy="'+f(Y(val(x)))+'" r="4.5"/>').join('');
  // the tap area of a point is bigger than the point: 26 px across
  const hits=all.map((x,i)=>'<circle class="hit" data-pt="'+i+'" tabindex="0" role="button" aria-label="'+esc(histReadTextFor(id,x))+'" cx="'+f(X(t(x)))+'" cy="'+f(Y(val(x)))+'" r="13"/>').join('');
  return '<svg class="chart lchart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc('Best set of each '+EX[id].name+' session, in '+(usesW?'kilograms':hold?'seconds':'reps'))+'">'
    +g+line+pts+hits
    +'<text class="lc-t" x="'+PL+'" y="'+(H-6)+'">'+fmtDate(all[0].d)+'</text>'
    +'<text class="lc-t" x="'+(W-PR)+'" y="'+(H-6)+'" text-anchor="end">'+fmtDate(all[all.length-1].d)+'</text></svg>';
}
function histReadTextFor(id,x){ return fmtDate(x.d)+': '+bestText(id,x.best)+(x.dl?', deload week':''); }
document.addEventListener('keydown',e=>{            // a point reached with the keyboard reads out like a tapped one
  const pt=e.target&&e.target.closest&&e.target.closest('[data-pt]');
  if(pt&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); histRead(+pt.dataset.pt); }
});
