/* ===================================================================
   FOOD
   =================================================================== */
/* ---- FOOD DATABASE ----------------------------------------------
   [name, portion, kcal, protein, carbs, fat, id] in household portions.
   Figures are honest averages for home cooking, each for the portion its
   label names: a palm of meat is about 100 g cooked, a cup is a 250 ml cup.
   The oil a dish is cooked in varies more than anything else, so cooked
   dishes carry it and oil is also its own entry. The id lets the example day be built from these
   same numbers, so the plan and the counter can never disagree. */
const FOODCATS=[
 ['Protein', [
  ['Egg','1',75,6,1,5,'egg'],
  ['Egg white','1',17,4,0,0,'eggwhite'],
  ['Omelette, 3 egg','1',340,19,3,28,'omelette'],
  ['Chicken breast','1 palm ~100g cooked',165,31,0,4,'chicken'],
  ['Chicken karahi','1 plate',490,45,8,30,'karahi'],
  ['Chicken tikka','1 piece',220,30,2,10,'tikka'],
  ['Qeema','1 small bowl ~150g',390,30,5,28,'qeema'],
  ['Qeema, lean + light oil','1 small bowl ~150g',250,30,4,12,'qeemaLean'],
  ['Beef salan','1 cup + gravy',380,35,5,24,'beef'],
  ['Seekh kebab','1 (~80 g)',190,14,2,14,'seekh'],
  ['Fish, grilled','1 palm ~100g cooked',130,24,0,3,'fish'],
  ['Tuna, in water','1 small can',125,28,0,1,'tuna'],
  ['Paneer','100 g',265,18,3,20,'paneer'],
  ['Whey protein','1 scoop',120,24,3,2,'whey']
 ]],
 ['Carbs', [
  ['Chapati, small','1 thin, ~45 g cooked',120,4,24,2,'chapati'],
  ['Roti, large','1 home size, ~70 g cooked',200,7,40,2,'roti'],
  ['Naan, small','1, ~90 g',260,8,48,4,'naan'],
  ['Naan, tandoor','1, ~130 g',375,12,69,6,'naanL'],
  ['Paratha','1',360,7,40,19,'paratha'],
  ['Rice, cooked','1 cup',205,4,45,1,'rice'],
  ['Biryani','1 plate',600,25,75,22,'biryani'],
  ['Oats, cooked in water','1 cup (40 g dry)',150,5,27,3,'oats'],
  ['Bread, brown','2 slices',150,7,26,2,'bread'],
  ['Potato','1 medium',130,3,30,0,'potato'],
  ['Daal','1 bowl',220,14,32,4,'daal'],
  ['Chana / chole','1 cup',250,12,32,8,'chana']
 ]],
 ['Dairy', [
  ['Milk, full-fat','1 glass',155,8,12,8,'milk'],
  ['Dahi','1 cup',150,8,12,8,'dahi'],
  ['Greek yogurt, low-fat','~200 g (¾ cup)',130,20,7,3,'gyogurt'],
  ['Strained dahi, full-fat','~200 g',230,15,9,15,'hung'],
  ['Lassi, sweet','1 glass',220,8,30,7,'lassi'],
  ['Chai, with sugar','1 cup',120,3,14,5,'chaiSugar'],
  ['Chai, no sugar','1 cup',60,3,4,4,'chai']
 ]],
 ['Fruit & veg', [
  ['Banana','1',105,1,27,0,'banana'],
  ['Apple','1',95,1,25,0,'apple'],
  ['Orange / kinnow','1',60,1,15,0,'orange'],
  ['Mango','1 cup slices',100,1,25,1,'mango'],
  ['Dates','3 medium',66,1,18,0,'dates'],
  ['Guava','1',65,2,14,1,'guava'],
  ['Salad','1 plate',30,1,6,0,'salad'],
  ['Sabzi, light oil','1 bowl',120,3,12,7,'sabzi']
 ]],
 ['Snacks & fats', [
  ['Almonds','1 small handful ~20',145,5,5,13,'almonds'],
  ['Peanuts','1 small handful ~28g',165,7,5,14,'peanuts'],
  ['Roasted chana','1 handful ~30g',110,7,17,2,'rchana'],
  ['Peanut butter','1 thumb',95,4,3,8,'pb'],
  ['Oil / ghee','1 thumb',120,0,0,14,'oil'],
  ['Samosa','1',260,5,25,15,'samosa'],
  ['Soft drink','1 can, 330 ml',140,0,35,0,'softdrink']
 ]]
];
const FOOD={};
FOODCATS.forEach(c=>c[1].forEach(f=>{ FOOD[f[6]]=f; }));

