const PORTIONS=[
 ['Whole egg','1 egg',75,'6 g'],
 ['Chicken breast','1 palm (~150 g)',240,'45 g'],
 ['Lean beef / qeema','1 palm (~150 g)',300,'40 g'],
 ['Cooked rice','1 cupped hand',205,'4 g'],
 ['Chapati','1 medium',120,'4 g'],
 ['Daal, cooked','1 cup',220,'14 g'],
 ['Dahi','1 cup',150,'8 g'],
 ['Milk, full-fat','1 glass (250 ml)',150,'8 g'],
 ['Whey protein','1 scoop',120,'24 g'],
 ['Cooking oil / ghee','1 thumb (tbsp)',120,'0 g'],
 ['Oil a dish is cooked in','2–3 thumbs per plate',300,'0 g'],
 ['Peanut butter','1 thumb (tbsp)',95,'4 g'],
 ['Almonds','1 small handful',145,'5 g']
];
const HUNGRY=[
 'Add vegetables or salad — near enough free.',
 'Add protein (eggs, dahi, whey) before carbs or fat.',
 'Drink a glass of water. Thirst imitates hunger almost exactly.',
 'Black coffee or plain chai blunts appetite for an hour.'
];
const DAWAT=[
 'Pick the grilled or roast meat — tikka, seekh, roast — over the curry.',
 'One portion of rice <b>or</b> naan. Not both.',
 'Load the salad and raita, go easy on creamy gravies.',
 'Skip the sugary drink. Water, or a diet soda.',
 'One indulgence does not derail 91 days. Back to plan at the next meal — not tomorrow.'
];

