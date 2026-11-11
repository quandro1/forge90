/* ===== MUSCLE MAPS ===== */
const FRONT_ZONES={
 uchest:'<path class="Z" d="M44 49 H58 V58 H44 Z"/><path class="Z" d="M62 49 H76 V58 H62 Z"/>',
 chest:'<path class="Z" d="M43 59 H58 V70 Q50 73 43 70 Z"/><path class="Z" d="M62 59 H77 V70 Q70 73 62 70 Z"/>',
 fdelt:'<ellipse class="Z" cx="38" cy="51" rx="8" ry="9"/><ellipse class="Z" cx="82" cy="51" rx="8" ry="9"/>',
 sdelt:'<ellipse class="Z" cx="32" cy="53" rx="7" ry="10"/><ellipse class="Z" cx="88" cy="53" rx="7" ry="10"/>',
 biceps:'<rect class="Z" x="28" y="60" width="9" height="22" rx="4"/><rect class="Z" x="83" y="60" width="9" height="22" rx="4"/>',
 forearm:'<rect class="Z" x="27" y="84" width="8" height="24" rx="4"/><rect class="Z" x="85" y="84" width="8" height="24" rx="4"/>',
 abs:'<rect class="Z" x="51" y="74" width="8" height="9" rx="2"/><rect class="Z" x="61" y="74" width="8" height="9" rx="2"/><rect class="Z" x="51" y="85" width="8" height="9" rx="2"/><rect class="Z" x="61" y="85" width="8" height="9" rx="2"/><rect class="Z" x="51" y="96" width="8" height="9" rx="2"/><rect class="Z" x="61" y="96" width="8" height="9" rx="2"/>',
 obliques:'<path class="Z" d="M44 78 L50 76 V104 L45 102 Z"/><path class="Z" d="M76 78 L70 76 V104 L75 102 Z"/>',
 quads:'<rect class="Z" x="46" y="126" width="13" height="42" rx="6"/><rect class="Z" x="61" y="126" width="13" height="42" rx="6"/>',
 fcalf:'<rect class="Z" x="47" y="172" width="10" height="24" rx="5"/><rect class="Z" x="63" y="172" width="10" height="24" rx="5"/>'};
const BACK_ZONES={
 traps:'<path class="Z" d="M52 42 L68 42 L62 60 L58 60 Z"/>',
 rdelt:'<ellipse class="Z" cx="34" cy="52" rx="8" ry="9"/><ellipse class="Z" cx="86" cy="52" rx="8" ry="9"/>',
 lats:'<path class="Z" d="M44 58 Q40 60 41 84 L52 108 V72 Q48 64 44 58Z"/><path class="Z" d="M76 58 Q80 60 79 84 L68 108 V72 Q72 64 76 58Z"/>',
 midback:'<rect class="Z" x="53" y="58" width="14" height="16" rx="3"/>',
 lowerback:'<rect class="Z" x="52" y="92" width="7" height="20" rx="3"/><rect class="Z" x="61" y="92" width="7" height="20" rx="3"/>',
 triceps:'<rect class="Z" x="28" y="60" width="9" height="23" rx="4"/><rect class="Z" x="83" y="60" width="9" height="23" rx="4"/>',
 glutes:'<path class="Z" d="M45 110 Q44 126 52 126 V112 Z"/><path class="Z" d="M75 110 Q76 126 68 126 V112 Z"/><rect class="Z" x="52" y="110" width="16" height="16"/>',
 hams:'<rect class="Z" x="46" y="128" width="13" height="40" rx="6"/><rect class="Z" x="61" y="128" width="13" height="40" rx="6"/>',
 bcalf:'<rect class="Z" x="47" y="172" width="10" height="26" rx="5"/><rect class="Z" x="63" y="172" width="10" height="26" rx="5"/>'};
const SILHOUETTE='<circle class="silo" cx="60" cy="20" r="14"/><rect class="silo" x="54" y="31" width="12" height="9"/><path class="silo" d="M30 47 Q60 40 90 47 L74 112 H46 Z"/><rect class="silo" x="26" y="48" width="13" height="38" rx="6"/><rect class="silo" x="81" y="48" width="13" height="38" rx="6"/><rect class="silo" x="25" y="82" width="11" height="30" rx="5"/><rect class="silo" x="84" y="82" width="11" height="30" rx="5"/><path class="silo" d="M44 108 H76 V128 H44 Z"/><rect class="silo" x="45" y="124" width="15" height="48" rx="7"/><rect class="silo" x="60" y="124" width="15" height="48" rx="7"/><rect class="silo" x="46" y="168" width="11" height="32" rx="5"/><rect class="silo" x="63" y="168" width="11" height="32" rx="5"/>';
/* prim zones are drawn strong, sec zones lighter; everything else stays a faint outline */
function muscleMap(side, prim, sec){
  const zones = side === 'back' ? BACK_ZONES : FRONT_ZONES; let z = '';
  for (const k in zones) {
    const cls = prim.indexOf(k) >= 0 ? 'mz on' : (sec && sec.indexOf(k) >= 0 ? 'mz sec' : 'mz');
    z += zones[k].replace(/class="Z"/g, 'class="' + cls + '"');
  }
  return '<svg viewBox="0 0 120 205" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + SILHOUETTE + z + '</svg>';
}
const ZN={uchest:'Upper chest',chest:'Chest',fdelt:'Front delts',sdelt:'Side delts',biceps:'Biceps',forearm:'Forearms',abs:'Abs',obliques:'Obliques',quads:'Quads',fcalf:'Shins',traps:'Traps',rdelt:'Rear delts',lats:'Lats',midback:'Mid-back',lowerback:'Lower back',triceps:'Triceps',glutes:'Glutes',hams:'Hamstrings',bcalf:'Calves'};

/* ===== MACHINE SET-UP STEPS ===== */
const MACH_SETUP={
 cable:[['1','Set the pulley height the move needs &mdash; high, mid, or low.'],['2','Pick the handle; stand or sit so the cable is under tension at the start.']],
 plate:[['1','Adjust the seat so the handles/pads line up with the target muscle.'],['2','Back flat on the pad; full but controlled range.']],
 lat:[['1','Sit and lock your thighs under the knee pad so you do not lift off.'],['3','Set that pad snug.'],['2','Grab the wide bar just outside shoulder width.']],
 legpress:[['1','Back and hips flat against the pad.'],['2','Feet shoulder-width, mid-foot on the platform.']],
 legpad:[['1','Line the knee joint up with the machine pivot point.'],['2','Set the ankle roller just above your foot.']]};
