/* ===================================================================
   EXERCISE LIBRARY
   One entry per movement. Ids are permanent: logs are keyed by them.
     prim   muscles that limit the lift (a set counts fully for these)
     sec    muscles clearly working but not limiting (a set counts half)
     load   bb | db | machine | cable | bw | time   (how it is loaded)
     step   smallest sensible jump in kg (per dumbbell for db)
     typ    a sensible prescription when the lift is used outside a plan
     cue    the one thing to think about
     setup  where the body and the equipment go before rep one
     rep    one rep from start to finish, with body landmarks
     nums   the numbers worth checking (angles, widths, tempo)
     check  one thing you can verify in the mirror or by feel
     feel   where you should feel it
     fix    [what went wrong, what to change]
     swap   ids that train the same primary muscle (when the station is taken)
   Text may use <b>…</b> for the numbers that matter. No other markup.
   =================================================================== */
const EX = {};
EX.inclineDB = {
  name: "Incline Dumbbell Press", group: "Chest", tag: "Upper Chest",
  prim: ["uchest"], sec: ["chest", "fdelt", "triceps"],
  equip: "Dumbbells, adjustable bench", kind: "compound", load: "db", step: 2,
  typ: { sets: 4, reps: [8, 12], rest: 90 },
  draft: true,
  cue: "Bench at <b>30°</b>. Press the dumbbells up and slightly together; feel the stretch across the upper chest at the bottom. Shoulder blades pinned back and down the whole set.",
  setup: [
    "Bench at <b>30°</b> (one or two notches up from flat — 45° turns it into a shoulder press). Feet flat and wide, glutes and upper back on the pad, slight arch under the lower back. Kick the dumbbells up off your knees one at a time.",
    "Palms forward, turned in <b>10–15°</b>. Wrists stacked straight over the elbows, knuckles to the ceiling.",
  ],
  rep: [
    ["Range", "Bottom: dumbbells level with the upper chest, elbows just below the bench. Top: arms straight over the upper chest, dumbbells <b>2–3 cm</b> apart — don't clank them."],
    ["Angles", "Elbows tucked to <b>45°</b> from the torso, never flared to 90°. Forearms vertical at the bottom of every rep."],
  ],
  nums: [
    ["Tempo", "<b>3 s</b> down, brief pause, <b>1 s</b> up. Breathe in on the way down, out through the press."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Flat bench / hips arched off — hits front delts, not upper chest."],
  ],
  swap: [],
};
EX.inclineBB = {
  name: "Incline Barbell Press", group: "Chest", tag: "Upper Chest",
  prim: ["uchest"], sec: ["chest", "fdelt", "triceps"],
  equip: "Barbell, incline bench", kind: "compound", load: "bb", step: 2.5,
  typ: { sets: 4, reps: [6, 10], rest: 120 },
  draft: true,
  cue: "Lower the bar to your <b>upper chest / collarbone line</b>, elbows ~45°. Drive up and back over the shoulders. Keep a slight arch and feet planted.",
  setup: [
    "Bench at <b>30°</b>. Eyes under the bar for the unrack. Feet planted, shoulder blades pulled back and down into the pad, a hand's width of arch under the lower back.",
    "About <b>1.5×</b> shoulder width — forearms should be vertical when the bar touches the chest. Thumbs wrapped, wrists straight.",
  ],
  rep: [
    ["Range", "Touch the upper chest lightly (no bounce) to a full lockout at the top."],
    ["Angles", "Elbows <b>45–60°</b> from the torso. Bar path is a slight arc: touches the collarbone line, finishes above the shoulders."],
  ],
  nums: [
    ["Tempo", "<b>2–3 s</b> down, drive up. Big breath and brace before every rep, exhale past the sticking point."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Bench too steep — that turns it into a shoulder press — or flaring the elbows to 90°, which stresses the shoulder joint."],
  ],
  swap: [],
};
EX.pecdeck = {
  name: "Pec Deck Fly", group: "Chest", tag: "Chest",
  prim: ["chest"], sec: ["uchest", "fdelt"],
  equip: "Pec deck machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 3, reps: [12, 15], rest: 60 },
  machine: "plate",
  draft: true,
  cue: "Soft bend in the elbows, squeeze the pads together in front of your chest, slow on the way back. Think <b>hugging a tree</b>.",
  setup: [
    "Seat height so the handles sit at <b>mid-chest</b> and the elbows are level with the shoulders. Head and back on the pad, feet flat.",
    "Hands on the handles, palms facing each other; forearms on the pads if the machine has them.",
  ],
  rep: [
    ["Range", "Open only until the arms are in line with the torso — no further back. Squeeze until the handles are <b>almost touching</b>."],
    ["Angles", "Elbows bent <b>10–15°</b> and locked there. Upper arms parallel to the floor for the whole rep."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> together, <b>1 s</b> squeeze, <b>3 s</b> out."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Going so wide at the back that you feel it in the front of the shoulder instead of the chest. Stop the stretch where the chest still owns it."],
  ],
  swap: [],
};
EX.machPress = {
  name: "Machine Shoulder Press", group: "Shoulders", tag: "Shoulders",
  prim: ["fdelt"], sec: ["sdelt", "triceps"],
  equip: "Shoulder press machine", kind: "compound", load: "machine", step: 5,
  typ: { sets: 4, reps: [8, 12], rest: 90 },
  machine: "plate",
  draft: true,
  cue: "Seat set so handles start at shoulder height. Press straight up without locking hard; control back down to ear level.",
  setup: [
    "Seat set so the handles start at <b>ear height</b>. Upper back flat on the pad, feet flat, ribs down.",
    "Neutral handles if there are two options; wrists straight, not bent back.",
  ],
  rep: [
    ["Range", "Lower until the upper arms are parallel to the floor; press to just short of lockout."],
    ["Angles", "Elbows directly under the wrists and about <b>30°</b> in front of the shoulder line — not straight out to the sides."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>2–3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Starting the handles too low and bouncing out of the bottom."],
  ],
  swap: [],
};
EX.dbPress = {
  name: "Seated Dumbbell Shoulder Press", group: "Shoulders", tag: "Shoulders",
  prim: ["fdelt"], sec: ["sdelt", "triceps"],
  equip: "Dumbbells, upright bench", kind: "compound", load: "db", step: 2,
  typ: { sets: 4, reps: [8, 12], rest: 90 },
  draft: true,
  cue: "Sit upright with back support. Press dumbbells up over the shoulders; lower until elbows are just below shoulder line.",
  setup: [
    "Bench back at <b>80–90°</b>. Sit deep so the whole back is on the pad, feet flat and wide. Kick the dumbbells up from the knees.",
    "Palms forward or turned in slightly; wrists stacked over the elbows.",
  ],
  rep: [
    ["Range", "Start with the dumbbells at ear level; press until the arms are nearly straight and the dumbbells come close together. Lower until the elbows are just below the shoulder line."],
    ["Angles", "Elbows <b>20–30°</b> in front of the body (the scapular plane), forearms vertical. Never straight out to the sides."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>2–3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Over-arching the lower back to heave the weight up. Brace the abs and keep the ribs down."],
  ],
  swap: [],
};
EX.latRaise = {
  name: "Dumbbell Lateral Raise", group: "Shoulders", tag: "Side Delts",
  prim: ["sdelt"], sec: [],
  equip: "Dumbbells", kind: "isolation", load: "db", step: 1,
  typ: { sets: 4, reps: [12, 20], rest: 45 },
  draft: true,
  cue: "Lead with the <b>elbows</b>, raise out to the sides to shoulder height, pinkies slightly up. Light weight, no swinging — this is your width-builder.",
  setup: [
    "Feet hip-width, soft knees, <b>10°</b> lean forward from the hips. Dumbbells at your sides, slightly in front of the thighs.",
    "Neutral, pinkies a touch higher than the thumbs — like pouring a jug.",
  ],
  rep: [
    ["Range", "Thigh to shoulder height and no higher; going past shoulder height hands the work to the traps."],
    ["Angles", "Elbows bent <b>10–15°</b> and fixed. Raise in a plane <b>20–30°</b> in front of the body, not directly sideways. Stop at shoulder height — arms parallel to the floor."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, pause, <b>2–3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Swinging above shoulders and shrugging — load shifts to traps."],
  ],
  swap: [],
};
EX.cableLat = {
  name: "Cable Lateral Raise", group: "Shoulders", tag: "Side Delts",
  prim: ["sdelt"], sec: [],
  equip: "Cable machine, low pulley", kind: "isolation", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [12, 15], rest: 45 },
  machine: "cable",
  draft: true,
  cue: "Low pulley, cable across the body. Constant tension the whole way — raise to shoulder height, resist on the way down.",
  setup: [
    "Pulley at the <b>lowest</b> setting. Stand side-on, handle in the far hand, cable crossing in front of your shins. Half a step away so there is tension at the bottom. Free hand on the frame.",
    "Neutral, wrist straight.",
  ],
  rep: [
    ["Range", "Hand starts in front of the opposite hip and finishes at shoulder height, <b>20°</b> in front of the body."],
    ["Angles", "Elbow bent <b>10–15°</b> and fixed. Torso upright — no leaning away from the stack."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>2–3 s</b> down. Constant tension — never let the stack rest."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Swinging for momentum or shrugging the traps. Slow, torso still, elbow leads."],
  ],
  swap: [],
};
EX.pushdown = {
  name: "Triceps Pushdown", group: "Arms", tag: "Triceps",
  prim: ["triceps"], sec: [],
  equip: "Cable machine, high pulley", kind: "isolation", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [10, 15], rest: 60 },
  machine: "cable",
  draft: true,
  cue: "Elbows pinned to your sides. Extend fully and squeeze the triceps at the bottom; only the forearms move.",
  setup: [
    "Pulley at the <b>top</b>. Half a step back, feet hip-width or staggered, <b>10–15°</b> hinge forward, chest up.",
    "Straight bar or rope, hands shoulder width, wrists straight.",
  ],
  rep: [
    ["Range", "Start with the forearms just above parallel (bar at mid-chest), finish at full lockout with the bar at the thighs."],
    ["Angles", "Elbows pinned to the ribs, a fraction in front of the torso. The upper arm does not move; only the elbow angle changes."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> down, <b>1 s</b> squeeze, <b>2–3 s</b> up."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Letting the elbows drift forward, which turns it into a chest and shoulder push."],
  ],
  swap: [],
};
EX.ohext = {
  name: "Overhead Dumbbell Triceps Extension", group: "Arms", tag: "Triceps",
  prim: ["triceps"], sec: [],
  equip: "One dumbbell", kind: "isolation", load: "db", step: 2,
  typ: { sets: 3, reps: [10, 12], rest: 60 },
  draft: true,
  cue: "One dumbbell held overhead with both hands. Lower behind the head for a deep stretch, then extend. Keep elbows pointing forward.",
  setup: [
    "Seated with back support (or standing, feet hip-width). One dumbbell, ribs down, no arch.",
    "Both palms cupped under the top plate — the \"diamond\" grip.",
  ],
  rep: [
    ["Range", "Lower until the forearms drop below parallel behind the head, extend to just short of a hard lockout."],
    ["Angles", "Upper arms vertical, elbows pointing <b>forward</b> and about ear width apart. Elbow bends to <b>90°</b> or a little past."],
  ],
  nums: [
    ["Tempo", "<b>2–3 s</b> down, <b>1 s</b> up."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Flaring the elbows wide or letting the upper arms drop. Keep them fixed and high."],
  ],
  swap: [],
};
EX.pulldown = {
  name: "Lat Pulldown", group: "Back", tag: "Lats / Width",
  prim: ["lats"], sec: ["biceps", "midback", "rdelt"],
  equip: "Lat pulldown machine", kind: "compound", load: "machine", step: 5,
  typ: { sets: 4, reps: [10, 12], rest: 90 },
  machine: "lat",
  draft: true,
  cue: "Grip just outside shoulder width. Pull the bar to your <b>upper chest</b> by driving elbows down; squeeze the lats. Don’t lean back to cheat.",
  setup: [
    "Thigh pad set so the thighs are locked in. Sit tall, chest up, lean back <b>10–15°</b> and hold that angle.",
    "Overhand, about <b>1.5×</b> shoulder width — hands just outside the bar's bend.",
  ],
  rep: [
    ["Range", "Full stretch at the top (arms straight, shoulders lifted toward the ears), bar to the <b>upper chest</b>."],
    ["Angles", "Torso stays fixed at <b>10–15°</b> back. Elbows drive down and slightly back, finishing at your sides."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> down, <b>1 s</b> squeeze, <b>2–3 s</b> up."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Big backward swing — momentum, not lats, moving the weight."],
  ],
  swap: [],
};
EX.pullup = {
  name: "Pull-Ups (or Assisted)", group: "Back", tag: "Lats / Width",
  prim: ["lats"], sec: ["biceps", "midback", "rdelt"],
  equip: "Pull-up bar or assisted machine", kind: "compound", load: "bw", step: 2.5,
  typ: { sets: 3, reps: "amrap", rest: 120 },
  draft: true,
  cue: "Hands just outside shoulders. Pull your chest to the bar, lead with the elbows. Use the assist machine or a band if needed to hit the reps.",
  setup: [
    "Dead hang, legs straight or crossed behind you, core braced, shoulders pulled slightly down.",
    "Overhand, hands <b>1.2–1.5×</b> shoulder width.",
  ],
  rep: [
    ["Range", "Chin clearly over the bar at the top, arms fully straight at the bottom."],
    ["Angles", "Elbows drive down and back; chest lifts toward the bar with a small lean back at the top."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>2–3 s</b> down. On the assist machine, set the counterweight so you fail inside the rep range."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Half reps and kipping. Full range under control beats sloppy volume — use a band or the assist machine if you need it."],
  ],
  swap: [],
};
EX.cableRow = {
  name: "Seated Cable Row", group: "Back", tag: "Back Thickness",
  prim: ["midback", "lats"], sec: ["biceps", "rdelt", "traps"],
  equip: "Seated cable row station", kind: "compound", load: "cable", step: 5,
  typ: { sets: 4, reps: [10, 12], rest: 90 },
  machine: "cable",
  draft: true,
  cue: "Tall chest, pull the handle to your <b>belly button</b>, squeeze the shoulder blades together, then control the stretch forward. Minimal torso swing.",
  setup: [
    "Feet on the platform, knees bent <b>10–20°</b>, torso upright at <b>90°</b> to the floor. Sit tall.",
    "V-handle (neutral) for thickness; wide bar for the upper back.",
  ],
  rep: [
    ["Range", "Full stretch forward — shoulders rolled ahead, elbows straight — then pull to the abdomen with the shoulder blades squeezed."],
    ["Angles", "Elbows tucked, pulled toward the belly button. The torso may drift <b>±10°</b>, no more."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> pull, <b>1 s</b> squeeze, <b>2–3 s</b> return."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Rounded back and shrugging forward — risks the lower back."],
  ],
  swap: [],
};
EX.csRow = {
  name: "Chest-Supported Row", group: "Back", tag: "Back Thickness",
  prim: ["midback", "lats"], sec: ["biceps", "rdelt", "traps"],
  equip: "Chest-supported row machine", kind: "compound", load: "machine", step: 5,
  typ: { sets: 4, reps: [10, 12], rest: 90 },
  machine: "plate",
  draft: true,
  cue: "Chest on the pad takes momentum out. Row to your ribs, elbows back and down, big squeeze. Strict and controlled.",
  setup: [
    "Chest on the pad, seat height so the pad sits at the <b>sternum</b>. Feet planted, neck neutral.",
    "Neutral for thickness, wide overhand for the upper back.",
  ],
  rep: [
    ["Range", "Full stretch with the shoulders forward; row until the elbows are behind the torso."],
    ["Angles", "Elbows at <b>45°</b> from the torso, driving back and down toward the ribs."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> pull, <b>1 s</b> squeeze, <b>2–3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Yanking with the lower back or shrugging upward. The chest pad is there so you row instead of heave."],
  ],
  swap: [],
};
EX.dbRow = {
  name: "Single-Arm Dumbbell Row", group: "Back", tag: "Lats / Thickness",
  prim: ["lats"], sec: ["midback", "biceps", "rdelt"],
  equip: "One dumbbell, flat bench", kind: "compound", load: "db", step: 2,
  typ: { sets: 3, reps: [10, 12], each: true, rest: 60 },
  draft: true,
  cue: "One hand and knee on the bench, flat back. Row the dumbbell to your hip, lead with the elbow, full stretch at the bottom.",
  setup: [
    "One hand and the same-side knee on the bench, other foot on the floor slightly back. Back flat and <b>parallel</b> to the floor, neck neutral.",
    "Neutral, palm facing the bench.",
  ],
  rep: [
    ["Range", "Full stretch at the bottom (shoulder drops toward the floor), dumbbell to the hip crease."],
    ["Angles", "Elbow at <b>45°</b> from the torso, driving up and back toward the hip. Shoulders stay square — no twisting to lift."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>1 s</b> squeeze, <b>2–3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Rounded/twisting back — keep the spine long and still."],
  ],
  swap: [],
};
EX.straightArm = {
  name: "Straight-Arm Pulldown", group: "Back", tag: "Lats",
  prim: ["lats"], sec: [],
  equip: "Cable machine, high pulley", kind: "isolation", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [12, 15], rest: 60 },
  machine: "cable",
  draft: true,
  cue: "High pulley, arms almost straight. Sweep the bar down to your thighs using the lats; feel them stretch at the top. Isolation, light weight.",
  setup: [
    "Pulley at the <b>top</b>. One step back, hinge <b>20–30°</b> at the hips, soft knees, chest up.",
    "Overhand, shoulder width on a straight bar (or rope).",
  ],
  rep: [
    ["Range", "From arms overhead (bar at eye level, lats stretched) down to the thighs."],
    ["Angles", "Elbows bent <b>10–15°</b> and locked there — the arm sweeps in an arc from the shoulder."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> down, <b>1 s</b> squeeze, <b>2–3 s</b> up."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Bending the elbows, which makes it a triceps movement. Arms stay long, slight hinge at the hip."],
  ],
  swap: [],
};
EX.reardelt = {
  name: "Reverse Pec Deck", group: "Shoulders", tag: "Rear Delts",
  prim: ["rdelt"], sec: ["midback", "traps"],
  equip: "Reverse pec deck machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 4, reps: [15, 20], rest: 45 },
  machine: "plate",
  draft: true,
  cue: "Face the pad, arms out wide and back, lead with the pinkies/elbows. High reps, smooth tempo — builds the rear delts for that 3D shoulder.",
  setup: [
    "Face the pad, seat height so the handles are at <b>shoulder</b> height, chest against the pad, feet flat.",
    "Neutral (palms facing in).",
  ],
  rep: [
    ["Range", "Handles from in front of you to <b>in line</b> with the shoulders. Past that it stops being rear delt."],
    ["Angles", "Elbows slightly bent, upper arms parallel to the floor — move in a flat horizontal arc."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> back, pause, <b>2 s</b> in."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Too much weight, so the mid-traps and momentum take over. Light and controlled."],
  ],
  swap: [],
};
EX.facepull = {
  name: "Face Pull", group: "Shoulders", tag: "Rear Delts / Health",
  prim: ["rdelt"], sec: ["midback", "traps"],
  equip: "Cable machine, rope", kind: "isolation", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [15, 20], rest: 45 },
  machine: "cable",
  draft: true,
  cue: "Rope at face height. Pull toward your forehead with <b>elbows high</b>, splitting the rope apart. Great for posture and healthy shoulders.",
  setup: [
    "Rope at <b>upper-face</b> height. Step back until the arms are straight with tension; staggered stance or a slight lean back.",
    "Thumbs behind the rope ends, overhand-neutral.",
  ],
  rep: [
    ["Range", "Arms fully extended to hands beside the ears with the rope pulled apart."],
    ["Angles", "Elbows high — level with the ears — upper arms parallel to the floor. Pull to the forehead, hands finishing beside the ears."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> pull, <b>1 s</b> squeeze, <b>2 s</b> out."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Elbows dropped — it turns into a row and misses the rear delts."],
  ],
  swap: [],
};
EX.bbCurl = {
  name: "Barbell Curl", group: "Arms", tag: "Biceps",
  prim: ["biceps"], sec: ["forearm"],
  equip: "Barbell or EZ bar", kind: "isolation", load: "bb", step: 2.5,
  typ: { sets: 3, reps: [8, 12], rest: 60 },
  draft: true,
  cue: "Elbows fixed at your sides, curl the bar up without swinging, squeeze, lower slowly. Keep the wrists neutral.",
  setup: [
    "Feet hip-width, knees soft, chest up, elbows at the ribs. Stand with your back a hand's width off a wall if you tend to swing.",
    "Underhand, shoulder width (or EZ bar on the inner grips).",
  ],
  rep: [
    ["Range", "From full extension (no bounce) to the forearm just past vertical."],
    ["Angles", "Upper arms fixed at your sides and a fraction in front. Wrists straight — don't curl them."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>1 s</b> squeeze, <b>2–3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Swinging the torso for momentum. Upper arms still, strict movement."],
  ],
  swap: [],
};
EX.dbCurl = {
  name: "Dumbbell Curl", group: "Arms", tag: "Biceps",
  prim: ["biceps"], sec: ["forearm"],
  equip: "Dumbbells", kind: "isolation", load: "db", step: 1,
  typ: { sets: 3, reps: [10, 12], each: true, rest: 60 },
  draft: true,
  cue: "Curl one or both dumbbells, rotate the pinky up at the top for a peak squeeze. No body english.",
  setup: [
    "Standing, or seated with back support to kill the swing. Elbows pinned to the ribs.",
    "Start with the palms facing in (hammer), rotate to palm-up by halfway.",
  ],
  rep: [
    ["Range", "Full extension at the bottom to a full squeeze at the top."],
    ["Angles", "Upper arm fixed; rotate the pinky up at the top so the palm faces the shoulder."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>1 s</b> squeeze, <b>3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Letting the elbows drift forward to cheat the stretch. Keep them back behind the torso."],
  ],
  swap: [],
};
EX.squat = {
  name: "Back Squat", group: "Legs", tag: "Athletic Legs",
  prim: ["quads"], sec: ["glutes", "lowerback"],
  equip: "Barbell, squat rack", kind: "compound", load: "bb", step: 5,
  typ: { sets: 4, reps: [6, 10], rest: 150 },
  draft: true,
  cue: "Bar on upper traps, brace hard. Sit down between your hips to <b>at least parallel</b>, knees tracking over the toes, drive through mid-foot.",
  setup: [
    "Bar on the upper traps (high bar). Feet shoulder width, toes out <b>15–30°</b>. Big breath into the belly, brace, then unrack.",
    "Hands as close as the shoulders allow, elbows down, pull the bar into the back.",
  ],
  rep: [
    ["Range", "Depth to standing tall, hips fully open at the top."],
    ["Angles", "Knees track over the toes. Torso leans up to <b>45°</b> at the bottom on a high-bar squat — chest stays up. Depth: hip crease <b>at or below</b> the knee."],
  ],
  nums: [
    ["Tempo", "<b>2–3 s</b> down, drive up. Re-breathe and re-brace at the top of every rep."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Hips shoot up and torso folds — turns into a back-loaded good-morning."],
  ],
  swap: [],
};
EX.rdl = {
  name: "Romanian Deadlift", group: "Legs", tag: "Hamstrings / Glutes",
  prim: ["hams"], sec: ["glutes", "lowerback"],
  equip: "Barbell", kind: "compound", load: "bb", step: 5,
  typ: { sets: 3, reps: [8, 12], rest: 120 },
  draft: true,
  cue: "Soft knees, push the <b>hips back</b> and slide the bar down your legs until you feel a hamstring stretch. Flat back the whole time, then drive hips forward.",
  setup: [
    "Feet hip-width, toes forward, bar touching the thighs, shoulders over the bar.",
    "Overhand, hands just outside the thighs. Straps are fine once grip limits you.",
  ],
  rep: [
    ["Range", "Bar slides down the legs to <b>mid-shin</b> — stop where the hamstring stretch peaks, not at the floor. Back up to standing with the glutes squeezed, no leaning back."],
    ["Angles", "Knees bent <b>15–20°</b> and fixed. Hips push back; back flat. Torso finishes between <b>45°</b> and nearly parallel to the floor."],
  ],
  nums: [
    ["Tempo", "<b>3 s</b> down, <b>1 s</b> up."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Rounded lower back — the single fastest way to hurt it."],
  ],
  swap: [],
};
EX.legpress = {
  name: "Leg Press", group: "Legs", tag: "Quads / Glutes",
  prim: ["quads"], sec: ["glutes"],
  equip: "Leg press machine", kind: "compound", load: "machine", step: 10,
  typ: { sets: 4, reps: [10, 15], rest: 90 },
  machine: "legpress",
  draft: true,
  cue: "Feet shoulder-width on the platform. Lower until knees reach ~90°, then press without locking out hard. Don’t let your lower back round off the seat.",
  setup: [
    "Back and hips flat on the pad. Feet mid-platform, shoulder width, toes out <b>10°</b>. Feet higher = more glute, lower = more quad.",
    "Hands on the handles, pulling yourself into the seat.",
  ],
  rep: [
    ["Range", "From 90° knees to just short of lockout — never snap the knees straight."],
    ["Angles", "Knees bend to <b>90°</b> or a little more, tracking over the toes. The hips never lift off the pad."],
  ],
  nums: [
    ["Tempo", "<b>2–3 s</b> down, <b>1 s</b> up."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Letting the lower back round off the pad at the bottom by going too deep, or snapping the knees straight at the top."],
  ],
  swap: [],
};
EX.lunge = {
  name: "Walking Lunge", group: "Legs", tag: "Athletic Legs",
  prim: ["quads", "glutes"], sec: ["hams"],
  equip: "Dumbbells", kind: "compound", load: "db", step: 2,
  typ: { sets: 3, reps: [10, 12], each: true, rest: 90 },
  draft: true,
  cue: "Long step, drop the back knee toward the floor, torso tall. Drive through the front heel to stand and step through. Add dumbbells when easy.",
  setup: [
    "Stand tall, dumbbells at your sides. Step length about <b>two shoe lengths</b>.",
    "Neutral, arms hanging still — they don't help.",
  ],
  rep: [
    ["Range", "Back knee to <b>2–5 cm</b> above the floor, then drive through the front heel to stand."],
    ["Angles", "Front shin vertical or a fraction forward, front knee <b>90°</b>, back knee <b>90°</b> hovering just off the floor. Torso upright, a slight lean forward is fine."],
  ],
  nums: [
    ["Tempo", "<b>2 s</b> down, <b>1 s</b> up."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Short, choppy steps that put all of it on the knee. Step out far enough that the hip does the work."],
  ],
  swap: [],
};
EX.bulgarian = {
  name: "Bulgarian Split Squat", group: "Legs", tag: "Athletic Legs",
  prim: ["quads", "glutes"], sec: ["hams"],
  equip: "Dumbbells, flat bench", kind: "compound", load: "db", step: 2,
  typ: { sets: 3, reps: [8, 12], each: true, rest: 90 },
  draft: true,
  cue: "Back foot on a bench, most weight on the front leg. Drop straight down, knee tracking forward, drive up through the front heel. Brutal but builds athletic single-leg strength.",
  setup: [
    "Bench behind you, laces of the rear foot on it. Front foot far enough forward that the front shin is <b>vertical</b> at the bottom — about two shoe lengths from the bench.",
    "Dumbbells at the sides (or one held at the chest to start).",
  ],
  rep: [
    ["Range", "Rear knee to just above the floor, then up through the front heel."],
    ["Angles", "Front knee to <b>90°</b>. Torso <b>10–20°</b> forward for more glute, upright for more quad."],
  ],
  nums: [
    ["Tempo", "<b>2 s</b> down, <b>1 s</b> up."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Stance too short, so the knee shoots past the toes — or wobbling. Find your foot position and stay stable."],
  ],
  swap: [],
};
EX.legcurl = {
  name: "Lying Leg Curl", group: "Legs", tag: "Hamstrings",
  prim: ["hams"], sec: [],
  equip: "Lying leg curl machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 3, reps: [12, 15], rest: 60 },
  machine: "legpad",
  draft: true,
  cue: "Curl the pad toward your glutes with control, squeeze the hamstrings hard at the top, slow on the way down. Keep hips on the pad.",
  setup: [
    "Lying face down, knee joint lined up with the machine's pivot, ankle pad just above the heel. Hips pressed into the pad, hands on the handles.",
    "Hold the handles and pull yourself into the bench.",
  ],
  rep: [
    ["Range", "Full stretch to full curl every rep."],
    ["Angles", "Start with the knees almost straight (<b>10°</b> bend); curl until the pad is near the glutes. Toes pointed keeps it on the hamstrings."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>1 s</b> squeeze, <b>3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Jerking the weight up and letting the hips pop off the bench."],
  ],
  swap: [],
};
EX.legext = {
  name: "Leg Extension", group: "Legs", tag: "Quads",
  prim: ["quads"], sec: [],
  equip: "Leg extension machine", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 3, reps: [12, 15], rest: 60 },
  machine: "legpad",
  draft: true,
  cue: "Extend the knees fully and squeeze the quads at the top; lower slowly. A great low-stress way to add quad volume and detail.",
  setup: [
    "Seat back so the knee lines up with the pivot; ankle pad just above the foot. Back flat, hold the handles.",
    "Handles, pulling the hips into the seat.",
  ],
  rep: [
    ["Range", "Full lockout at the top with a squeeze; back to 90°, not further."],
    ["Angles", "Start at <b>90°</b>, extend to fully straight. Toes pointing up."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>1–2 s</b> squeeze, <b>3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Swinging up with momentum and dropping the weight fast on the way down."],
  ],
  swap: [],
};
EX.calf = {
  name: "Standing Calf Raise", group: "Legs", tag: "Calves",
  prim: ["bcalf"], sec: [],
  equip: "Calf raise machine or a step", kind: "isolation", load: "machine", step: 5,
  typ: { sets: 4, reps: [12, 20], rest: 45 },
  draft: true,
  cue: "Rise all the way onto your <b>toes</b>, pause and squeeze at the top, then lower for a full stretch. Slow tempo beats heavy bouncing.",
  setup: [
    "Balls of the feet on the edge, heels hanging free, feet hip-width and straight ahead.",
    "Hands on the frame or shoulders under the pads; stand tall.",
  ],
  rep: [
    ["Range", "Heel <b>below</b> the step at the bottom for a full stretch, up onto the very tips of the toes at the top."],
    ["Angles", "Knees straight (soft, not locked hard) the whole set — bending them hands the work to the soleus."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>2 s</b> squeeze, <b>3 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Bouncing through tiny partial reps. Slow down — full stretch at the bottom, full squeeze at the top."],
  ],
  swap: [],
};
EX.hangraise = {
  name: "Hanging Leg Raise", group: "Core", tag: "Lower Abs",
  prim: ["abs"], sec: ["obliques"],
  equip: "Pull-up bar", kind: "core", load: "bw", step: 0,
  typ: { sets: 3, reps: [10, 15], rest: 60 },
  draft: true,
  cue: "Hang from the bar, <b>curl the pelvis up</b> as you raise the knees/legs — this targets the lower abs (your problem area). No swinging.",
  setup: [
    "Hang overhand at shoulder width, shoulders pulled down away from the ears, slight hollow through the body.",
    "Overhand; straps or the ab slings if grip goes before the abs.",
  ],
  rep: [
    ["Range", "The rep is the pelvic curl at the top, not the knee lift — lower back to a dead hang, stop every swing before the next rep."],
    ["Angles", "Knees bent to start; raise until the thighs pass parallel and the <b>pelvis curls</b> up. Straight-leg version: legs to <b>90°</b> and beyond."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>2 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Swinging the whole body for momentum — abs barely work."],
  ],
  swap: [],
};
EX.cablecrunch = {
  name: "Cable Crunch", group: "Core", tag: "Abs",
  prim: ["abs"], sec: [],
  equip: "Cable machine, rope", kind: "core", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [12, 15], rest: 60 },
  machine: "cable",
  draft: true,
  cue: "Kneel under a high rope, hands by your head. Crunch your <b>ribcage toward your pelvis</b> by rounding the spine — hips stay put. Squeeze the abs, don’t just bend at the hips.",
  setup: [
    "Kneel about <b>60 cm</b> from the machine, hips high — not sitting on the heels. Rope held at the temples.",
    "Rope ends at the sides of the head, elbows in.",
  ],
  rep: [
    ["Range", "From a tall, slightly extended spine (abs stretched) to the elbows near the thighs."],
    ["Angles", "Hips stay at one angle; only the spine rounds. Elbows travel toward the mid-thigh."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> down, <b>1 s</b> squeeze, <b>2 s</b> up."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Hinging at the hips and just bowing, instead of flexing the spine. Round the upper back down."],
  ],
  swap: [],
};
EX.pallof = {
  name: "Pallof Press", group: "Core", tag: "Core / Waist",
  prim: ["obliques"], sec: ["abs"],
  equip: "Cable machine", kind: "core", load: "cable", step: 2.5,
  typ: { sets: 3, reps: [10, 12], each: true, rest: 45 },
  machine: "cable",
  draft: true,
  cue: "Stand side-on to a cable, press the handle straight out and resist the pull twisting you. <b>Anti-rotation</b> core work — builds a tight, strong midsection.",
  setup: [
    "Cable at <b>chest</b> height. Stand side-on, feet shoulder width, knees soft, one arm's length from the stack so it pulls hard.",
    "Both hands on the handle at the sternum.",
  ],
  rep: [
    ["Range", "Sternum to full extension and back — the resistance is in holding still."],
    ["Angles", "Hips and shoulders stay square to the front. Press until the elbows lock straight in front of the chest."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> out, <b>2 s</b> hold, <b>1 s</b> in."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Letting the torso twist toward the machine. The entire point is to not rotate."],
  ],
  swap: [],
};
EX.plank = {
  name: "Plank", group: "Core", tag: "Core Stability",
  prim: ["abs"], sec: ["obliques", "lowerback"],
  equip: "Floor", kind: "core", load: "time", step: 0,
  typ: { sets: 3, hold: [30, 60], rest: 45 },
  draft: true,
  cue: "Forearms down, body in <b>one straight line</b> from head to heels. Squeeze glutes and abs, don’t let the hips sag. Brace, breathe, hold.",
  setup: [
    "Elbows directly under the shoulders, forearms parallel, feet together or hip-width.",
    "Fists or flat palms — flat palms spread the load.",
  ],
  rep: [
    ["Range", "No movement — the moment the hips sag or rise, the set is over."],
    ["Angles", "One straight line: ear, shoulder, hip, knee, ankle. Tuck the pelvis slightly so the lower back doesn't dip. Eyes on the floor."],
  ],
  nums: [
    ["Tempo", "Slow, steady breathing for <b>30–60 s</b>; squeeze the glutes and abs the whole time."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Hips sagging — loads the lower back instead of the core."],
  ],
  swap: [],
};
EX.hipthrust = {
  name: "Barbell Hip Thrust", group: "Glutes", tag: "Glutes",
  prim: ["glutes"], sec: ["hams", "quads"],
  equip: "Barbell, flat bench", kind: "compound", load: "bb", step: 5,
  typ: { sets: 4, reps: [8, 12], rest: 90 },
  draft: true,
  cue: "Shoulder blades on the bench, chin tucked, <b>ribs down</b>. Drive through the heels and squeeze the glutes hard for a full second at the top — the lockout is the exercise, not the depth.",
  setup: [
    "Upper back on the edge of the bench (just below the shoulder blades), bar padded across the hips, feet flat at shoulder width.",
    "Hands on the bar to keep it over the hips.",
  ],
  rep: [
    ["Range", "Hips from near the floor to full extension, level with the knees and shoulders."],
    ["Angles", "At the top the shins are <b>vertical</b> (knee at 90°) and the torso is horizontal, chin tucked. If the heels push away, the feet were too far out."],
  ],
  nums: [
    ["Tempo", "<b>1 s</b> up, <b>1–2 s</b> squeeze, <b>2 s</b> down."],
  ],
  check: "",
  feel: "",
  fix: [
    ["Avoid", "Arching the lower back to fake a higher lockout, or pushing through the toes. Ribs stay down, heels stay planted."],
  ],
  swap: [],
};
