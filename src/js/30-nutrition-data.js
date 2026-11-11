const DIET={
 train:{label:'Training day', kcal:2395, prot:194, note:'You train at 9 AM, so breakfast is the post-workout meal — and it is the biggest protein hit of the day. Eat light before, eat properly after.',
  meals:[
   {t:'8:15', n:'Pre-gym', k:165, p:2, items:[['1','Banana'],['2–3','Dates'],['1 cup','Black coffee or green tea']],
    tip:'Light and carb-forward. Anything heavier and you will feel it on squats.'},
   {t:'10:15', n:'Post-gym breakfast', k:810, p:71, items:[['3 + 3','Eggs + egg whites, with tomato and onion'],['2','Chapati'],['1 glass','Milk'],['1 scoop','Whey in water']],
    tip:'The anchor meal. Get 65–70 g of protein here and the rest of the day is easy.'},
   {t:'1:30', n:'Lunch', k:625, p:58, items:[['1 (~150 g)','Chicken breast'],['1 cup','Cooked rice'],['1 cup','Dahi'],['1 plate','Salad — free, eat plenty']],
    tip:'Moderate, so the afternoon nap does not turn into a coma.'},
   {t:'5:00', n:'Snack', k:275, p:25, items:[['1 cup','Greek or strained yogurt'],['handful','Almonds']],
    tip:'Protein plus fibre is the most filling thing per calorie you can eat.'},
   {t:'8:00', n:'Dinner', k:520, p:38, items:[['1 cup','Lean qeema — light oil, not a karahi'],['1','Chapati'],['1 bowl','Sabzi'],['1 plate','Salad']],
    tip:'Earlier and lighter than you are used to. It is the single biggest lever on your sleep. A full oil-cooked karahi here costs 240 kcal more than the lean qeema.'}
  ]},
 rest:{label:'Rest day', kcal:2175, prot:183, note:'No pre-gym meal and a smaller breakfast — carbs come down about 60 g because you are not spending them. Protein does not move.',
  meals:[
   {t:'9:00', n:'Breakfast', k:635, p:38, items:[['3 + 1','Eggs + egg whites'],['2','Chapati'],['1 glass','Milk']],
    tip:'No whey needed here — it moves to the evening snack today.'},
   {t:'1:30', n:'Lunch', k:625, p:58, items:[['1 (~150 g)','Chicken breast'],['1 cup','Cooked rice'],['1 cup','Dahi'],['1 plate','Salad']],
    tip:'Identical to a training day. Fewer decisions, better adherence.'},
   {t:'5:00', n:'Snack', k:395, p:49, items:[['1 cup','Greek yogurt'],['small handful','Almonds'],['1 scoop','Whey']],
    tip:'This is where the day\'s protein gets rescued.'},
   {t:'8:00', n:'Dinner', k:520, p:38, items:[['1 cup','Lean qeema or chicken'],['1','Chapati'],['1 bowl','Sabzi'],['1 plate','Salad']],
    tip:'Same as training day. Rest days are only smaller at breakfast.'}
  ]}
};

/* ---- FOOD DATABASE ----------------------------------------------
   [name, portion, kcal, protein, carbs, fat] — household portions, halal,
   what an Abbottabad kitchen actually serves. Figures are honest averages;
   cooking oil varies more than anything else here, so oil is its own entry. */
