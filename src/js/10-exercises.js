/* ===================================================================
   EXERCISE LIBRARY
   One entry per movement. Ids are permanent: logs are keyed by them.
     prim   muscles that limit the lift (a set counts fully for these)
     sec    muscles clearly working but not limiting (a set counts half)
     load   bb barbell | db a pair of dumbbells | db1 one dumbbell |
            machine | cable | bw bodyweight | time a timed hold
     step   smallest sensible jump in kg (per dumbbell for db)
     typ    a sensible prescription when the lift is used outside a plan
     band   heavy | medium | light | body (bodyweight) | hold: how heavy the lift should go
     why    the reason for that band, in one or two plain sentences ({reps} = the slot's reps)
     next   bodyweight lifts only: what to do when every set reaches the top of the range
     cue    the one thing to think about
     setup  where the body and the equipment go before rep one, in order
     rep    one rep: Start, Move, Finish, with landmarks on the body
     tempo  how fast
     feel   where you should feel it
     fix    [what you notice, what to change]
     check  one thing you can verify in the mirror or by feel
     weight how to pick the first weight and when to add
     safe   only where there is a real hazard
     swap   ids that train the same muscle, for when the station is taken
   Writing rules: short sentences, plain words, landmarks on the body
   instead of angles (degrees only where the equipment shows them), no
   comparisons to other objects. <b>…</b> marks the numbers that matter.
   =================================================================== */
const EX = {};

/* ---------------------------------------------------------------- CHEST */
EX.inclineDB = {
  name: "Incline Dumbbell Press", group: "Chest", tag: "Upper chest",
  prim: ["uchest"], sec: ["chest", "fdelt", "triceps"],
  equip: "Dumbbells, adjustable bench", kind: "compound", load: "db", step: 2,
  typ: { sets: 4, reps: [8, 12], rest: 120 },
  band: "medium",
  why: "Two separate dumbbells are harder to steady than a bar, and the heaviest pairs are awkward to get into place. Use a weight you can lower slowly and press {reps} times.",
  cue: "Press up and slightly in; lower until the dumbbells are level with your chest.",
  setup: [
    "Set the bench to <b>30°</b>: one or two notches up from flat. Steeper turns it into a shoulder press.",
    "Sit with a dumbbell standing on each thigh, close to the knee. As you lie back, lift one knee to push that dumbbell up to your shoulder, then the other.",
    "Feet flat, hips and upper back on the bench, shoulder blades squeezed together and down.",
  ],
  rep: [
    ["Start", "Arms straight, dumbbells above your upper chest, palms facing your feet."],
    ["Move", "Lower for 3 seconds. Your elbows travel halfway between your ribs and straight out to the sides."],
    ["Finish", "Dumbbells level with your chest, forearms straight up and down. Then press up and slightly in until your arms are straight."],
  ],
  tempo: "<b>3 s</b> down, <b>1 s</b> up.",
  feel: "The top of the chest, just under the collarbones.",
  fix: [
    ["You feel the front of the shoulder more than the chest", "Lower the bench one notch and keep the shoulder blades squeezed back."],
    ["The dumbbells wobble or drift toward your face", "Go lighter. At the bottom each dumbbell should be straight above its elbow."],
    ["Your hips lift off the bench", "It has become a flat press. Keep the hips down and use less weight."],
  ],
  check: "At the bottom, look at one forearm: it points straight at the ceiling, not leaning in or out.",
  weight: "Start with a pair you could press 14 times. When every set reaches the top of the range, take the next pair up.",
  swap: ["inclineBB", "benchDB"],
};
EX.inclineBB = {
  name: "Incline Barbell Press", group: "Chest", tag: "Upper chest",
  prim: ["uchest"], sec: ["chest", "fdelt", "triceps"],
  equip: "Barbell, incline bench", kind: "compound", load: "bb", step: 2.5,
  typ: { sets: 4, reps: [6, 10], rest: 150 },
  band: "heavy",
  why: "A steady bar with both arms pushing together: this lift can take real weight. Choose a load that makes {reps} reps hard, and rest fully between sets.",
  cue: "Bar down to the top of your chest, then press it back up over your shoulders.",
  setup: [
    "Bench at <b>30°</b>. Lie back with your eyes under the bar.",
    "Grip with each hand about one hand-width outside your shoulders, thumbs wrapped around the bar.",
    "Feet flat, shoulder blades squeezed together and down. Lift the bar out and bring it over your shoulders.",
  ],
  rep: [
    ["Start", "Arms straight, bar above your shoulders."],
    ["Move", "Lower for 2–3 seconds. Your elbows travel about halfway between your ribs and straight out to the sides."],
    ["Finish", "Bar touches the top of the chest, two or three finger-widths below the collarbones, with no bounce. Press up and slightly back until it is over the shoulders again."],
  ],
  tempo: "<b>2–3 s</b> down, then press up without bouncing.",
  feel: "The top of the chest. The front of the shoulders and the triceps help.",
  fix: [
    ["Your shoulders ache at the bottom", "Bring your grip in a little and stop the elbows flaring straight out to the sides."],
    ["You feel mostly shoulders", "The bench is too steep. Lower it one notch."],
    ["The bar drifts toward your stomach", "Aim to finish above the shoulders, not above the chest."],
  ],
  check: "When the bar touches your chest, your forearms are straight up and down. If they lean in, widen your grip; if they lean out, narrow it.",
  weight: "Start with the empty bar to learn the path. Add 2.5 kg when every set reaches the top of the range.",
  safe: "Set the safety bars just below chest height or ask for a spotter. Always wrap your thumbs around the bar.",
  swap: ["inclineDB", "benchBB"],
};
EX.benchBB = {
  name: "Barbell Bench Press", group: "Chest", tag: "Chest",
  prim: ["chest"], sec: ["uchest", "fdelt", "triceps"],
  equip: "Barbell, flat bench with a rack", kind: "compound", load: "bb", step: 2.5,
  typ: { sets: 4, reps: [6, 10], rest: 150 },
  band: "heavy",
  why: "A steady bar and a big muscle group: this is one of the lifts to load. Choose a weight that makes {reps} reps hard, and rest fully between sets.",
  cue: "Lower the bar to the middle of your chest, then press it back up over your shoulders.",
  setup: [
    "Lie with your eyes under the bar, feet flat on the floor.",
    "Grip with each hand about one hand-width outside your shoulders, thumbs wrapped around the bar.",
    "Squeeze the shoulder blades together and down and keep them there. A small arch under the lower back is normal; the hips stay on the bench.",
    "Lift the bar out and bring it over your shoulders.",
  ],
  rep: [
    ["Start", "Arms straight, bar over the shoulders."],
    ["Move", "Lower for 2–3 seconds. Your elbows travel about halfway between your ribs and straight out to the sides."],
    ["Finish", "Bar touches the middle of the chest lightly. Press up and slightly back toward the rack until the arms are straight."],
  ],
  tempo: "<b>2–3 s</b> down, then press up. Take a breath at the top before each rep.",
  feel: "The whole chest. The triceps and the front of the shoulders help.",
  fix: [
    ["The front of the shoulder hurts", "Bring the elbows a little closer to your ribs and keep the shoulder blades pinned back."],
    ["The bar bounces off your chest", "It is too heavy or too fast. Pause for a moment on the chest."],
    ["Your hips lift off the bench", "Lower the weight. Push your feet into the floor, not your hips up."],
  ],
  check: "At the bottom, your forearms are straight up and down, seen from the front and from the side.",
  weight: "Start with the empty bar (20 kg). If that is too heavy for the lowest number of reps, use the dumbbell bench press until it is not. Add 2.5 kg when every set reaches the top of the range.",
  safe: "Use the safety bars or a spotter every time, and always wrap your thumbs around the bar.",
  swap: ["benchDB", "inclineBB"],
};
EX.benchDB = {
  name: "Dumbbell Bench Press", group: "Chest", tag: "Chest",
  prim: ["chest"], sec: ["uchest", "fdelt", "triceps"],
  equip: "Dumbbells, flat bench", kind: "compound", load: "db", step: 2,
  typ: { sets: 3, reps: [8, 12], rest: 120 },
  band: "medium",
  why: "Dumbbells go deeper than a bar and each arm has to steady its own weight, so they suit a middle weight. Lower slowly and press {reps} times.",
  cue: "Press the dumbbells up over your chest; lower until they are level with it.",
  setup: [
    "Flat bench. Sit with a dumbbell on each thigh, lie back and bring them to your chest.",
    "Feet flat, shoulder blades squeezed together and down.",
    "Palms facing your feet, wrists straight.",
  ],
  rep: [
    ["Start", "Arms straight, dumbbells above the middle of your chest."],
    ["Move", "Lower for 3 seconds. Your elbows travel halfway between your ribs and straight out to the sides."],
    ["Finish", "Dumbbells level with your chest, a stretch across it. Press up and slightly in until the arms are straight."],
  ],
  tempo: "<b>3 s</b> down, <b>1 s</b> up.",
  feel: "The whole chest.",
  fix: [
    ["Your shoulders take over", "Keep the shoulder blades squeezed back and do not let the elbows go straight out to the sides."],
    ["One arm is slower", "Let the weaker arm set the pace. Do not twist to help it."],
  ],
  check: "At the bottom, each dumbbell is straight above its elbow.",
  weight: "Start with a pair you could press 14 times. Take the next pair when every set reaches the top of the range.",
  swap: ["benchBB", "pushup"],
};
EX.pecdeck = {
  name: "Pec Deck Fly", group: "Chest", tag: "Chest",
  prim: ["chest"], sec: ["uchest"],
  equip: "Pec deck machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 3, reps: [12, 15], rest: 75 },
  band: "light",
  why: "Only the shoulder joint moves and your arms are long, so a small weight already loads the chest. A heavy stack pulls the shoulders forward instead. Use a weight you can squeeze for 1 second with the hands together, {reps} times.",
  cue: "Bring the handles together in front of your chest with your arms slightly bent, then open slowly.",
  setup: [
    "Set the arm pins so the handles start level with your shoulders or slightly behind them: a stretch across the chest, not a strain.",
    "Set the seat so the handles are level with the middle of your chest.",
    "Sit tall with your back and head against the pad, feet flat.",
    "Hold the handles with a small bend in the elbows and keep that bend for the whole set.",
  ],
  rep: [
    ["Start", "Arms open until you feel a stretch across the chest, with no pain in the shoulder."],
    ["Move", "Bring the handles together in a wide arc. Only the shoulders move; the bend in the elbows stays the same."],
    ["Finish", "Handles almost touching in front of your chest. Squeeze for 1 second, then open for 3 seconds."],
  ],
  tempo: "<b>1 s</b> together, <b>1 s</b> squeeze, <b>3 s</b> open.",
  feel: "The middle of the chest, most of all when the handles meet.",
  fix: [
    ["You feel the front of the shoulder", "Do not open as far, and keep your chest lifted."],
    ["Your arms bend and straighten as you go", "Lock a small bend in the elbows. Lower the weight if you cannot."],
  ],
  check: "Your back never leaves the pad. If you have to lean forward to finish, it is too heavy.",
  weight: "Start with a weight you could do 18 times. Go one plate up when every set reaches the top of the range.",
  swap: ["benchDB", "inclineDB"],
};
EX.pushup = {
  name: "Push-Up", group: "Chest", tag: "Chest",
  prim: ["chest"], sec: ["uchest", "fdelt", "triceps"],
  equip: "Floor (a bench makes it easier or harder)", kind: "compound", load: "bw", step: 0,
  typ: { sets: 3, reps: [8, 15], rest: 120 },
  band: "body",
  why: "Your own bodyweight is the load. Make it harder by changing the position (hands lower, then feet raised), not by rushing the reps.",
  next: "make it harder: hands from the bench to the floor, then feet on a bench, then a backpack with a plate in it",
  cue: "Body in one straight line; chest to the floor, then push away.",
  setup: [
    "Hands on the floor a little wider than your shoulders, fingers forward.",
    "Legs straight, feet together, weight on your hands and toes.",
    "Squeeze your glutes and stomach so the body is one straight line from head to heels.",
  ],
  rep: [
    ["Start", "Arms straight, shoulders above the hands."],
    ["Move", "Lower for 2–3 seconds. Your elbows point back, about halfway between your ribs and straight out."],
    ["Finish", "Chest a fist-width from the floor. Push up until the arms are straight."],
  ],
  tempo: "<b>2–3 s</b> down, <b>1 s</b> up.",
  feel: "Chest, triceps and the front of the shoulders. The stomach works to keep you straight.",
  fix: [
    ["Your hips sag", "Squeeze the glutes harder. If you cannot hold the line, put your hands on a bench."],
    ["You cannot reach the lowest number of reps", "Raise your hands on a bench or a bar. The higher the hands, the easier it is."],
    ["It is too easy", "Put your feet on a bench, or wear a backpack with a plate in it."],
  ],
  check: "Film one set from the side, or ask someone to watch: your ear, shoulder, hip and ankle stay in one straight line on every rep.",
  weight: "Put your hands on a bench if 8 reps are too hard. When every set reaches the top of the range, lower the hands or raise the feet.",
  swap: ["benchDB", "benchBB"],
};