/* ---- REFERENCE GUIDE (sheet) ------------------------------------ */
const GUIDE=[
 {t:'Why the lower belly goes last', b:`
  <p>This is your stated problem area, so here is the honest version. Fat is not stored evenly. In men the lower abdomen is a preferred storage depot with a higher density of <b>alpha-2 adrenergic receptors</b> — which act as a brake on fat release — and poorer blood flow. It mobilises slowly and it leans out last. That is normal physiology, not a personal failing.</p>
  <p style="margin-top:10px">And you cannot crunch it off. In a deficit your body pulls fat from stores <b>system-wide</b> through circulating hormones; you do not get to choose the withdrawal location. Training abs builds the muscle underneath — it does not melt what sits on top of it.</p>
  <p style="margin-top:10px">So it is two separate jobs. <b>Train the core for thickness</b>, and <b>lose the fat with the deficit, the steps and the lifting.</b> Abs show up somewhere around 10–12% body fat. Do both and they appear on schedule.</p>`},
 {t:'Where your numbers come from', b:`
  <p>Nothing here is a guess pulled from an app. Your targets recalculate from the stats in Settings using <b>Mifflin–St Jeor</b>, the most accurate predictive formula for the general population.</p>
  <div class="tw" style="margin-top:10px"><table><tbody>
  <tr><td>Resting burn (BMR)</td><td class="n" id="g-bmr">—</td></tr>
  <tr><td>× activity factor</td><td class="n" id="g-act">—</td></tr>
  <tr><td>Maintenance (TDEE)</td><td class="n" id="g-tdee">—</td></tr>
  <tr><td>Target — about 20% under</td><td class="n" id="g-cut">—</td></tr>
  </tbody></table></div>
  <p style="margin-top:10px">Why not cut harder? Because <b>recomposition is the whole point</b>. A moderate deficit is what lets you lose fat while holding — even adding — muscle. Crash deficits burn muscle, wreck your lifts and rebound. Around 500 kcal is the sweet spot at your body fat.</p>
  <p style="margin-top:10px">These are estimates. Your real maintenance shows up after 2–3 weeks of honest logging. <b>Adjust to the trend, not the formula.</b></p>`},
 {t:'Reading the trend, and when to change something', b:`
  <p>Judge on a <b>2–3 week trend</b>, never a single week, and never a single morning.</p>
  <div class="tw" style="margin-top:10px"><table>
  <thead><tr><th>What the trend shows</th><th>What you do</th></tr></thead><tbody>
  <tr><td>Losing 0.4–0.65 kg/wk, waist coming down</td><td>Nothing. It is working.</td></tr>
  <tr><td>Weight and waist flat for 2–3 weeks</td><td>Cut ~150–200 kcal from carbs or fat, or add 1,000 steps. Not both.</td></tr>
  <tr><td>Losing more than 1% of bodyweight a week</td><td>Add ~150 kcal back. You are cutting muscle.</td></tr>
  <tr><td>Lifts dropping across the board</td><td>Cut cardio first, then eat more. Never cut protein or sleep.</td></tr>
  <tr><td>Beaten up, sleeping badly</td><td>3–7 days at maintenance, then resume. This is a feature.</td></tr>
  </tbody></table></div>`},
 {t:'Recovery is where it actually happens', b:`
  <ul class="klist">
  <li><b>Sleep 7–9 h at consistent times.</b> Poor sleep raises hunger hormones and cortisol and makes the whole diet feel ten times harder. It is the highest-leverage thing on this list.</li>
  <li><b>Keep caffeine before 3 PM.</b> You train in the morning, so this one is easy — do not undo it with evening chai.</li>
  <li><b>Protect a decompress window.</b> Chronic stress blunts fat loss and drives cravings. A walk, prayer, breathing, time off the phone.</li>
  <li><b>5–10 min of mobility daily</b> on hips, T-spine and shoulders — the three things a desk and a phone stiffen most.</li>
  <li><b>3.5–4 L of water.</b> Mild dehydration reads as hunger and fatigue almost exactly.</li>
  </ul>
  <p style="margin-top:12px">Check yourself most mornings against this. <b>Two reds means take an easy day or pull the deload forward</b> — that judgement call is what prevents the injury that ends a 90-day block.</p>
  <div class="tw" style="margin-top:10px"><table>
  <thead><tr><th>Signal</th><th>Green</th><th>Yellow</th><th>Red</th></tr></thead><tbody>
  <tr><td>Sleep</td><td>7–9 h</td><td>6–7 h</td><td>&lt;6 h, repeatedly</td></tr>
  <tr><td>Resting HR</td><td>baseline</td><td>+5 bpm</td><td>+10 bpm</td></tr>
  <tr><td>Joints</td><td>pain-free</td><td>niggles</td><td>persistent ache</td></tr>
  <tr><td>Gym</td><td>reps rising</td><td>flat</td><td>dropping</td></tr>
  <tr><td>Drive</td><td>motivated</td><td>meh</td><td>flat, irritable</td></tr>
  </tbody></table></div>`},
 {t:'The mistakes that actually kill transformations', b:`
  <p>Programs rarely fail. These do. Scan this list whenever progress stalls — the culprit is almost always here.</p>
  <ul class="klist" style="margin-top:10px">
  <li><b>Weekend blowouts.</b> A 500 kcal weekday deficit erased by two big weekend days nets zero. This is the number one cause and it is invisible unless you count.</li>
  <li><b>Program hopping.</b> Switching every two weeks prevents the overload that drives everything. Run this block to the end.</li>
  <li><b>Ego lifting.</b> Half-reps with too much weight build very little and cost joints.</li>
  <li><b>Too much HIIT.</b> Intervals feel productive and quietly wreck your lifts. Keep them capped.</li>
  <li><b>Never deloading.</b> This is how intermediates stall for months and blame the program.</li>
  <li><b>Liquid calories.</b> Sweet chai, juice and soft drinks add up completely invisibly.</li>
  <li><b>"Healthy" calorie bombs.</b> Ghee, oil, nuts and peanut butter are fine foods and extremely dense. Eyeball them honestly.</li>
  <li><b>Scale obsession.</b> Weight zig-zags daily. You already have the 7-day average — use it and ignore the rest.</li>
  </ul>`},
 {t:'What 90 days actually gets you', b:`
  <p>Straight, no inflation:</p>
  <ul class="klist" style="margin-top:10px">
  <li><b>5–7 kg of fat lost.</b> The scale may show 6–8 once water and glycogen settle.</li>
  <li><b>0.5–1.5 kg of muscle gained.</b> Modest as a number, dramatic in how it reshapes you.</li>
  <li><b>Waist down 5–8 cm.</b> Upper abs and obliques start showing.</li>
  <li><b>Main lifts up 10–20%</b>, even while dieting.</li>
  <li><b>Conditioning transformed</b> from a sedentary baseline.</li>
  </ul>
  <p style="margin-top:12px">And the honest part: <b>75 kg is a 6–9 month goal, not a 90-day one.</b> You said so yourself. Chasing it in 90 days would mean sacrificing the muscle you are here to build. These 13 weeks build the habits, the strength base and the visible momentum that make the back half close to inevitable.</p>`}
];

/* ===================================================================
   FORGE 90 — application
   =================================================================== */
