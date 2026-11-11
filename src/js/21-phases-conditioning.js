/* ---- PHASES ----------------------------------------------------
   Thirteen weeks in three phases. Training and conditioning lines are the
   same for everyone; eating lines and the outcome depend on the goal:
   lose (lose fat, or lose slowly and build), hold (stay at this weight),
   gain (build muscle). */
const PHASES=[
 {n:1, name:'Groundwork', sub:'Weeks 1–4', w:[1,4], color:'steel',
  goal:'Build the habit and the technique. Leave two or three reps in hand and learn how every lift should feel.',
  train:['Every set clean, stopping two or three reps before failure.','Log every session from day one: week 1 is your baseline.','Add weight only when the logbook tells you to.'],
  eat:{
   lose:['Hit your protein every day. Everything else comes second.','Settle into your calorie target and find five meals you can repeat.','Eat vegetables and drink water early in the day, so you are not hungry at night.'],
   hold:['Hit your protein every day.','Eat at your target and keep your meals regular.'],
   gain:['Hit your protein every day.','Reach your calorie target: a small surplus only works if you actually eat it.','Add food to the meals around training first.']},
  cond:['Build your daily steps by about 1,000 a week.','Zone 2 twice a week, 25–30 minutes. It should feel easy.','No hard intervals yet: build the easy base first.'],
  out:{
   lose:'Usually 1.5 to 3 kg down, some of it water. Clothes looser, technique solid.',
   hold:'Technique solid, every lift logged, the routine in place.',
   gain:'Technique solid and the first small increases on the bar.'}},
 {n:2, name:'Overload', sub:'Weeks 5–8', w:[5,8], color:'ember',
  goal:'Now you push. Take sets to one or two reps before failure and add weight whenever the range is filled.',
  train:['Main lifts one or two reps from failure; small lifts to the last clean rep.','Add the smallest jump as soon as every set reaches the top of the range.','Week 6 is a deload: about 10% lighter and one set fewer.'],
  eat:{
   lose:['Hold the calorie target.','Put most of your carbs in the meals around training.','Weekends count: that is where a week is most often undone.'],
   hold:['Keep eating at your target.','Put most of your carbs in the meals around training.'],
   gain:['Keep the surplus small and steady.','If the scale has not moved in two weeks, add about 150 kcal a day.']},
  cond:['About 8,500 steps a day.','Zone 2 three times a week.','One interval session a week if you want it, never the day before you train legs.'],
  out:{
   lose:'A steady loss week to week, stronger lifts, a smaller waist.',
   hold:'Stronger on every main lift at the same bodyweight.',
   gain:'Weight creeping up slowly and clear increases in the logbook.'}},
 {n:3, name:'Refinement', sub:'Weeks 9–13', w:[9,13], color:'ember',
  goal:'Hold the heavy work, tidy the details, and finish strong.',
  train:['Keep the main lifts heavy: that is what keeps your muscle.','On small lifts you may take the last set to failure.','Week 12 is a deload, then one hard final week.'],
  eat:{
   lose:['Hold the deficit. If you feel worn down, eat at maintenance for 3 to 5 days, then go back.','Watch the oil and ghee your food is cooked in: that is where calories hide.','Protein stays high.'],
   hold:['Keep doing what works.','Protein stays high.'],
   gain:['Keep the surplus small.','If your waist grows faster than your lifts, take 100–150 kcal a day off.']},
  cond:['About 9,500 steps a day.','Zone 2 twice a week; intervals up to twice if your lifts are not dropping. One is enough on a three-day plan.'],
  out:{
   lose:'Your leanest point of the block, with your strength intact.',
   hold:'A stronger, fitter version of the same bodyweight.',
   gain:'A few kilos heavier, most of it muscle, and stronger on everything.'}}
];

/* ---- CONDITIONING -----------------------------------------------
   Three tools, deliberately dosed. Steps do most of the work at almost no
   recovery cost; Zone 2 builds fitness; intervals are a small, late addition. */
const COND={
 1:{steps:'Build to 8k', z2:2, z2min:'25–30 min', hiit:0,
    note:'No intervals in this phase: steps and easy Zone 2 only.'},
 2:{steps:'8–9k',  z2:3, z2min:'30–35 min', hiit:1,
    note:'Intervals may start now, once a week. Never the day before you train legs.'},
 3:{steps:'9–10k', z2:2, z2min:'30–40 min', hiit:2,
    note:'Your fittest phase. Up to two interval sessions; one is enough on a three-day plan. Cut the intervals first if your lifts start to drop.'}
};
const CONDTOOLS=[
 {k:'steps', n:'Daily steps', tag:'The biggest lever',
  b:`Walking burns real calories at <b>almost no recovery cost</b>, so it never competes with your lifting. Build it by about 1,000 steps a week instead of jumping straight to 10,000.`,
  how:`A 10–15 minute walk after each meal · take phone calls on your feet · a walk after dinner · an incline treadmill while you watch something.`},
 {k:'z2', n:'Zone 2', tag:'Easy, steady cardio',
  b:`A pace you could <b>hold a conversation at</b>: roughly 60–70% of your top heart rate. It builds fitness and helps you recover, with almost no cost to your strength. If you can speak in full sentences but would not want to sing, you are in it.`,
  how:`Incline treadmill walk, stationary bike or elliptical: easy on the joints, so your legs stay fresh. Do it on a rest day or <em>after</em> lifting, never before.`},
 {k:'hiit', n:'Intervals', tag:'A small dose, from phase 2',
  b:`Hard intervals build fitness fast but are <b>costly to recover from</b>, so the dose stays small and starts only once the easy base is there. If your lifts start to drop, this is the first thing to cut.`,
  how:`8–10 rounds of <b>20 seconds hard, 60–90 seconds easy</b> on a bike, rower or incline. Twenty minutes in all, warm-up included. On a rest day, or straight after a lifting session (after upper body, if your plan has upper-body days). Keep them off the day before you train legs.`}
];
const CARDIO_DEMOS=[
 ['Incline treadmill walk','Zone 2 · easiest on the joints'],
 ['Stationary bike Zone 2','Zone 2 · keeps legs fresh'],
 ['Rowing machine HIIT intervals','Intervals · full body'],
 ['Assault bike HIIT 20 seconds','Intervals · hardest, shortest']
];