/* ------------------------------------------------------------ SHOULDERS */
EX.machPress = {
  name: "Machine Shoulder Press", group: "Shoulders", tag: "Shoulders",
  prim: ["fdelt"], sec: ["sdelt", "triceps"],
  equip: "Shoulder press machine", kind: "compound", load: "machine", step: 5,
  typ: { sets: 3, reps: [8, 12], rest: 120 },
  band: "medium",
  why: "The machine guides the path, so you can push hard safely, but the shoulder joint does better with a middle weight than with the heaviest you can move. {reps} reps, the last two hard.",
  cue: "Press the handles straight up; lower them to ear height.",
  setup: [
    "Set the seat so the handles start level with your ears.",
    "Sit with your whole back on the pad, feet flat.",
    "Grip the handles with straight wrists and your elbows under your hands.",
  ],
  rep: [
    ["Start", "Handles at ear height, elbows slightly in front of your body."],
    ["Move", "Press up without shrugging your shoulders toward your ears."],
    ["Finish", "Arms almost straight. Lower for 2–3 seconds back to ear height."],
  ],
  tempo: "<b>1 s</b> up, <b>2–3 s</b> down.",
  feel: "The front and the side of the shoulders.",
  fix: [
    ["Your lower back arches off the pad", "Lower the weight and tighten your stomach so the bottom of your ribs moves down toward your hips."],
    ["Your neck tightens", "You are shrugging. Keep the shoulders down as you press."],
  ],
  check: "Every rep starts and ends at the same height: the handles next to your ears.",
  weight: "Start with a weight you could press 14 times. One plate up when every set reaches the top of the range.",
  swap: ["dbPress", "ohp"],
};
EX.dbPress = {
  name: "Seated Dumbbell Shoulder Press", group: "Shoulders", tag: "Shoulders",
  prim: ["fdelt"], sec: ["sdelt", "triceps"],
  equip: "Dumbbells, bench with a back", kind: "compound", load: "db", step: 2,
  typ: { sets: 3, reps: [8, 12], rest: 120 },
  band: "medium",
  why: "Each arm has to balance its own dumbbell overhead, so very heavy pairs turn the lift into a balancing act. A middle weight for {reps} reps.",
  cue: "Press the dumbbells from ear height to straight arms, without arching your back.",
  setup: [
    "Set the bench back one notch short of upright.",
    "Sit with your whole back on the pad and feet flat. Stand a dumbbell on each thigh, then lift one knee at a time to push each dumbbell up to your shoulder.",
    "Palms forward, elbows slightly in front of your body, forearms straight up and down.",
  ],
  rep: [
    ["Start", "Dumbbells level with your ears."],
    ["Move", "Press up and slightly in. Each dumbbell stays above its elbow."],
    ["Finish", "Arms almost straight, dumbbells close together above your head. Lower for 2–3 seconds to ear height."],
  ],
  tempo: "<b>1 s</b> up, <b>2–3 s</b> down.",
  feel: "The front and the side of the shoulders.",
  fix: [
    ["Your lower back arches", "Tighten your stomach so the bottom of your ribs moves down toward your hips, and use less weight."],
    ["Your elbows go straight out to the sides", "Bring them a little forward, so you can just see them at the edge of your view."],
  ],
  check: "At the bottom, the dumbbells are next to your ears and straight above your elbows.",
  weight: "Start with a pair you could press 14 times. Take the next pair when every set reaches the top of the range.",
  swap: ["machPress", "ohp"],
};
EX.ohp = {
  name: "Standing Barbell Press", group: "Shoulders", tag: "Shoulders",
  prim: ["fdelt"], sec: ["sdelt", "triceps"],
  equip: "Barbell, rack", kind: "compound", load: "bb", step: 2.5,
  typ: { sets: 4, reps: [3, 5], rest: 180 },
  band: "heavy",
  why: "A strength lift: the whole body holds a bar overhead. Few reps and long rests suit it. Sets of {reps}, every rep looking the same.",
  cue: "Press the bar from your collarbones to straight above your head.",
  setup: [
    "Take the bar from a rack at chest height, hands just outside your shoulders.",
    "The bar rests on the top of your chest, elbows slightly in front of the bar.",
    "Feet under your hips. Squeeze your glutes and stomach so your back cannot arch.",
  ],
  rep: [
    ["Start", "Bar on the top of the chest, forearms straight up and down."],
    ["Move", "Press straight up. Move your head back a little to let the bar pass, then bring it forward under the bar."],
    ["Finish", "Arms straight, bar above the middle of your feet. Lower under control to the collarbones."],
  ],
  tempo: "Press up, <b>2 s</b> down.",
  feel: "Shoulders and triceps. The stomach and glutes hold you still.",
  fix: [
    ["You lean back to finish the rep", "It is too heavy. Squeeze the glutes and take 10% off."],
    ["The bar goes forward, away from your face", "Keep it close: it should almost touch your nose on the way up."],
  ],
  check: "From the side, the bar finishes straight above your ears, shoulders, hips and ankles.",
  weight: "Start with the empty bar. Add 2.5 kg when every set reaches the top of the range; smaller plates help on this lift.",
  safe: "Do not turn the last rep into a backbend. If the bar stalls, lower it to your chest and put it back in the rack.",
  swap: ["dbPress", "machPress"],
};
EX.latRaise = {
  name: "Dumbbell Lateral Raise", group: "Shoulders", tag: "Side delts",
  prim: ["sdelt"], sec: [],
  equip: "Dumbbells", kind: "isolation", load: "db", step: 1,
  typ: { sets: 4, reps: [12, 20], rest: 60 },
  band: "light",
  why: "The weight sits at the end of a straight arm, so a few kilos are already heavy for the side of the shoulder. Go heavier and the neck muscles and a swing take over. Use a weight you can raise {reps} times and hold for a moment at the top.",
  cue: "Lift your arms out to the sides until your hands are level with your shoulders.",
  setup: [
    "Stand with feet under your hips, a dumbbell in each hand beside your thighs.",
    "Lean your chest forward a little and keep a small bend in the elbows.",
    "Palms face your thighs. As the arms rise, the backs of your hands turn to face the ceiling; the thumb and the little finger stay at the same height.",
  ],
  rep: [
    ["Start", "Dumbbells just outside your thighs."],
    ["Move", "Raise the arms out to the sides and slightly in front of you. Push your hands away from your body rather than lifting them up."],
    ["Finish", "Hands and elbows level with your shoulders. Hold for a moment, then lower for 2–3 seconds."],
  ],
  tempo: "<b>1 s</b> up, a short hold, <b>2–3 s</b> down.",
  feel: "The outside of the shoulder.",
  fix: [
    ["You feel your neck or the top of the shoulders", "Use 1–2 kg less and stop a little lower. Keep the shoulders down."],
    ["You swing your body to lift", "It is too heavy. Stand with your back against a wall, or sit down."],
    ["The top of the shoulder pinches", "Turn your thumbs slightly up."],
  ],
  check: "You can pause for one full second at the top. If you cannot, the dumbbells are too heavy.",
  weight: "Light: a pair you can raise 20 times without swinging. Reach the top of the range on every set before taking the next pair.",
  swap: ["cableLat"],
};
EX.cableLat = {
  name: "Cable Lateral Raise", group: "Shoulders", tag: "Side delts",
  prim: ["sdelt"], sec: [],
  equip: "Cable machine, low pulley, single handle", kind: "isolation", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [12, 15], each: true, rest: 60 },
  band: "light",
  why: "The cable pulls on the end of a straight arm, so a small weight is enough. If your body leans or the shoulder shrugs up, it is too heavy. {reps} smooth reps on each side.",
  cue: "One arm at a time: pull the handle out to the side until your hand is level with your shoulder.",
  setup: [
    "Set the pulley at the lowest position and attach a single handle.",
    "Stand side-on to the machine and hold the handle with the arm farther from it, so the cable crosses in front of your body.",
    "Hold the machine with the free hand. Keep a small bend in the working elbow.",
  ],
  rep: [
    ["Start", "Hand in front of the opposite thigh, cable tight."],
    ["Move", "Raise the arm out to the side and slightly forward. The elbow stays as high as the hand."],
    ["Finish", "Hand level with the shoulder. Lower for 3 seconds without letting the plates touch down."],
  ],
  tempo: "<b>1 s</b> up, <b>3 s</b> down.",
  feel: "The outside of the shoulder, from the very start of the lift.",
  fix: [
    ["Your body leans away to help", "Lighter weight; stay upright."],
    ["You feel your neck", "Stop at shoulder height and keep the shoulder down."],
  ],
  check: "The plates never touch the stack between reps.",
  weight: "Start with the lightest one or two plates. One plate up when every set reaches the top of the range.",
  swap: ["latRaise"],
};
EX.reardelt = {
  name: "Reverse Pec Deck", group: "Shoulders", tag: "Rear delts",
  prim: ["rdelt"], sec: ["midback", "traps"],
  equip: "Reverse pec deck machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 3, reps: [15, 20], rest: 60 },
  band: "light",
  why: "The muscle at the back of the shoulder is small. With a heavy stack the upper back and a swing do the work and that muscle gets almost nothing. Use a weight you can hold open for 1 second, {reps} times.",
  cue: "Open your arms out and back until they are in line with your shoulders.",
  setup: [
    "On a machine that also does the chest fly, move both arm pins to the back position, so the handles start close together in front of the pad.",
    "Sit facing the pad with your chest against it.",
    "Set the seat so your arms are level with your shoulders when you hold the handles.",
    "Hold the handles with palms facing each other or facing down, arms almost straight.",
  ],
  rep: [
    ["Start", "Arms straight in front of you, shoulders relaxed forward."],
    ["Move", "Sweep the arms out to the sides. They stay almost straight."],
    ["Finish", "Arms in line with your shoulders. Return for 2–3 seconds."],
  ],
  tempo: "<b>1 s</b> back, <b>2–3 s</b> forward.",
  feel: "The back of the shoulders.",
  fix: [
    ["You feel the middle of the back more", "Lighter weight, and stop when the arms are in line with the shoulders."],
    ["Your chest leaves the pad", "It is too heavy."],
  ],
  check: "Your chest stays on the pad for every rep.",
  weight: "Light. Start with a weight you could do 22 times; one plate up when every set reaches the top of the range.",
  swap: ["facepull"],
};
EX.facepull = {
  name: "Face Pull", group: "Shoulders", tag: "Rear delts",
  prim: ["rdelt"], sec: ["midback", "traps"],
  equip: "Cable machine, rope", kind: "isolation", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [15, 20], rest: 60 },
  band: "light",
  why: "This trains small muscles at the back of the shoulder and between the shoulder blades. A heavy weight turns it into a row with a lean back. Stay light enough to pause with your hands beside your ears, {reps} times.",
  cue: "Pull the rope toward your eyes and spread your hands apart.",
  setup: [
    "Set the pulley at the height of your forehead and attach a rope.",
    "Hold the rope with your thumbs pointing back at you and step back until your arms are straight.",
    "Stand tall, one foot slightly in front of the other.",
  ],
  rep: [
    ["Start", "Arms straight in front of your face, cable tight."],
    ["Move", "Pull the rope toward your eyes, elbows high and out to the sides."],
    ["Finish", "Hands beside your ears, rope ends apart. Hold 1 second, return for 2–3 seconds."],
  ],
  tempo: "<b>1 s</b> pull, <b>1 s</b> hold, <b>2–3 s</b> back.",
  feel: "The back of the shoulders and between the shoulder blades.",
  fix: [
    ["Your elbows drop toward your ribs", "It has become a row. Lighter weight, and keep the elbows as high as your shoulders while the hands finish beside your ears."],
    ["You lean back to pull", "It is too heavy. Stand tall."],
  ],
  check: "At the finish, your hands are beside your ears and your elbows are as high as your shoulders.",
  weight: "Light. One plate up when every set reaches the top of the range.",
  swap: ["reardelt"],
};