const FOODCATS=[
 ['Protein', [
  ['Egg','1',75,6,1,5],
  ['Egg white','1',17,4,0,0],
  ['Omelette, 3 egg','1',340,19,3,28],
  ['Chicken breast','1 palm ~150g',240,45,0,5],
  ['Chicken karahi','1 plate',490,45,8,30],
  ['Chicken tikka','1 piece',220,30,2,10],
  ['Qeema','1 cup',390,30,5,28],
  ['Qeema, lean + light oil','1 cup',250,30,4,12],
  ['Beef salan','1 cup + gravy',380,35,5,24],
  ['Seekh kebab','1 (~80 g)',190,14,2,14],
  ['Paneer','100 g',265,18,3,20],
  ['Whey protein','1 scoop',120,24,3,2]
 ]],
 ['Carbs', [
  ['Chapati','1 medium',120,4,24,2],
  ['Naan','1',260,8,48,4],
  ['Paratha','1',360,7,40,19],
  ['Rice, cooked','1 cup',205,4,45,1],
  ['Biryani','1 plate',600,25,75,22],
  ['Potato','1 medium',130,3,30,0],
  ['Daal','1 bowl',220,14,32,4],
  ['Chana / chole','1 cup',250,12,32,8]
 ]],
 ['Dairy', [
  ['Milk, full-fat','1 glass',155,8,12,8],
  ['Dahi','1 cup',150,8,12,8],
  ['Greek yogurt','1 cup',130,20,7,3],
  ['Lassi, sweet','1 glass',220,8,30,7],
  ['Chai, with sugar','1 cup',120,3,14,5],
  ['Chai, no sugar','1 cup',60,3,4,4]
 ]],
 ['Fruit & veg', [
  ['Banana','1',105,1,27,0],
  ['Apple','1',95,1,25,0],
  ['Dates','3 medium',66,1,18,0],
  ['Guava','1',65,2,14,1],
  ['Salad','1 plate',30,1,6,0],
  ['Sabzi, light oil','1 bowl',120,3,12,7]
 ]],
 ['Snacks & fats', [
  ['Almonds','1 handful',145,5,5,13],
  ['Roasted chana','1 cup',240,13,40,4],
  ['Peanut butter','1 thumb',95,4,3,8],
  ['Oil / ghee','1 thumb',120,0,0,14],
  ['Samosa','1',260,5,25,15],
  ['Soft drink','1 glass',140,0,35,0]
 ]]
];

/* ---- SWAPS, GROCERY, SUPPLEMENTS ------------------------------- */
const SWAPS=[
 ['1 chicken breast','1 cup qeema · 1 cup beef · 3 eggs + 3 whites','~45 g protein'],
 ['1 cup rice','2 chapati · 1 medium potato','~45 g carbs'],
 ['1 scoop whey','1 cup Greek yogurt · 4 eggs','~22 g protein'],
 ['Almonds','Roasted chana (more protein, fewer calories)','fat vs fibre'],
 ['Anything you hate','Any protein of the same size','the plan survives it']
];
const GROCERY=[
 ['Protein', [['Eggs','3 dozen'],['Chicken breast','~2 kg'],['Lean beef / qeema','~1 kg'],['Whey protein','1 tub'],['Daal (chana, masoor)','1 kg']]],
 ['Carbs', [['Basmati rice','2 kg'],['Atta','5 kg'],['Potatoes','1 kg'],['Bananas','1 dozen'],['Dates','small pack']]],
 ['Dairy', [['Milk','daily'],['Dahi','large tub'],['Greek / strained yogurt','as available']]],
 ['Vegetables', [['Salad veg','cucumber, tomato, onion, lettuce'],['Sabzi veg','palak, bhindi, gobi, peas'],['Lemons','a few']]],
 ['Fruit & extras', [['Apples, guava, kinnow','week\'s worth'],['Almonds','small pack'],['Roasted chana','500 g'],['Oil','use sparingly'],['Green tea, spices','staples']]]
];
const SUPPS=[
 ['Creatine monohydrate','5 g every day','The most proven supplement there is, and the cheapest thing on this page. Takes 3–4 weeks to saturate, then gives you a small strength bump and a fuller look. Timing is irrelevant — training day or not, just take it. Plain micronised monohydrate; skip the HCL and buffered versions.'],
 ['Whey protein','1–2 scoops a day','Not magic — just fast, cheap, halal-certified protein that makes the daily target reachable on a busy day. Whole food first, whey to close the gap.'],
 ['Vitamin D3','1,000–2,000 IU with a meal','Deficiency is near-universal in the region with an indoor life. Cheap insurance for bone health, mood and testosterone. Test first if you can.'],
 ['Electrolytes','Around training and in heat','A pinch of salt and a squeeze of lemon in water does the job for almost nothing. Matters more than you think in an Abbottabad summer.'],
 ['Everything else','Skip it','Fat burners, detox teas, testosterone boosters, BCAAs. They do not move the needle and some are not safe. Caffeine before training is fine — keep it before 3 PM.']
];

/* ---- MUSCLE GROUPING --------------------------------------------
   NOTE: in the ported engine `f` and `b` are FRONT-view and BACK-view zone
   lists — not primary vs secondary movers. Grouping or ranking off f[0] gets
   it wrong (it makes biceps the "primary" on a lat pulldown), so the real
   emphasis comes from each exercise's authored `tag`, mapped explicitly here. */
