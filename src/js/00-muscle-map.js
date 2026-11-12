/* ===== MUSCLE MAPS =====
   The body is MuscleMap's drawing: its shapes, credit and licence are in 00-muscle-data.js,
   which tools/muscle-data.mjs writes. This file is the app's own code that lights it.

   A lift names its muscles by zone id (EX[id].prim and .sec). The two lists below say which
   view each zone is at home in: a view is shown when one of the lift's zones lives there.
   In a view that is shown, a zone lights every shape it has there (the side of the shoulder,
   the forearm and the calf can be seen from both sides). */
const FRONT_ZONES={uchest:1,chest:1,fdelt:1,sdelt:1,biceps:1,forearm:1,abs:1,obliques:1,quads:1,fcalf:1};
const BACK_ZONES={traps:1,rdelt:1,lats:1,midback:1,lowerback:1,triceps:1,glutes:1,hams:1,bcalf:1};
/* prim zones are drawn strong, sec zones outlined; every other muscle stays part of the grey figure */
function muscleMap(side, prim, sec){
  const view = side === 'back' ? 'back' : 'front', v = BODY[view];
  prim = prim || []; sec = sec || [];
  const any = (list, zs) => zs.some(z => list.indexOf(z) >= 0);
  let h = '<svg class="body" data-view="' + view + '" viewBox="' + BODY_VB + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<path class="silo" d="' + v.o + '"/>';
  v.m.forEach(m => {
    const zs = m[0] ? m[0].split(' ') : [];
    h += '<path class="mz' + (any(prim, zs) ? ' on' : any(sec, zs) ? ' sec' : '') + '"' + (m[0] ? ' data-z="' + m[0] + '"' : '') + ' d="' + m[1] + '"/>';
  });
  return h + '</svg>';
}
const ZN={uchest:'Upper chest',chest:'Chest',fdelt:'Front delts',sdelt:'Side delts',biceps:'Biceps',forearm:'Forearms',abs:'Abs',obliques:'Obliques',quads:'Quads',fcalf:'Shins',traps:'Traps',rdelt:'Rear delts',lats:'Lats',midback:'Mid-back',lowerback:'Lower back',triceps:'Triceps',glutes:'Glutes',hams:'Hamstrings',bcalf:'Calves'};
