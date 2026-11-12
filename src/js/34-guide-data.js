const PORTIONS=[
 ['Whole egg','1 egg',75,'6 g'],
 ['Chicken breast','1 palm (~100 g cooked)',165,'31 g'],
 ['Fish, grilled','1 palm (~100 g cooked)',130,'24 g'],
 ['Lean beef, cooked','1 palm (~100 g)',200,'28 g'],
 ['Lean qeema, light oil','1 small bowl (~150 g)',250,'30 g'],
 ['Cooked rice','1 cup (2 cupped hands)',205,'4 g'],
 ['Chapati, small','1 thin (~45 g cooked)',120,'4 g'],
 ['Roti, large','1 home size (~70 g cooked)',200,'7 g'],
 ['Oats, cooked','1 cup (40 g dry)',150,'5 g'],
 ['Daal, cooked','1 cup',220,'14 g'],
 ['Dahi','1 cup',150,'8 g'],
 ['Milk, full-fat','1 glass (250 ml)',155,'8 g'],
 ['Whey protein','1 scoop',120,'24 g'],
 ['Cooking oil / ghee','1 thumb (1 tablespoon)',120,'0 g'],
 ['Oil a dish is cooked in','2–3 thumbs per plate',300,'0 g'],
 ['Peanut butter','1 thumb (1 tablespoon)',95,'4 g'],
 ['Almonds','1 small handful (~20)',145,'5 g']
];
const HUNGRY=[
 'Add vegetables or salad: close to free.',
 'Add protein (eggs, dahi, whey) before carbs or fat.',
 'Drink a glass of water. It is easy to mistake thirst for hunger.',
 'Black coffee or plain tea takes the edge off for an hour.'
];
const DAWAT=[
 'Choose the grilled or roast meat (tikka, seekh, roast) over the curry.',
 'One portion of rice <b>or</b> naan. Not both.',
 'Fill up on salad and raita; go easy on creamy gravies.',
 'Skip the sugary drink. Water, or a diet soda.',
 'One big meal does not undo 91 days. Go back to the plan at the next meal, not tomorrow.'
];

/* ---- REFERENCE GUIDE (sheet) ------------------------------------
   An entry's body is text, or a function that returns text for this person. */