/* ----------------------------------------------------------------- ARMS */
EX.pushdown = {
  name: "Triceps Pushdown", group: "Arms", tag: "Triceps",
  prim: ["triceps"], sec: [],
  equip: "Cable machine, high pulley, bar or rope", kind: "isolation", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [10, 15], rest: 75 },
  band: "light",
  why: "Only the elbows move, so they carry everything. A heavy stack makes the shoulders roll forward and the elbows ache. Use a weight you can straighten fully and hold, for {reps} reps.",
  cue: "Elbows stay at your sides; push the bar down until your arms are straight.",
  setup: [
    "Set the pulley at the top and attach a short bar or a rope.",
    "Stand close, lean forward a little, and tuck your elbows against your ribs.",
    "Start with your hands at chest height.",
  ],
  rep: [
    ["Start", "Hands at chest height, elbows at your sides."],
    ["Move", "Push down. Only the forearms move."],
    ["Finish", "Arms fully straight, hands in front of your thighs (beside them with a rope). Squeeze 1 second, then let the bar rise for 2–3 seconds to chest height."],
  ],
  tempo: "<b>1 s</b> down, <b>1 s</b> squeeze, <b>2–3 s</b> up.",
  feel: "The back of the upper arm.",
  fix: [
    ["Your elbows move forward as the bar rises", "Pin them to your ribs. Lower the weight."],
    ["Your shoulders roll forward to push", "Stand tall and use less weight."],
  ],
  check: "Seen from the side, your elbow stays in one place for the whole set.",
  weight: "One plate up when every set reaches the top of the range.",
  swap: ["ohext"],
};
EX.ohext = {
  name: "Overhead Dumbbell Triceps Extension", group: "Arms", tag: "Triceps",
  prim: ["triceps"], sec: [],
  equip: "One dumbbell", kind: "isolation", load: "db1", step: 2,
  typ: { sets: 3, reps: [10, 12], rest: 75 },
  band: "light",
  why: "The elbow works from a deep stretch here, where it is weakest and most easily irritated. Go slowly with a light to middle weight for {reps} reps.",
  cue: "Lower the dumbbell behind your head, then straighten your arms.",
  setup: [
    "Sit on a bench with a back support, or stand.",
    "Hold one dumbbell with both hands under its top plate and lift it above your head.",
    "Upper arms beside your ears, elbows pointing forward and up.",
  ],
  rep: [
    ["Start", "Arms straight, dumbbell above your head."],
    ["Move", "Bend only at the elbows and lower the dumbbell behind your head for 3 seconds."],
    ["Finish", "Forearms touch your biceps and you feel a stretch at the back of the arms. Then straighten the arms fully."],
  ],
  tempo: "<b>3 s</b> down, <b>1 s</b> up.",
  feel: "The back of the upper arms, with a deep stretch at the bottom.",
  fix: [
    ["Your elbows spread wide", "Squeeze them in toward your ears. Go lighter if you need to."],
    ["Your lower back arches", "Sit against a back support and tighten your stomach so the bottom of your ribs moves down toward your hips."],
  ],
  check: "Your upper arms do not move: they stay beside your ears from start to finish.",
  weight: "Start with a dumbbell you could do 14 times. Take the next one when every set reaches the top of the range.",
  swap: ["pushdown"],
};
EX.bbCurl = {
  name: "Barbell Curl", group: "Arms", tag: "Biceps",
  prim: ["biceps"], sec: ["forearm"],
  equip: "Barbell or EZ bar", kind: "isolation", load: "bb", step: 2.5,
  typ: { sets: 3, reps: [8, 12], rest: 75 },
  band: "medium",
  why: "Two hands on one bar make this the curl that takes the most weight, but only up to the point where your hips start to swing. {reps} strict reps.",
  cue: "Elbows at your sides; curl the bar to your shoulders and lower it slowly.",
  setup: [
    "Stand with feet under your hips, holding the bar palms up, hands shoulder-width apart.",
    "Elbows beside your ribs, shoulders back.",
    "Squeeze your glutes so your body cannot swing.",
  ],
  rep: [
    ["Start", "Arms straight, bar on your thighs."],
    ["Move", "Curl the bar up. The elbows stay beside your ribs."],
    ["Finish", "Bar at the top of your chest. Lower for 3 seconds until the arms are straight."],
  ],
  tempo: "<b>1 s</b> up, <b>3 s</b> down.",
  feel: "The front of the upper arm.",
  fix: [
    ["You lean back or swing", "Lighter, or stand with your back against a wall."],
    ["Your wrists hurt", "Use an EZ bar (the one with bends in it)."],
  ],
  check: "Your elbows stay beside your ribs: they do not travel forward.",
  weight: "Add 2.5 kg when every set reaches the top of the range.",
  swap: ["dbCurl"],
};
EX.dbCurl = {
  name: "Dumbbell Curl", group: "Arms", tag: "Biceps",
  prim: ["biceps"], sec: ["forearm"],
  equip: "Dumbbells", kind: "isolation", load: "db", step: 1,
  typ: { sets: 3, reps: [10, 12], each: true, rest: 75 },
  band: "light",
  why: "One arm at a time, with no help from the other side. If the elbow drifts forward or the body rocks, it is too heavy. {reps} strict reps on each arm.",
  cue: "Curl one dumbbell at a time and turn your palm up as it rises.",
  setup: [
    "Stand or sit with a dumbbell in each hand, arms straight, palms facing your thighs.",
    "Elbows beside your ribs.",
    "Take turns: one rep with the right arm, then one with the left. Count the reps for each arm.",
  ],
  rep: [
    ["Start", "Arm straight."],
    ["Move", "Curl up and turn the palm to face your shoulder. The elbow stays beside your ribs."],
    ["Finish", "Dumbbell in front of the shoulder. Lower for 3 seconds to a straight arm."],
  ],
  tempo: "<b>1 s</b> up, <b>3 s</b> down.",
  feel: "The front of the upper arm.",
  fix: [
    ["You swing", "Sit down, or use a lighter pair."],
    ["The arm does not straighten at the bottom", "Lower all the way: the bottom half of the curl matters most."],
  ],
  check: "At the bottom of every rep the arm is fully straight.",
  weight: "Take the next pair when every set reaches the top of the range.",
  swap: ["bbCurl"],
};