/* ---- THE EXAMPLE DAY ---------------------------------------------
   A day of ordinary meals, built from the food list above. It is not one
   fixed menu: mealPlan() starts from these and adds or removes portions
   (LEVERS, in this order) until the day adds up to the person's own
   calories and protein. Quantities are multiples of the food's portion. */
const MEALPLAN={
 train:[
  {n:'Before training', tip:'Something light, 30–60 minutes before the session. Skip it if you train first thing and feel fine without.',
   items:[['banana',1],['dates',1]]},
  {n:'Breakfast', tip:'The biggest protein meal of the day. If you train in the morning, eat it after the session.',
   items:[['egg',3],['eggwhite',3],['chapati',2],['milk',1],['whey',1]]},
  {n:'Lunch', tip:'Protein first, then a cupped hand or two of carbs, and as much salad as you like.',
   items:[['chicken',1.5],['rice',1],['dahi',1],['salad',1]]},
  {n:'Snack', tip:'Protein plus something that keeps you full.',
   items:[['gyogurt',1],['almonds',1]]},
  {n:'Dinner', tip:'Earlier and lighter helps you sleep. A full karahi cooked in oil costs about 240 kcal more than lean qeema.',
   items:[['qeemaLean',1],['chapati',1],['sabzi',1],['salad',1]]}
 ],
 rest:[
  {n:'Breakfast', tip:'Smaller than on a training day: you are not spending the carbs.',
   items:[['egg',3],['eggwhite',1],['chapati',2],['milk',1]]},
  {n:'Lunch', tip:'The same as a training day. Fewer decisions, easier to stick to.',
   items:[['chicken',1.5],['rice',1],['dahi',1],['salad',1]]},
  {n:'Snack', tip:'This is where the day\'s protein is made up.',
   items:[['gyogurt',1],['almonds',1],['whey',1]]},
  {n:'Dinner', tip:'The same as a training day.',
   items:[['qeemaLean',1],['chapati',1],['sabzi',1],['salad',1]]}
 ]
};
/* [meal, food id, step, least, most, reluctance]: the portions the example day may
   change, a step at a time. Reluctance is how unwilling the plan is to touch
   one: starch, fruit and nuts move first, dairy and whole eggs last. */
const LEVERS=[
 ['Lunch','rice',0.5,0,3,1],
 ['Dinner','chapati',1,0,3,1],
 ['Breakfast','chapati',1,0,4,1],
 ['Snack','almonds',0.5,0,2,1],
 ['Before training','banana',1,0,2,1],
 ['Before training','dates',1,0,2,1],
 ['Lunch','chicken',0.5,1,3,1],
 ['Breakfast','eggwhite',1,0,5,0.5],
 ['Snack','gyogurt',0.5,0,2,1],
 ['Breakfast','whey',1,0,1,1],
 ['Snack','whey',1,0,1,1],
 ['Dinner','qeemaLean',0.5,0.5,2,1.5],
 ['Breakfast','egg',1,1,4,2],
 ['Breakfast','milk',1,0,2,2],
 ['Lunch','dahi',0.5,0,1,2],
 ['Snack','banana',1,0,1,3],
 ['Snack','pb',1,0,2,2],
 ['Snack','dates',1,0,2,2],
 ['Dinner','rice',0.5,0,2,2]
];
/* how a quantity of each plan food is written: [amount, name, weight or count (optional)] */
const MEALFOOD={
 egg:      q=>[frac(q), q===1?'Whole egg':'Whole eggs'],
 eggwhite: q=>[frac(q), q===1?'Egg white':'Egg whites'],
 chapati:  q=>[frac(q), 'Chapati', 'small and thin; a large home roti counts as 1½'],
 milk:     q=>[frac(q)+(q===1?' glass':' glasses'), 'Milk'],
 whey:     q=>[frac(q)+(q===1?' scoop':' scoops'), 'Whey protein in water'],
 chicken:  q=>[frac(q)+(q>1?' palms':' palm'), 'Chicken breast', '~'+Math.round(100*q)+' g cooked'],
 rice:     q=>[frac(q)+(q>1?' cups':' cup'), 'Cooked rice'],
 dahi:     q=>[frac(q)+(q>1?' cups':' cup'), 'Dahi'],
 salad:    q=>['1 plate', 'Salad, as much as you like'],
 gyogurt:  q=>['~'+Math.round(200*q)+' g', 'Low-fat Greek yogurt'],
 almonds:  q=>[frac(q)+(q>1?' handfuls':' handful'), 'Almonds', 'about '+Math.round(20*q)],
 qeemaLean:q=>[frac(q)+(q>1?' bowls':' bowl'), 'Lean qeema, cooked in a little oil', '~'+Math.round(150*q)+' g'],
 sabzi:    q=>['1 bowl', 'Sabzi'],
 banana:   q=>[frac(q), q===1?'Banana':'Bananas'],
 dates:    q=>[String(Math.round(3*q)), 'Dates'],
 pb:       q=>[frac(q)+(q>1?' thumbs':' thumb'), 'Peanut butter']
};
function frac(q){ const w=Math.floor(q), h=q-w>=0.5; return (w?String(w):'')+(h?'½':'')||'0'; }

