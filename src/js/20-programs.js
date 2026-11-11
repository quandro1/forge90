
/* ===== PROGRAMS ===== */


/* ===================================================================
   FORGE 90 — program data
   Engine above (figures, muscle maps, EX library, warm-ups) is ported
   from the June visual manual. Everything below is the new system.
   =================================================================== */

/* ---- ONE MISSING MOVEMENT ---------------------------------------
   The ported library has no hip hinge for glutes. Added here rather than
   editing the engine, so the engine stays a clean drop-in. */
EX.hipthrust={name:`Barbell Hip Thrust`, tag:`Glutes`, f:['quads'], b:['glutes','hams'],
  sets:'4', reps:'8–12', rest:'90s',
  cue:`Shoulder blades on the bench, chin tucked, <b>ribs down</b>. Drive through the heels and squeeze the glutes hard for a full second at the top — the lockout <em>is</em> the exercise, not the depth.`};
// its AVOID note is attached further down, where the AVOID map is declared

/* ---- SPLITS ------------------------------------------------------
   Rebalanced 2026-08-17. The previous version trained legs once a week
   against four upper days, ran 27 weekly sets of back with two exercises
   duplicated across days, and had no direct glute work at all. */
const PROGRAMS={
 five:{
  label:'5-Day', days:[1,2,3,4,5],
  list:[
   {tag:'DAY 1 / PUSH', name:'Chest & Shoulders', focus:'Heavy incline first, then width', warm:'push',
    ex:['inclineBB','pecdeck','machPress','latRaise','pushdown']},
   {tag:'DAY 2 / PULL', name:'Back Width & Biceps', focus:'Vertical pulling for the taper, arms last', warm:'pull',
    ex:['pullup','pulldown','cableRow','straightArm','reardelt','bbCurl']},
   {tag:'DAY 3 / LEGS', name:'Quads & Core', focus:'Squat, press, and a braced midsection', warm:'legs',
    ex:['squat','legpress','legext','legcurl','calf','hangraise','cablecrunch']},
   {tag:'DAY 4 / DELTS + ARMS', name:'The V-Taper Day', focus:'Second dose of delts and upper chest — this is the shape day', warm:'push',
    ex:['dbPress','inclineDB','latRaise','cableLat','facepull','dbCurl','ohext']},
   {tag:'DAY 5 / POSTERIOR', name:'Glutes, Hams & Thickness', focus:'The hinge day — plus horizontal rowing for back depth', warm:'legs',
    ex:['hipthrust','rdl','bulgarian','legcurl','csRow','dbRow','pallof']}
  ]},
 four:{
  label:'4-Day', days:[1,2,4,5],
  list:[
   {tag:'DAY 1 / UPPER A', name:'Push Emphasis', focus:'Incline press, shoulders, a row to keep it balanced', warm:'push',
    ex:['inclineBB','machPress','latRaise','cableRow','facepull','bbCurl']},
   {tag:'DAY 2 / LOWER A', name:'Quads & Core', focus:'Squat-led, core to finish', warm:'legs',
    ex:['squat','legpress','legext','legcurl','calf','hangraise']},
   {tag:'DAY 3 / UPPER B', name:'Pull Emphasis', focus:'Back width and thickness, upper chest, delts', warm:'pull',
    ex:['pulldown','csRow','inclineDB','dbPress','latRaise','reardelt','pushdown']},
   {tag:'DAY 4 / LOWER B', name:'Glutes & Hamstrings', focus:'The hinge day, plus anti-rotation core', warm:'legs',
    ex:['hipthrust','rdl','bulgarian','calf','pallof','cablecrunch']}
  ]}
};