/* ----------------------------------------------------------------- BACK */
EX.pulldown = {
  name: "Lat Pulldown", group: "Back", tag: "Lats",
  prim: ["lats"], sec: ["biceps", "midback", "rdelt"],
  equip: "Lat pulldown machine", kind: "compound", load: "machine", step: 5,
  typ: { sets: 4, reps: [10, 12], rest: 120 },
  band: "medium",
  why: "A big back muscle on a guided cable: it takes a solid middle weight. If you have to lean far back or the bar stops short of your upper chest, go lighter. {reps} reps.",
  cue: "Pull the bar to the top of your chest by driving your elbows down.",
  setup: [
    "Set the thigh pad so your legs cannot lift.",
    "Stand up, grip the bar with palms facing away, each hand one hand-width outside your shoulders.",
    "Sit down with straight arms, lean back a little and keep that lean.",
  ],
  rep: [
    ["Start", "Arms straight, shoulders lifted toward your ears."],
    ["Move", "Pull the shoulders down first, then the elbows down toward your ribs. Your body does not rock."],
    ["Finish", "Bar touches the top of the chest, just below the collarbones. Hold 1 second, then let it rise for 2–3 seconds until the arms are straight."],
  ],
  tempo: "<b>1 s</b> down, <b>1 s</b> hold, <b>2–3 s</b> up.",
  feel: "Under the armpits and down the sides of the back.",
  fix: [
    ["You feel your forearms or biceps most", "Loosen your grip so the fingers only hold the bar, and think about pulling with the elbows."],
    ["You rock back to pull", "Go one plate lighter."],
    ["The bar stops at your chin", "It is too heavy: every rep should reach the chest."],
  ],
  check: "The first rep and the last rep touch the same spot on your chest with the same lean.",
  weight: "Start with a weight you could pull 15 times. One plate up when every set reaches the top of the range.",
  safe: "Never pull the bar down behind your neck.",
  swap: ["pullup", "dbRow"],
};
EX.pullup = {
  name: "Pull-Up", group: "Back", tag: "Lats",
  prim: ["lats"], sec: ["biceps", "midback", "rdelt"],
  equip: "Pull-up bar, or the assisted pull-up machine", kind: "compound", load: "bw", step: 2.5,
  typ: { sets: 3, reps: [5, 10], rest: 150 },
  band: "heavy",
  why: "You are lifting your whole body with two arms, which is heavy by itself, so low reps are normal: {reps}. When the top of that is easy, add weight instead of more reps.",
  next: "take one plate of help off if you use the assisted machine or a band; with no help, add 2.5 kg (a dumbbell between your feet, or a belt)",
  cue: "Hang with straight arms; pull until your chin is over the bar.",
  setup: [
    "Grip the bar with palms facing away, hands just outside your shoulders.",
    "Hang with arms straight and legs still. Cross your ankles if it helps.",
    "On the assisted machine or with a band: choose enough help to reach the low end of the rep range.",
  ],
  rep: [
    ["Start", "Arms fully straight."],
    ["Move", "Pull the shoulders down, then drive the elbows toward your ribs."],
    ["Finish", "Chin clearly over the bar. Lower for 2–3 seconds to straight arms."],
  ],
  tempo: "Pull up, <b>2–3 s</b> down.",
  feel: "Under the armpits and down the sides of the back. The biceps help.",
  fix: [
    ["You swing or kick", "Start each rep from a still hang."],
    ["You cannot do 5", "Use the assisted machine or a band. Or jump to the top and lower yourself for 5 seconds."],
    ["You do half reps", "Do fewer reps with the full range: straight arms at the bottom, chin over the bar at the top."],
  ],
  check: "Every rep starts from straight arms.",
  weight: "Bodyweight first. With the assisted machine or a band, leave the weight box empty and log the reps; take some help off each time every set reaches the top of the range. With no help left, add weight: a dumbbell between your feet, or a belt.",
  swap: ["pulldown"],
};
EX.cableRow = {
  name: "Seated Cable Row", group: "Back", tag: "Mid-back",
  prim: ["midback"], sec: ["lats", "biceps", "rdelt"],
  equip: "Seated cable row station", kind: "compound", load: "cable", step: 5,
  typ: { sets: 4, reps: [10, 12], rest: 120 },
  band: "medium",
  why: "A middle weight you can pull to your stomach and hold for a moment. If your body rocks back and forth to move it, the weight is too heavy for the back muscles. {reps} reps.",
  cue: "Sit tall and pull the handle to your stomach; let it stretch you forward under control.",
  setup: [
    "Sit with your feet on the plates and knees slightly bent.",
    "Use the narrow handle whose two grips face each other. Take it and sit tall, chest up, arms straight.",
    "Lean back only until your body is upright.",
  ],
  rep: [
    ["Start", "Arms straight, shoulders reaching forward, back still straight."],
    ["Move", "Pull the shoulder blades back, then the elbows back along your ribs. Your body stays almost still."],
    ["Finish", "Handle touches your stomach above the navel, elbows behind your body. Hold 1 second, return for 2–3 seconds."],
  ],
  tempo: "<b>1 s</b> pull, <b>1 s</b> hold, <b>2–3 s</b> back.",
  feel: "Between the shoulder blades and down the sides of the back.",
  fix: [
    ["Your lower back rounds when you reach forward", "Reach with the shoulders only and keep the chest up."],
    ["You swing back to move the weight", "Lighter. The body stays upright."],
    ["You feel only your biceps", "Start each rep by pulling the shoulder blades back."],
  ],
  check: "Your body moves less than a hand-width forward and back during the set.",
  weight: "One plate up when every set reaches the top of the range.",
  swap: ["csRow", "dbRow"],
};
EX.csRow = {
  name: "Chest-Supported Row", group: "Back", tag: "Mid-back",
  prim: ["midback"], sec: ["lats", "biceps", "rdelt"],
  equip: "Chest-supported row machine", kind: "compound", load: "machine", step: 5,
  typ: { sets: 4, reps: [10, 12], rest: 120 },
  band: "medium",
  why: "Your chest rests on the pad, so the lower back is out of it and the back muscles can work hard. A solid middle weight for {reps} reps. Of all the rows, this is the one to load.",
  cue: "Chest on the pad; pull your elbows back until your hands reach your ribs.",
  setup: [
    "Set the seat or foot plate so the top of the pad is at the middle of your chest.",
    "Press your chest against the pad.",
    "Hold the handles with arms straight.",
  ],
  rep: [
    ["Start", "Arms straight, shoulder blades spread apart."],
    ["Move", "Pull the shoulder blades together, then drive the elbows back past your body."],
    ["Finish", "Hands beside your lower ribs. Hold 1 second, lower for 2–3 seconds."],
  ],
  tempo: "<b>1 s</b> pull, <b>1 s</b> hold, <b>2–3 s</b> down.",
  feel: "Between the shoulder blades and the back of the shoulders.",
  fix: [
    ["Your chest lifts off the pad", "It is too heavy."],
    ["You shrug toward your ears", "Keep the shoulders down and pull the elbows back, not up."],
  ],
  check: "Your chest stays on the pad on every rep.",
  weight: "One plate up, or 5 kg, when every set reaches the top of the range.",
  swap: ["cableRow", "dbRow"],
};
EX.dbRow = {
  name: "Single-Arm Dumbbell Row", group: "Back", tag: "Lats",
  prim: ["lats"], sec: ["midback", "biceps", "rdelt"],
  equip: "One dumbbell, flat bench", kind: "compound", load: "db1", step: 2,
  typ: { sets: 3, reps: [10, 12], each: true, rest: 90 },
  band: "medium",
  why: "One arm works while the other hand supports you, so the back can take a fair weight. Too heavy and the body twists to heave it up. {reps} reps on each side with no twist.",
  cue: "Flat back; pull the dumbbell toward your hip.",
  setup: [
    "Put one knee and the hand on the same side on a flat bench.",
    "The other foot is on the floor, out to the side. Your back is flat and level.",
    "Hold the dumbbell with the arm hanging straight down.",
  ],
  rep: [
    ["Start", "Arm straight, shoulder reaching toward the floor."],
    ["Move", "Pull the elbow up and back, close to your body. Do not twist your chest open."],
    ["Finish", "Dumbbell beside your hip, elbow above your back. Lower for 2–3 seconds to a full stretch."],
  ],
  tempo: "<b>1 s</b> up, <b>2–3 s</b> down.",
  feel: "The side of the back, under the armpit.",
  fix: [
    ["Your body twists to lift", "Lighter. Keep both shoulders level with the floor."],
    ["You feel the top of the shoulder", "Pull toward the hip, not toward the chest."],
  ],
  check: "Both shoulders stay the same height from the floor for the whole rep: the chest does not turn open.",
  weight: "Start with a dumbbell you could row 14 times. Take the next one when every set reaches the top of the range.",
  swap: ["cableRow", "csRow"],
};
EX.straightArm = {
  name: "Straight-Arm Pulldown", group: "Back", tag: "Lats",
  prim: ["lats"], sec: [],
  equip: "Cable machine, high pulley, bar or rope", kind: "isolation", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [12, 15], rest: 60 },
  band: "light",
  why: "Straight arms put the weight far from the shoulder, so a small weight is plenty for the back muscles. A heavy one turns it into a triceps pushdown. {reps} slow reps.",
  cue: "Arms almost straight; sweep the bar down to your thighs.",
  setup: [
    "Set the pulley at the top with a straight bar or a rope.",
    "Hold it with hands shoulder-width apart and take one step back.",
    "Lean forward a little from the hips, arms almost straight, hands at eye height.",
  ],
  rep: [
    ["Start", "Hands at eye height, a stretch under the armpits."],
    ["Move", "Sweep the bar down in an arc. The elbows keep the same small bend."],
    ["Finish", "Bar touches your thighs. Squeeze 1 second, return for 3 seconds."],
  ],
  tempo: "<b>1 s</b> down, <b>1 s</b> squeeze, <b>3 s</b> up.",
  feel: "Under the armpits and down the sides of the back. The arms only hold on.",
  fix: [
    ["Your elbows bend and it turns into a pushdown", "Lighter. Lock the small bend in the elbows."],
    ["You feel the back of the arms", "Lean forward a little more and think about bringing your upper arms down to your sides, not about pushing the bar with your hands."],
  ],
  check: "The bend in your elbows is the same at the top and at the bottom.",
  weight: "Light. One plate up when every set reaches the top of the range.",
  swap: ["pulldown"],
};
EX.deadlift = {
  name: "Deadlift", group: "Back", tag: "Glutes, hamstrings and back",
  prim: ["glutes", "hams"], sec: ["lowerback", "midback", "traps"],
  equip: "Barbell, full-size plates", kind: "compound", load: "bb", step: 5,
  typ: { sets: 3, reps: [3, 5], rest: 240 },
  band: "heavy",
  why: "The heaviest lift there is, and the one that suits the fewest reps. Each rep starts from a dead stop, and the position of your back fades as you tire, so sets stay at {reps}.",
  cue: "Bar over the middle of your feet; push the floor away and stand up with a flat back.",
  setup: [
    "Stand with the bar over the middle of your feet, feet hip-width apart.",
    "Bend over and grip the bar just outside your legs, both palms facing you. Then bend your knees until your shins touch the bar. Do not roll the bar.",
    "Lift your chest until your back is flat. Shoulders slightly in front of the bar.",
    "Take a big breath and tighten your stomach.",
  ],
  rep: [
    ["Start", "Bar on the floor, back flat, arms straight."],
    ["Move", "Push the floor away with your legs. The bar slides up your shins and thighs. Hips and chest rise together."],
    ["Finish", "Standing tall with hips and knees straight; do not lean back. Lower by pushing the hips back first, then bending the knees."],
  ],
  tempo: "Lift strongly, lower under control. Let the bar rest on the floor for a moment between reps.",
  feel: "The whole back of the body: hamstrings, glutes and the muscles along the spine.",
  fix: [
    ["Your back rounds", "It is too heavy, or the bar is too far from you. Lower the weight."],
    ["Your hips shoot up first", "Start with the hips a little higher and push with the legs."],
    ["The bar swings away from your legs", "Keep it touching you all the way up and down."],
  ],
  check: "Film one set from the side: the bar travels in a straight line, straight up and down.",
  weight: "Start with 40 kg or less. The bar must sit at mid-shin, the height full-size plates give it. If your gym's light plates are smaller, rest each end of the bar on a stack of flat plates to raise it. Add 5 kg when every set reaches the top of the range.",
  safe: "Never lift with a rounded back. If a rep slows to a stop, put the bar down.",
  swap: ["rdl"],
};