/* ---- SWAPS, GROCERY, SUPPLEMENTS ------------------------------- */
const SWAPS=[
 ['1 palm chicken breast','1 large palm grilled fish · 1 small bowl lean qeema (+85 kcal) · 1 cup beef salan (+215 kcal) · 3 eggs + 3 whites (+110 kcal)','~30 g protein'],
 ['No meat','150 g paneer (400 kcal) · 1½ bowls daal with a cup of dahi (480 kcal) · 2 cups chana with a cup of dahi (650 kcal)','~30 g protein, more calories'],
 ['1 cup rice','2 small chapati · 1 large home roti · 1 large potato · 1½ cups cooked oats','~45 g carbs'],
 ['2 small chapati at breakfast','1 cup cooked oats with a banana · 2 slices brown bread with a banana','~50 g carbs'],
 ['1 scoop whey','200 g low-fat Greek yogurt · 1 small can tuna · 4 egg whites + 1 egg','~22 g protein'],
 ['Almonds','Peanuts · roasted chana (more protein, fewer calories)','about the same'],
 ['Anything you dislike','Any food of the same kind and size','the plan survives it']
];
const GROCERY=[
 ['Protein', [['Eggs','2–3 dozen'],['Chicken breast','1.5–2 kg'],['Lean beef or qeema','about 1 kg'],['Fish or canned tuna','if you eat it'],['Whey protein','1 tub'],['Daal (chana, masoor)','1 kg']]],
 ['Carbs', [['Rice','2 kg'],['Atta','5 kg'],['Oats','1 kg, if you eat them'],['Potatoes','1 kg'],['Bananas','1 dozen'],['Dates','small pack']]],
 ['Dairy', [['Milk','daily'],['Dahi','large tub'],['Low-fat Greek yogurt','if you can get it']]],
 ['Vegetables', [['Salad vegetables','cucumber, tomato, onion, lettuce'],['Sabzi vegetables','spinach, okra, cauliflower, peas'],['Lemons','a few']]],
 ['Fruit & extras', [['Fruit in season','a week\'s worth'],['Almonds or peanuts','small pack'],['Roasted chana','500 g'],['Oil','use sparingly'],['Green tea, spices','staples']]]
];
const SUPPS=[
 ['Creatine monohydrate','3–5 g every day','The best-studied supplement there is, and the cheapest thing on this page. It takes 3–4 weeks to build up, then gives a small strength increase. Timing does not matter: training day or not, just take it. Plain monohydrate; skip the expensive versions. Expect the scale to rise about a kilo in the first weeks: that is water held in the muscle, not fat. Not for under-18s, and not with kidney disease, without a doctor\'s advice.'],
 ['Whey protein','1–2 scoops a day, if you need them','Not magic: fast, cheap protein that makes the daily target reachable on a busy day. Whole food first, whey to close the gap. Check the label if you need it halal or vegetarian.'],
 ['Vitamin D3','1,000–2,000 IU with a meal','Low levels are common with an indoor life. Cheap insurance for bone health. Have it tested first if you can.'],
 ['Electrolytes','Around training and in hot weather','A pinch of salt and a squeeze of lemon in water does the job for almost nothing.'],
 ['Everything else','Skip it','Fat burners, detox teas, testosterone boosters, BCAAs. They do not help and some are not safe. Coffee or tea before training is fine; keep it at least eight hours before bed.']
];
