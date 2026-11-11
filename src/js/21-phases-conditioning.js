
/* ---- PHASES ---------------------------------------------------- */
const PHASES=[
 {n:1, name:'Foundation', sub:'Weeks 1–4', w:[1,4], color:'steel',
  goal:'Build the habit and the technique. Fat loss comes free from the deficit — you are not chasing it yet.',
  train:['Groove every main lift at RPE 6–8. Perfect reps, submaximal loads.','Learn what side delts and lats actually feel like working.','Log every session from day one — week 1 is your baseline.'],
  eat:['Hit protein daily. This is the keystone; everything else is secondary.','Settle into the calorie target and find your five go-to meals.','Front-load vegetables and water so you are not hungry at night.'],
  cond:['Steps from ~4k to 8k, adding about 1,000 a week.','Zone 2 twice a week, 25–30 min. It should feel easy.','No HIIT yet — you have no base to spend.'],
  out:'2–3 kg down, much of it water and glycogen. Less bloated, clothes looser, technique solid.'},
 {n:2, name:'Overload', sub:'Weeks 5–8', w:[5,8], color:'ember',
  goal:'Now you push. Double progression hard, while the deficit keeps running underneath.',
  train:['Compounds to RPE 7–9. Add load the moment you hit the rep ceiling.','Bias volume to side delts, upper chest and back width.','Light deload in week 6 if two recovery flags go red.'],
  eat:['Hold the calorie target. One higher-carb day a week if you want it.','Put carbs around training, not late at night.','Weekends count. This is where most people quietly undo the week.'],
  cond:['8–9k steps. Zone 2 two or three times.','Add HIIT once a week — never within 24 h of legs.','Cut HIIT first if your lifts start sliding.'],
  out:'Steady ~0.5 kg/week. Stronger, fuller muscles, waist tightening. The recomp look starts: same-ish scale, different shape.'},
 {n:3, name:'Refinement', sub:'Weeks 9–13', w:[9,13], color:'ember',
  goal:'Reveal what you banked. Hold the heavy work, add detail, finish sharp.',
  train:['Keep the compounds heavy — that is what protects the muscle.','Add intensity techniques on isolations only: myo-reps, drop sets.','Deload week 12, then a hard final week 13.'],
  eat:['Hold the deficit. Take a 3–5 day break at maintenance if you feel beaten up.','Audit the hidden oil and ghee — that is where the leak usually is.','Protein stays high. It is what keeps you looking full while leaning out.'],
  cond:['9–10k steps. Zone 2 twice, HIIT up to twice.','Conditioning is now part of how you look, not just a calorie burn.'],
  out:'Leanest, most athletic look of the 90 days. Visible taper, capped delts, upper abs showing.'}
];

/* ---- CONDITIONING -----------------------------------------------
   Three tools, deliberately dosed. Steps do the fat-loss work at almost no
   recovery cost; Zone 2 builds the engine; HIIT is a small, late addition. */
const COND={
 1:{steps:'Build to 8k', z2:2, z2min:'25–30 min', hiit:0,
    note:'No HIIT this phase — you have no aerobic base to spend yet. Steps and easy Zone 2 only.'},
 2:{steps:'8–9k',  z2:3, z2min:'30–35 min', hiit:1,
    note:'HIIT enters now, once a week. Keep it at least 24 h away from leg day in both directions.'},
 3:{steps:'9–10k', z2:2, z2min:'30–40 min', hiit:2,
    note:'Peak conditioning. This is the phase where you start to look athletic, not just lean.'}
};
const CONDTOOLS=[
 {k:'steps', n:'Daily steps', tag:'Highest leverage',
  b:`You sit for most of the day outside the gym, so this is the biggest lever you own. Walking burns real calories at <b>near-zero recovery cost</b> — it never competes with your lifts, which is exactly why it beats piling on more cardio. Build it about 1,000 steps a week rather than jumping straight to 10k.`,
  how:`A 10–15 min walk after each meal · take calls on your feet · a loop after dinner · incline treadmill while you watch something.`},
 {k:'z2', n:'Zone 2', tag:'The aerobic base',
  b:`An intensity you could <b>hold a conversation at</b> — roughly 60–70% of max heart rate. It builds the engine, helps you recover, and burns fat with almost no interference to strength. If you can speak full sentences but would not want to sing, you are in it.`,
  how:`Incline treadmill walk, stationary bike or elliptical — low joint stress so your legs stay fresh. Put it on a rest day or <em>after</em> lifting, never hard cardio right before legs.`},
 {k:'hiit', n:'HIIT', tag:'Small dose, phase 2+',
  b:`Intervals build conditioning fast but are <b>expensive to recover from</b>, so the dose stays deliberately small and arrives only once your base is built. If your lifts start sliding, this is the first thing you cut — before Zone 2, and long before food.`,
  how:`8–10 rounds of <b>20 s hard / 60–90 s easy</b> on a bike, rower or incline. Twenty minutes total including the warm-up. Rest day, or after an upper-body session.`}
];
const CARDIO_DEMOS=[
 ['Incline treadmill walk','Zone 2 · easiest on the joints'],
 ['Stationary bike Zone 2','Zone 2 · keeps legs fresh'],
 ['Rowing machine HIIT intervals','HIIT · full body'],
 ['Assault bike HIIT 20 seconds','HIIT · hardest, shortest']
];

/* ---- MEAL TEMPLATE — built around a 9 AM session ---------------- */