/* ----------------------------------------------------------------- LEGS */
EX.squat = {
  name: "Back Squat", group: "Legs", tag: "Quads",
  prim: ["quads"], sec: ["glutes", "lowerback"],
  equip: "Barbell, squat rack", kind: "compound", load: "bb", step: 5,
  typ: { sets: 4, reps: [6, 10], rest: 180 },
  band: "heavy",
  why: "The biggest muscles of the body under a steady bar: this lift is built to be loaded. Choose a weight that makes {reps} reps hard. With many more reps your breathing gives out before your legs do.",
  cue: "Sit down between your heels until your thighs are level, then stand up.",
  setup: [
    "Set the bar in the rack at chest height. Set the safety bars one hole below where the barbell is at the bottom of your squat; test it with the empty bar.",
    "Step under the bar so it rests on the muscle at the top of your back, not on your neck. Hands just outside your shoulders.",
    "Stand up with it and take two steps back. Feet shoulder-width apart, toes turned out slightly.",
    "Take a big breath and tighten your stomach before each rep.",
  ],
  rep: [
    ["Start", "Standing tall, weight on the whole foot."],
    ["Move", "Bend your hips and knees together. The knees travel forward and out, in line with your toes. Chest stays up."],
    ["Finish", "Thighs level with the floor or a little lower, heels still down. Then push the floor away and stand up."],
  ],
  tempo: "<b>2–3 s</b> down, then stand up strongly.",
  feel: "The front of the thighs and the glutes.",
  fix: [
    ["Your heels lift", "Stand a little wider, or put small plates under your heels."],
    ["Your knees fall inward", "Push them out toward your little toes. Lower the weight."],
    ["Your hips rise first and your chest drops", "It is too heavy. Chest and hips rise together."],
  ],
  check: "At the bottom, the crease of your hip is level with the top of your knee. Film one set from the side to see it.",
  weight: "Start with the empty bar. Add 5 kg when every set reaches the top of the range; switch to 2.5 kg jumps when 5 feels too big.",
  safe: "Always squat inside a rack with the safety bars set. If you cannot stand up, sit down and let the bars take the weight.",
  swap: ["legpress", "gobletSquat"],
};
EX.legpress = {
  name: "Leg Press", group: "Legs", tag: "Quads",
  prim: ["quads"], sec: ["glutes"],
  equip: "Leg press machine", kind: "compound", load: "machine", step: 10,
  typ: { sets: 3, reps: [10, 15], rest: 120 },
  band: "medium",
  why: "The machine takes care of balance and your back is supported, so the legs can be pushed hard for longer sets. A weight for {reps} deep reps. If the depth shrinks, it is too heavy.",
  cue: "Lower the platform as far as your hips stay on the seat, then press it away.",
  setup: [
    "Sit with your hips and your whole back against the pad.",
    "Feet in the middle of the platform, shoulder-width apart, toes turned out slightly.",
    "Press the platform up, release the safety handles, and hold the handles beside the seat.",
  ],
  rep: [
    ["Start", "Legs almost straight, knees not locked."],
    ["Move", "Lower for 3 seconds. The knees travel toward your shoulders, in line with your toes."],
    ["Finish", "As deep as you can go with your hips still flat on the seat. Then press through the whole foot until the legs are almost straight."],
  ],
  tempo: "<b>3 s</b> down, <b>1–2 s</b> up.",
  feel: "The front of the thighs and the glutes.",
  fix: [
    ["Your hips roll up off the seat at the bottom", "That is too deep for now. Stop just before it happens."],
    ["Your knees fall inward", "Push them out in line with your toes."],
    ["Your heels lift", "Move your feet a little higher on the platform."],
  ],
  check: "Your lower back stays pressed into the pad for the whole rep.",
  weight: "Start light to find your depth. Add 10 kg when every set reaches the top of the range.",
  safe: "Never snap the knees straight at the top, and put the safety handles back before you take your feet off.",
  swap: ["squat", "gobletSquat"],
};
EX.gobletSquat = {
  name: "Goblet Squat", group: "Legs", tag: "Quads",
  prim: ["quads"], sec: ["glutes"],
  equip: "One dumbbell or kettlebell", kind: "compound", load: "db1", step: 2,
  typ: { sets: 3, reps: [8, 12], rest: 120 },
  band: "medium",
  why: "Your arms have to hold the weight, so they limit how heavy this can go. That is fine: it is the lift for learning depth. {reps} deep reps.",
  cue: "Hold one dumbbell at your chest and squat down between your knees.",
  setup: [
    "Hold one dumbbell upright against your chest, both hands under its top plate.",
    "Feet shoulder-width apart, toes turned out slightly.",
    "Elbows point down, chest up.",
  ],
  rep: [
    ["Start", "Standing tall."],
    ["Move", "Lower yourself between your heels over 3 seconds. The knees travel out, in line with your toes."],
    ["Finish", "Thighs level with the floor or lower, elbows inside your knees, heels down. Stand up."],
  ],
  tempo: "<b>3 s</b> down, <b>1 s</b> up.",
  feel: "The front of the thighs and the glutes.",
  fix: [
    ["Your heels lift", "Put small plates under your heels."],
    ["You tip forward", "Keep the dumbbell touching your chest and your elbows pointing down."],
  ],
  check: "At the bottom, your elbows touch the inside of your knees.",
  weight: "Start with 8–12 kg. Take the next dumbbell when every set reaches the top of the range. When it gets hard to hold, move to the leg press or the squat.",
  swap: ["legpress", "squat"],
};
EX.lunge = {
  name: "Walking Lunge", group: "Legs", tag: "Quads and glutes",
  prim: ["quads"], sec: ["glutes"],
  equip: "Dumbbells, a clear path", kind: "compound", load: "db", step: 2,
  typ: { sets: 3, reps: [10, 12], each: true, rest: 90 },
  band: "medium",
  why: "Balance limits this lift. With dumbbells that are too heavy you wobble and shorten the step. A weight you can control for {reps} steps on each leg.",
  cue: "Take a long step and lower your back knee toward the floor.",
  setup: [
    "Stand tall with a dumbbell in each hand, arms straight at your sides.",
    "Find a clear path of about 10 steps; turn round at the end and keep going.",
    "Look ahead, chest up.",
  ],
  rep: [
    ["Start", "Standing tall."],
    ["Move", "Step forward far enough that both knees can bend to a right angle. Lower straight down."],
    ["Finish", "Back knee a hand-width above the floor, front foot flat. Push through the front foot and step straight into the next rep."],
  ],
  tempo: "Controlled: about <b>2 s</b> down on each step.",
  feel: "The thigh and the glute of the front leg.",
  fix: [
    ["You wobble", "Step slightly out to the side, so your feet stay hip-width apart instead of in one line."],
    ["Your front heel lifts", "Take a longer step."],
    ["Your front knee hurts", "Step backward into each lunge instead of forward."],
  ],
  check: "At the bottom of each step, both knees are at a right angle.",
  weight: "Start with bodyweight. Add dumbbells when 12 steps on each leg are easy.",
  swap: ["bulgarian", "legpress"],
};
EX.bulgarian = {
  name: "Bulgarian Split Squat", group: "Legs", tag: "Quads and glutes",
  prim: ["quads"], sec: ["glutes"],
  equip: "Dumbbells, flat bench", kind: "compound", load: "db", step: 2,
  typ: { sets: 3, reps: [8, 12], each: true, rest: 90 },
  band: "medium",
  why: "One leg does the work and has to balance as well, so it needs far less weight than a squat. Start lighter than you think. {reps} controlled reps on each leg.",
  cue: "Back foot on a bench; lower straight down on the front leg.",
  setup: [
    "Stand one long step in front of a bench, a dumbbell in each hand.",
    "Put the top of your back foot on the bench.",
    "Most of your weight is on the front foot, and the front foot is flat.",
  ],
  rep: [
    ["Start", "Standing on the front leg, body upright or leaning forward a little."],
    ["Move", "Lower straight down for 3 seconds. The front knee may travel over the toes; it stays in line with the second toe."],
    ["Finish", "Back knee just above the floor, front thigh level. Push up through the whole front foot."],
  ],
  tempo: "<b>3 s</b> down, <b>1 s</b> up.",
  feel: "The thigh and the glute of the front leg.",
  fix: [
    ["You lose balance", "Hold one dumbbell and keep the other hand on a support."],
    ["You want more glute", "Take a longer step and lean your chest forward a little."],
    ["You want more front of the thigh", "Take a shorter step and stay upright."],
  ],
  check: "The back leg only balances: at the top you could lift the back foot off the bench for a moment.",
  weight: "Start with bodyweight to learn the balance. Take the next dumbbells when every set reaches the top of the range.",
  swap: ["lunge", "legpress"],
};
EX.legext = {
  name: "Leg Extension", group: "Legs", tag: "Quads",
  prim: ["quads"], sec: [],
  equip: "Leg extension machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 3, reps: [12, 15], rest: 75 },
  band: "light",
  why: "The knee carries all of this lift with nothing else to help. A heavy weight strains the joint more than it trains the muscle. Use a weight you can hold at the top for 1 second, {reps} times.",
  cue: "Straighten your knees fully, squeeze, and lower slowly.",
  setup: [
    "Set the back pad so your knees line up with the machine's pivot.",
    "Set the ankle pad on the lower shin, just above your feet.",
    "If the seat reclines, lean it back one or two notches. Hold the handles.",
  ],
  rep: [
    ["Start", "Knees bent as far as the machine allows."],
    ["Move", "Straighten the knees without lifting your hips."],
    ["Finish", "Legs fully straight. Squeeze 1 second, lower for 3 seconds to the deepest bend."],
  ],
  tempo: "<b>1 s</b> up, <b>1 s</b> squeeze, <b>3 s</b> down.",
  feel: "The front of the thighs.",
  fix: [
    ["Your hips lift off the seat", "Hold the handles and pull yourself down. Lighter weight."],
    ["You kick the weight up", "Slow down. If you cannot pause at the top, it is too heavy."],
  ],
  check: "You can hold the top for one full second with straight legs.",
  weight: "One plate up when every set reaches the top of the range.",
  swap: ["legpress", "gobletSquat"],
};
EX.rdl = {
  name: "Romanian Deadlift", group: "Legs", tag: "Hamstrings",
  prim: ["hams"], sec: ["glutes", "lowerback"],
  equip: "Barbell (or two dumbbells)", kind: "compound", load: "bb", step: 5,
  typ: { sets: 3, reps: [8, 12], rest: 150 },
  band: "medium",
  why: "A big lift, but one done slowly with a long stretch. Use the weight you can lower under control with a flat back for {reps} reps, not the most you could pick up.",
  cue: "Push your hips back and slide the bar down your legs; keep your back flat.",
  setup: [
    "Take the bar from a rack at mid-thigh height, hands just outside your thighs.",
    "Feet under your hips. Take one step back.",
    "Bend the knees a little and keep that bend. Take a big breath and tighten your stomach before each rep.",
  ],
  rep: [
    ["Start", "Standing tall, bar against your thighs."],
    ["Move", "Push the hips straight back for 3 seconds. The bar slides down the legs and never leaves them."],
    ["Finish", "Where your hips cannot go further back with a flat back: usually the bar is between the knee and the middle of the shin. Stand up by pushing the hips forward."],
  ],
  tempo: "<b>3 s</b> down, <b>1 s</b> up.",
  feel: "A strong stretch at the back of the thighs. The glutes work on the way up.",
  fix: [
    ["You feel your lower back", "The bar drifted away from your legs, or you went too low. Keep it touching and stop sooner."],
    ["Your knees keep bending", "It is becoming a squat. Keep the knees at the same small bend and move only the hips."],
    ["Your grip gives up first", "Use lifting straps or chalk."],
  ],
  check: "Practise without weight: stand with your back to a wall, heels one foot-length away from it, and push your hips back until they touch the wall.",
  weight: "Start with the empty bar or two dumbbells. Add 5 kg to the bar, or take the next pair of dumbbells, when every set reaches the top of the range.",
  safe: "Stop the set if your back starts to round.",
  swap: ["backExt", "seatedLegCurl"],
};
EX.legcurl = {
  name: "Lying Leg Curl", group: "Legs", tag: "Hamstrings",
  prim: ["hams"], sec: [],
  equip: "Lying leg curl machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 3, reps: [12, 15], rest: 75 },
  band: "light",
  why: "Only the knee moves. If your hips lift off the pad, the weight is too heavy and the lower back is doing it. {reps} reps with a slow return.",
  cue: "Curl your heels toward your glutes; hips stay on the pad.",
  setup: [
    "Lie face down with your knees just off the end of the pad, in line with the pivot.",
    "Set the ankle pad just above your heels.",
    "Hold the handles and press your hips into the pad.",
  ],
  rep: [
    ["Start", "Legs straight."],
    ["Move", "Curl the heels up. The hips stay down."],
    ["Finish", "Pad as close to your glutes as it will go. Squeeze 1 second, lower for 3 seconds to straight legs."],
  ],
  tempo: "<b>1 s</b> up, <b>1 s</b> squeeze, <b>3 s</b> down.",
  feel: "The back of the thighs.",
  fix: [
    ["Your hips lift", "Lighter. Press the hips down."],
    ["Your calves cramp", "Pull your toes toward your shins."],
  ],
  check: "Your hips stay on the pad on every rep.",
  weight: "One plate up when every set reaches the top of the range.",
  swap: ["seatedLegCurl", "rdl"],
};
EX.seatedLegCurl = {
  name: "Seated Leg Curl", group: "Legs", tag: "Hamstrings",
  prim: ["hams"], sec: [],
  equip: "Seated leg curl machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 3, reps: [10, 15], rest: 75 },
  band: "light",
  why: "Only the knee moves. Use a weight you can curl all the way and let back slowly, {reps} times. If you have to yank it, go lighter.",
  cue: "Pull your heels under the seat, then let the legs straighten slowly.",
  setup: [
    "Set the back pad so your knees line up with the pivot.",
    "Lower the thigh pad firmly onto your thighs, just above the knees.",
    "Ankle pad just above your heels. Sit tall, or lean forward a little.",
  ],
  rep: [
    ["Start", "Legs straight out in front of you."],
    ["Move", "Pull the heels down and back under the seat."],
    ["Finish", "Knees bent as far as the machine allows. Squeeze 1 second, return for 3 seconds until the legs are straight."],
  ],
  tempo: "<b>1 s</b> curl, <b>1 s</b> squeeze, <b>3 s</b> back.",
  feel: "The back of the thighs, with a stretch when the legs are straight.",
  fix: [
    ["Your thighs lift", "Tighten the thigh pad."],
    ["You cut the range short", "Let the legs go fully straight on every rep."],
  ],
  check: "Your legs go fully straight at the start of every rep.",
  weight: "One plate up when every set reaches the top of the range.",
  swap: ["legcurl", "rdl"],
};
EX.calf = {
  name: "Standing Calf Raise", group: "Legs", tag: "Calves",
  prim: ["bcalf"], sec: [],
  equip: "Calf raise machine, or a step and a dumbbell", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 4, reps: [12, 20], rest: 60 },
  band: "light",
  why: "The calf moves a short distance, and with a heavy weight you start to bounce, which lets the tendon do the work. Go light enough for a full stretch and a 1-second pause at the bottom, {reps} times.",
  cue: "Rise as high as you can on the balls of your feet; lower until your heels are below the step.",
  setup: [
    "Stand with the balls of your feet on the edge of the step, heels hanging off.",
    "Shoulders under the pads. Without a machine, hold a dumbbell in one hand and a support with the other.",
    "Legs straight, knees not locked.",
  ],
  rep: [
    ["Start", "Heels below the step, a stretch in the calves. Pause here for 1–2 seconds."],
    ["Move", "Rise straight up. Do not bounce."],
    ["Finish", "As high as you can on the balls of your feet. Hold 1 second, lower for 2–3 seconds."],
  ],
  tempo: "<b>1–2 s</b> pause at the bottom, <b>1 s</b> up, <b>1 s</b> hold, <b>2–3 s</b> down.",
  feel: "The back of the lower leg.",
  fix: [
    ["You bounce", "Pause at the bottom of every rep."],
    ["Your knees bend to help", "Keep the legs straight."],
  ],
  check: "You pause at the bottom of every rep, with the heels below the step.",
  weight: "One plate up, or 5 kg, when every set reaches the top of the range.",
  swap: [],
};