const GUIDE=[
 {t:'Where your numbers come from', b:()=>{
   const t=targets(), g=S.profile.goal;
   const why={
    cut:'A deficit of about a fifth is large enough to see the scale move every week and small enough to keep your muscle. Crash diets burn muscle, wreck your lifts and bounce back.',
    recomp:'A small deficit lets you lose fat slowly while you gain or keep muscle. It works best if you are new to lifting or coming back after a break.',
    maintain:'You eat what you burn. Your weight stays where it is while the training changes what it is made of.',
    gain:'A small surplus is all muscle growth can use. A bigger one only adds fat that has to come off later.'}[g];
   return '<p>Your targets are worked out from the numbers in Settings with the <b>Mifflin–St Jeor</b> equation, the most accurate simple formula for most people.</p>'
    +'<div class="tw" style="margin-top:10px"><table><tbody>'
    +'<tr><td>What your body burns at rest</td><td class="n">'+t.bmr.toLocaleString()+' kcal</td></tr>'
    +'<tr><td>× activity outside the gym</td><td class="n">× '+esc(S.profile.act)+'</td></tr>'
    +'<tr><td>What you burn in a day</td><td class="n">'+t.tdee.toLocaleString()+' kcal</td></tr>'
    +'<tr><td>Your target ('+esc(GOAL_NAME[g].toLowerCase())+')</td><td class="n">'+t.kcal.toLocaleString()+' kcal</td></tr>'
    +'<tr><td>Protein</td><td class="n">'+t.prot+' g</td></tr>'
    +'</tbody></table></div>'
    +'<p style="margin-top:10px">'+why+'</p>'
    +(t.floored?'<p style="margin-top:10px"><b>Your target is at the safe minimum.</b> The app does not go below 1,200 kcal a day for women or 1,500 for men. Eating less than that needs a doctor.</p>':'')
    +'<p style="margin-top:10px">Protein is set per kilo of bodyweight. If you carry a lot of extra weight, it is set on the weight a lean body of your height would carry, so the number stays realistic.</p>'
    +'<p style="margin-top:10px">These are estimates. Your real numbers show after two or three weeks of honest logging. <b>Adjust to the trend, not the formula.</b></p>';
 }},
 {t:'Heavy, medium or light: which lift gets which', b:()=>{
   const by={heavy:[], medium:[], light:[], body:[], hold:[]};
   Object.keys(EX).forEach(id=>{ const e=EX[id], t=e.typ;
     (by[e.band]||by.medium).push(esc(e.name)+' <span style="color:var(--text-faint)">'+(t.hold?t.hold[0]+'–'+t.hold[1]+' s':t.reps[0]+'–'+t.reps[1])+'</span>'); });
   const row=(k,note)=>by[k].length?'<div class="swap"><div class="sw-h"><b>'+BAND_NAME[k]+'</b><span class="pill">'+note+'</span></div><ul class="klist">'+by[k].map(x=>'<li>'+x+'</li>').join('')+'</ul></div>':'';
   return '<p><b>Heavy</b> means a weight you lift up to about 10 times in a set. <b>Medium</b> is about 8 to 15. <b>Light</b> is about 10 to 20. Light does not mean easy: at every weight the last reps of the set are hard. How many to leave at the end depends on your phase: two or three in weeks 1–4, one or two after that.</p>'
    +'<p style="margin-top:10px">Your plan sets the exact reps for each lift. Follow the reps on the card; the list below shows each lift\'s usual range.</p>'
    +'<p style="margin-top:10px">Muscle grows at any of these weights as long as the set ends hard. What differs is which weight lets a lift be done well. The more of your body a lift uses and the steadier the weight is held, the heavier it can go. The smaller the muscle and the further the weight is from the joint, the lighter it has to be, or other muscles and a swing take over.</p>'
    +row('heavy','up to 10 reps')+row('medium','about 8–15 reps')+row('light','about 10–20 reps')+row('body','your own weight')+row('hold','seconds')
    +'<p style="margin-top:12px">On the Strength plan the big barbell lifts go heavier still, 3 to 5 reps. Each exercise card says why that lift sits where it does.</p>';
 }},
 {t:'Reading the angles on an exercise card', b:()=>{
   const row=(k,d,t)=>'<div class="ang">'+dial(k,d)+'<div class="ang-t"><span class="ang-h"><b>'+t[0]+'</b></span><span class="ang-w">'+t[1]+'</span></div></div>';
   return '<p>Every exercise card has a block called <b>Angles, grip and range</b>, above the logbook. Each angle has a small drawing: the <b>dashed line</b> is what the angle is measured from, and the <b>solid line</b> is where your body or the bench should be.</p>'
    +'<p style="margin-top:10px">Three sizes are worth knowing by eye: <b>90°</b> is a right angle, the corner of a door. <b>45°</b> is half of that. <b>30°</b> is the gap between two neighbouring numbers on a clock face.</p>'
    +'<div class="angs" style="margin-top:12px">'
    +row('up',30,['Up from flat','A bench or your body, measured up from level. 0° is flat, 90° is fully upright.'])
    +row('lean',15,['From upright','How far something tips over from straight up: a lean of the body, or toes turned out from straight ahead.'])
    +row('out',45,['Out from your side','How far the upper arm is from hanging straight down. 0° is against your ribs, 90° is level with your shoulder.'])
    +row('bend',90,['Bend at a joint','How far an elbow, a knee or the hips are bent. 0° is dead straight, 90° is a right angle.'])
    +row('bend',[100,0,'move'],['A shaded band','A range: either anywhere between two numbers, or how far the joint travels during the rep.'])
    +'</div>'
    +'<p style="margin-top:12px">The numbers are guides, not laws. Bodies differ: if a position hurts, stop short of it. The line under each number says the same thing in plain words, and <b>Like</b> gives you a picture to hold in your head while you lift.</p>';
 }},
 {t:'Deload weeks: what they are and why', b:()=>deloadText()},
 {t:'Reading the trend, and when to change something', b:`
  <p>Judge on <b>two to three weeks</b>, never one week and never one morning.</p>
  <div class="tw" style="margin-top:10px"><table>
  <thead><tr><th>What the trend shows</th><th>What you do</th></tr></thead><tbody>
  <tr><td>Moving at the pace your goal asks for</td><td>Nothing. It is working.</td></tr>
  <tr><td>Losing fat: weight and waist flat for 2–3 weeks</td><td>Take 150–200 kcal a day off carbs or fat, or add 1,000 steps. Not both. If your target is already at the safe minimum, add the steps and do not cut food.</td></tr>
  <tr><td>Losing more than 1% of your bodyweight a week (after the first two weeks)</td><td>Add about 150 kcal a day. You are likely losing muscle too.</td></tr>
  <tr><td>Building muscle: no gain for 2–3 weeks</td><td>Add about 150 kcal a day.</td></tr>
  <tr><td>Lifts dropping across the board</td><td>Cut cardio first, then eat more. Never cut protein or sleep.</td></tr>
  <tr><td>Worn down, sleeping badly</td><td>Eat at maintenance for 3–7 days, then go back.</td></tr>
  </tbody></table></div>`},
 {t:'Why stubborn fat goes last', b:`
  <p>Fat is not stored evenly, and it does not leave evenly. Most men store it last-out around the lower belly; most women around the hips and thighs. Those areas release fat more slowly and lean out last. That is normal physiology, not a personal failing.</p>
  <p style="margin-top:10px">You cannot train fat off one spot. When you eat less than you burn, your body takes fat from <b>all over</b>; you do not choose where. Training your abs builds the muscle underneath. It does not remove what sits on top.</p>
  <p style="margin-top:10px">So it is two separate jobs: <b>train the muscle</b>, and <b>lose the fat with the deficit, the steps and the lifting</b>. Keep doing both and the stubborn areas follow.</p>`},
 {t:'Recovery is where it happens', b:`
  <ul class="klist">
  <li><b>Sleep 7–9 hours at regular times.</b> Poor sleep raises hunger and makes everything else harder. It is the most valuable thing on this list.</li>
  <li><b>Keep coffee and tea at least eight hours before bed.</b></li>
  <li><b>Protect some quiet time.</b> Long-term stress slows fat loss and drives cravings. A walk, prayer, breathing, time away from the phone.</li>
  <li><b>5–10 minutes of mobility a day</b> for the hips, upper back and shoulders: the three things sitting stiffens most.</li>
  <li><b>Drink enough water.</b> Being a little dry is easy to mistake for hunger and tiredness.</li>
  </ul>
  <p style="margin-top:12px">Check yourself most mornings against this table. <b>Two reds: take an easy day.</b> That call is what prevents the injury that ends a block.</p>
  <div class="tw" style="margin-top:10px"><table>
  <thead><tr><th>Signal</th><th>Green</th><th>Yellow</th><th>Red</th></tr></thead><tbody>
  <tr><td>Sleep</td><td>7–9 h</td><td>6–7 h</td><td>under 6 h, repeatedly</td></tr>
  <tr><td>Resting heart rate</td><td>your usual</td><td>+5 bpm</td><td>+10 bpm</td></tr>
  <tr><td>Joints</td><td>pain-free</td><td>small aches</td><td>an ache that stays</td></tr>
  <tr><td>Gym</td><td>reps rising</td><td>flat</td><td>dropping</td></tr>
  <tr><td>Drive</td><td>keen</td><td>so-so</td><td>flat, irritable</td></tr>
  </tbody></table></div>`},
 {t:'The mistakes that stop progress', b:`
  <p>Programs rarely fail. These do. Read this list whenever progress stalls: the cause is almost always here.</p>
  <ul class="klist" style="margin-top:10px">
  <li><b>Big weekends.</b> A 500 kcal deficit on weekdays, wiped out by two big weekend days, adds up to nothing. It is the most common cause, and you cannot see it unless you count.</li>
  <li><b>Changing program too often.</b> Switching every two weeks prevents the steady increase that drives everything. Run a block to the end.</li>
  <li><b>Too much weight, half the range.</b> Half reps build very little and cost your joints.</li>
  <li><b>Too many intervals.</b> They feel productive and quietly wear down your lifting. Keep them capped.</li>
  <li><b>Never taking a deload.</b> This is how people stall for months and blame the program.</li>
  <li><b>Calories you drink.</b> Sweet tea, juice and soft drinks add up without you noticing.</li>
  <li><b>Dense "healthy" foods.</b> Ghee, oil, nuts and peanut butter are good foods and very high in calories. Measure them honestly.</li>
  <li><b>Watching the daily number.</b> Weight zig-zags every day. Use the 7-day average and ignore the rest.</li>
  </ul>`},
 {t:'What 91 days can do', b:()=>{
   const rows={
    lose:['<b>About '+Math.max(1,Math.round(-targets().weekly*13))+' kg lost</b> at the pace your target sets. The scale may show a little more once water settles.','<b>Some muscle gained or all of it kept</b>, depending on how long you have trained.','<b>Waist down several centimetres.</b>','<b>Main lifts up</b>, even while eating less: 5–15% is common.'],
    hold:['<b>The same weight, made of more muscle and less fat.</b>','<b>Main lifts up 10–20%.</b>','<b>Fitter</b>: a lower resting heart rate and easier stairs.'],
    gain:['<b>0.5–1.5 kg of muscle</b> for most people past the beginner stage; 2–3 kg in a first year of lifting. Women gain about half as fast.','<b>Main lifts up 10–25%.</b>','<b>A little fat comes with it.</b> Keeping the surplus small keeps that small.']}[goalClass()];
   return '<p>Plainly, with no inflation:</p><ul class="klist" style="margin-top:10px">'+rows.map(r=>'<li>'+r+'</li>').join('')+'</ul>'
    +'<p style="margin-top:12px">Ninety-one days build the habits and the strength base. A big change in bodyweight usually takes two or three blocks. When this one ends, start the next: same plan or a new target.</p>';
 }}
];