/* --------------------------------------------------------------- GLUTES */
EX.hipthrust = {
  name: "Barbell Hip Thrust", group: "Glutes", tag: "Glutes",
  prim: ["glutes"], sec: ["hams"],
  equip: "Barbell, flat bench, bar pad", kind: "compound", load: "bb", step: 5,
  typ: { sets: 4, reps: [8, 12], rest: 120 },
  band: "medium",
  why: "The bar gets heavy on this lift because the movement is short, and that is fine as long as you can hold the top for 1 second. If you cannot pause there, it is too heavy. {reps} reps.",
  cue: "Shoulders on the bench; push your hips up until your body is level.",
  setup: [
    "Sit on the floor with your upper back against the long side of a bench. With big plates, roll the bar over your legs into the crease of your hips; with an empty bar or small plates, lift it onto your hips. Put a pad under it.",
    "Feet flat and shoulder-width apart, close enough that your shins are upright at the top.",
    "The bench sits under the bottom of your shoulder blades. Tuck your chin and look at the bar. Pull your lower ribs down toward your hips.",
  ],
  rep: [
    ["Start", "Hips low, bar in the crease of the hips."],
    ["Move", "Push through your heels and lift the hips. The chin stays tucked and the lower ribs stay pulled down."],
    ["Finish", "Hips level with your shoulders and knees, shins upright. Squeeze the glutes for 1 full second, lower for 2 seconds."],
  ],
  tempo: "<b>1 s</b> up, <b>1 s</b> squeeze, <b>2 s</b> down.",
  feel: "The glutes.",
  fix: [
    ["You feel your lower back", "You are arching. Look at the bar, pull your lower ribs down toward your hips, and stop when the body is level."],
    ["You feel the back of the thighs", "Bring your feet closer to you."],
    ["You feel the front of the thighs", "Move your feet a little farther away."],
  ],
  check: "At the top, your shins are straight up and down and you can hold for a full second.",
  weight: "Start with the empty bar. Add 5 kg when every set reaches the top of the range.",
  safe: "Push the bench against a wall or a rack so it cannot slide when you push back into it. Hold the bar with both hands for the whole set so it cannot roll.",
  swap: ["backExt", "rdl"],
};
EX.backExt = {
  name: "45° Back Extension", group: "Glutes", tag: "Glutes",
  prim: ["glutes"], sec: ["hams", "lowerback"],
  equip: "45° back extension bench", kind: "isolation", load: "bw", step: 5,
  typ: { sets: 3, reps: [10, 15], rest: 90 },
  band: "body",
  why: "Your upper body is the weight. Hold a plate against your chest only when {reps} slow reps are easy.",
  next: "hold a 5 kg plate against your chest",
  cue: "Bend at the hips over the pad, then lift until your body is straight.",
  setup: [
    "Set the pad just below your hip bones, so you can bend freely at the hips.",
    "Feet on the plate, turned out slightly. Cross your arms on your chest.",
    "Round your upper back a little and tuck your chin: this keeps the work in the glutes.",
  ],
  rep: [
    ["Start", "Body straight."],
    ["Move", "Bend at the hips and lower your chest for 2–3 seconds."],
    ["Finish", "Down until you feel a stretch at the back of the thighs. Then squeeze the glutes and lift until the body is straight. Do not arch past straight."],
  ],
  tempo: "<b>2–3 s</b> down, <b>1 s</b> up, a short squeeze.",
  feel: "The glutes and the back of the thighs.",
  fix: [
    ["You feel mostly your lower back", "Keep the upper back slightly rounded and stop at a straight line."],
    ["It is too easy", "Hold a plate against your chest."],
  ],
  check: "At the top your hips are fully straight: hips in line with your shoulders and your heels. The upper back is still a little rounded and the lower back is not arched.",
  weight: "Bodyweight first. Hold a 5 kg plate when every set reaches the top of the range.",
  swap: ["hipthrust", "rdl"],
};
EX.abduction = {
  name: "Hip Abduction Machine", group: "Glutes", tag: "Side glutes",
  prim: ["glutes"], sec: [],
  equip: "Hip abduction machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 3, reps: [15, 20], rest: 60 },
  band: "light",
  why: "A small muscle on the side of the hip. A heavy stack makes you rock and use momentum. Use a weight you can hold open for 1 second, {reps} times.",
  cue: "Push your knees apart as far as they go, then close slowly.",
  setup: [
    "Sit with your hips right at the back of the seat and the pads on the outside of your knees.",
    "Lean your chest forward a little, off the back pad, and hold the handles.",
    "Feet on the footrests.",
  ],
  rep: [
    ["Start", "Knees together."],
    ["Move", "Push the knees out against the pads."],
    ["Finish", "Legs as wide as the machine allows. Hold 1 second, close for 3 seconds without letting the plates touch."],
  ],
  tempo: "<b>1 s</b> out, <b>1 s</b> hold, <b>3 s</b> in.",
  feel: "The side and the upper part of the glutes.",
  fix: [
    ["You rock your body", "Lighter."],
    ["You feel the outside of the thigh more", "Lean forward a little more."],
  ],
  check: "You can hold the widest position for one full second.",
  weight: "One plate up when every set reaches the top of the range.",
  swap: [],
};

/* ----------------------------------------------------------------- CORE */
EX.hangraise = {
  name: "Hanging Leg Raise", group: "Core", tag: "Abs",
  prim: ["abs"], sec: ["obliques"],
  equip: "Pull-up bar", kind: "core", load: "bw", step: 0,
  typ: { sets: 3, reps: [10, 15], rest: 60 },
  band: "body",
  why: "Your legs are the weight. Make it harder by straightening them, not by swinging faster.",
  next: "do the next session with straight legs",
  cue: "Hang from the bar and curl your hips up as you lift your knees.",
  setup: [
    "Hang from a pull-up bar, hands shoulder-width apart.",
    "Legs together, body still.",
    "Tighten your stomach before you move.",
  ],
  rep: [
    ["Start", "Hanging still, legs down."],
    ["Move", "Lift the knees and tilt your hips up toward your ribs."],
    ["Finish", "Knees above hip height, lower back rounded slightly. Lower for 2–3 seconds without swinging."],
  ],
  tempo: "<b>1 s</b> up, <b>2–3 s</b> down.",
  feel: "The stomach muscles.",
  fix: [
    ["You swing", "Stop for a moment at the bottom of each rep."],
    ["Your grip gives up", "Use the padded arm supports if your gym has them."],
    ["You feel the front of your hips", "Curl the hips up; do not only lift the legs."],
  ],
  check: "Your knees finish higher than your hips.",
  weight: "Bent knees first. When every set reaches the top of the range, straighten the legs.",
  swap: ["cablecrunch"],
};
EX.cablecrunch = {
  name: "Cable Crunch", group: "Core", tag: "Abs",
  prim: ["abs"], sec: [],
  equip: "Cable machine, high pulley, rope", kind: "core", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [12, 15], rest: 60 },
  band: "light",
  why: "The stomach muscles curl the spine through a short distance. Too heavy and the hips and arms pull instead. Use a weight you can curl slowly {reps} times.",
  cue: "Kneel and curl your ribs down toward your hips.",
  setup: [
    "Set the pulley at the top with a rope.",
    "Kneel facing the machine, one step away from it, and hold the two rope ends beside your ears.",
    "Your hips stay above your knees for the whole set.",
  ],
  rep: [
    ["Start", "Back straight, a stretch in the stomach."],
    ["Move", "Curl your spine: bring your ribs toward your hips. The hips do not move back."],
    ["Finish", "Elbows near your knees, back rounded. Squeeze 1 second, return for 2–3 seconds."],
  ],
  tempo: "<b>1 s</b> down, <b>1 s</b> squeeze, <b>2–3 s</b> up.",
  feel: "The stomach muscles.",
  fix: [
    ["Your hips move back toward your heels", "Keep the hips still, above your knees. Lighter weight."],
    ["You pull with your arms", "Keep the hands still beside your ears."],
  ],
  check: "Your hips stay above your knees the whole time.",
  weight: "One plate up when every set reaches the top of the range.",
  swap: ["hangraise"],
};
EX.pallof = {
  name: "Pallof Press", group: "Core", tag: "Core",
  prim: ["obliques"], sec: ["abs"],
  equip: "Cable machine, single handle", kind: "core", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [10, 12], each: true, rest: 60 },
  band: "light",
  why: "The job is to stay still while the cable tries to turn you. If your body twists, it is too heavy. {reps} slow presses on each side.",
  cue: "Press the handle straight out and do not let the cable turn you.",
  setup: [
    "Set the pulley at chest height with a single handle.",
    "Stand side-on to the machine, one step away, feet shoulder-width apart.",
    "Hold the handle with both hands against your chest.",
  ],
  rep: [
    ["Start", "Hands on the chest, body square."],
    ["Move", "Press the hands straight out in front of you."],
    ["Finish", "Arms straight for 2 seconds while the cable tries to turn you. Bring the hands back to the chest."],
  ],
  tempo: "<b>2 s</b> out, <b>2 s</b> hold, <b>2 s</b> back.",
  feel: "The side of the stomach nearer the machine.",
  fix: [
    ["Your body turns toward the machine", "Lighter, or stand with your feet wider apart."],
    ["Your hips sway", "Squeeze the glutes and soften the knees."],
  ],
  check: "Your chest and belt buckle point straight ahead for the whole set.",
  weight: "One plate up when every set reaches the top of the range.",
  swap: ["plank"],
};
EX.plank = {
  name: "Plank", group: "Core", tag: "Core",
  prim: ["abs"], sec: ["obliques"],
  equip: "Floor", kind: "core", load: "time", step: 0,
  typ: { sets: 3, hold: [30, 60], rest: 60 },
  band: "hold",
  why: "No weight: you hold a position for time. Add seconds before you add anything else.",
  cue: "Hold one straight line from head to heels.",
  setup: [
    "Forearms on the floor, elbows under your shoulders.",
    "Legs straight, feet together, weight on your forearms and toes.",
    "Squeeze your glutes and tighten your stomach.",
  ],
  rep: [
    ["Start", "Body in one straight line."],
    ["Move", "Hold still. Breathe slowly."],
    ["Finish", "Stop when your hips start to drop or rise."],
  ],
  tempo: "Hold for the time shown.",
  feel: "The stomach muscles, all the way round.",
  fix: [
    ["Your hips sag", "Squeeze the glutes. End the set when you cannot hold the line."],
    ["Your lower back hurts", "Tilt your hips so your belt buckle points toward your chin, or rest on your knees."],
  ],
  check: "Your hips are level with your shoulders: not higher, not lower.",
  weight: "When you can hold 60 seconds on every set, make it harder: lift one foot, or put a plate on your back.",
  swap: ["pallof"],
};
