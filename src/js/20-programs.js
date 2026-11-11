/* ===================================================================
   PROGRAMS
   A program is a training target. Each has one variant per days-a-week
   it is offered at; a variant lists its sessions in week order, and each
   session lists its items: the exercise and exactly how it is prescribed
   there (sets, reps or hold seconds, rest in seconds).
     def    the days-a-week variant offered first
     level  1 suits a beginner · 2 needs a few months of lifting behind you
     focus  the muscles the plan gives the most work
     check  what tools/validate.mjs holds the plan to
     days   default training weekdays (0 = Sunday … 6 = Saturday)
     reps   [low, high]     hold: [low, high] seconds     each: per side
   An exercise that appears twice in one week is prescribed the same way
   both times, so its history always compares like with like.
   =================================================================== */
const PROGRAMS = {};
const PROGRAM_ORDER = ["build", "vtaper", "glutes", "lean", "strength", "foundation"];

PROGRAMS.vtaper = {
  name: "V-Taper",
  line: "Wider shoulders and back, a tighter waist.",
  who: "For anyone past the first months of lifting who wants the classic athletic shape.",
  focus: ["sdelt", "lats", "uchest"],
  level: 2, def: 5,
  check: { profile: "build", emphasis: ["sdelt", "lats"], maxMin: 76 },
  about: [
    "Side delts, lats and upper chest get the most work. Legs and core are trained in full, so the shape stays balanced.",
    "Every muscle is trained twice a week.",
  ],
  variants: {
    5: { days: [1, 2, 3, 4, 5], sessions: [
      { name: "Chest & Shoulders", tag: "Push", focus: "Heavy incline press first, then shoulder width.", warm: "push", items: [
        { ex: "inclineBB", sets: 4, reps: [6, 10], rest: 150 },
        { ex: "machPress", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "pecdeck", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "pushdown", sets: 3, reps: [10, 15], rest: 75 },
        { ex: "calf", sets: 4, reps: [12, 20], rest: 60 },
      ] },
      { name: "Back Width & Biceps", tag: "Pull", focus: "Pulling down for width, then rows and arms.", warm: "pull", items: [
        { ex: "pullup", sets: 3, reps: [5, 10], rest: 150 },
        { ex: "pulldown", sets: 4, reps: [10, 12], rest: 120 },
        { ex: "cableRow", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "straightArm", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "reardelt", sets: 3, reps: [15, 20], rest: 60 },
        { ex: "bbCurl", sets: 3, reps: [8, 12], rest: 75 },
        { ex: "pallof", sets: 3, reps: [10, 12], each: true, rest: 60 },
      ] },
      { name: "Quads & Core", tag: "Legs", focus: "Squat first, then the machines and the abs.", warm: "legs", items: [
        { ex: "squat", sets: 4, reps: [6, 10], rest: 180 },
        { ex: "legpress", sets: 3, reps: [10, 15], rest: 120 },
        { ex: "legext", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "calf", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "hangraise", sets: 3, reps: [10, 15], rest: 60 },
      ] },
      { name: "Shoulders & Arms", tag: "Delts + Arms", focus: "A second round for the shoulders and upper chest. This is the day that builds the shape.", warm: "push", items: [
        { ex: "dbPress", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "inclineDB", sets: 4, reps: [8, 12], rest: 120 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "cableLat", sets: 3, reps: [12, 15], each: true, rest: 60 },
        { ex: "facepull", sets: 3, reps: [15, 20], rest: 60 },
        { ex: "dbCurl", sets: 3, reps: [10, 12], each: true, rest: 75 },
        { ex: "ohext", sets: 3, reps: [10, 12], rest: 75 },
      ] },
      { name: "Glutes, Hamstrings & Back", tag: "Posterior", focus: "Hip-hinge work first, then rowing for a thicker back.", warm: "hinge", items: [
        { ex: "hipthrust", sets: 4, reps: [8, 12], rest: 120 },
        { ex: "rdl", sets: 3, reps: [8, 12], rest: 150 },
        { ex: "bulgarian", sets: 3, reps: [8, 12], each: true, rest: 90 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "csRow", sets: 4, reps: [10, 12], rest: 120 },
        { ex: "dbRow", sets: 3, reps: [10, 12], each: true, rest: 90 },
      ] },
    ] },
    4: { days: [1, 2, 4, 5], sessions: [
      { name: "Upper A", tag: "Upper A", focus: "Incline press and pulldown first, then the shoulders.", warm: "push", items: [
        { ex: "inclineBB", sets: 4, reps: [6, 10], rest: 150 },
        { ex: "pulldown", sets: 4, reps: [10, 12], rest: 120 },
        { ex: "machPress", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "straightArm", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "facepull", sets: 3, reps: [15, 20], rest: 60 },
        { ex: "ohext", sets: 3, reps: [10, 12], rest: 75 },
      ] },
      { name: "Quads & Core", tag: "Lower A", focus: "Squat first, core to finish.", warm: "legs", items: [
        { ex: "squat", sets: 4, reps: [6, 10], rest: 180 },
        { ex: "legpress", sets: 3, reps: [10, 15], rest: 120 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "legext", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "calf", sets: 3, reps: [12, 20], rest: 60 },
        { ex: "hangraise", sets: 3, reps: [10, 15], rest: 60 },
      ] },
      { name: "Upper B", tag: "Upper B", focus: "Pull-ups and rows first, then upper chest and shoulders.", warm: "pull", items: [
        { ex: "pullup", sets: 3, reps: [5, 10], rest: 150 },
        { ex: "csRow", sets: 4, reps: [10, 12], rest: 120 },
        { ex: "inclineDB", sets: 4, reps: [8, 12], rest: 120 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "straightArm", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "reardelt", sets: 3, reps: [15, 20], rest: 60 },
        { ex: "bbCurl", sets: 3, reps: [8, 12], rest: 75 },
      ] },
      { name: "Glutes & Hamstrings", tag: "Lower B", focus: "Hip-hinge work, plus side delts and core.", warm: "hinge", items: [
        { ex: "hipthrust", sets: 4, reps: [8, 12], rest: 120 },
        { ex: "rdl", sets: 3, reps: [8, 12], rest: 150 },
        { ex: "bulgarian", sets: 3, reps: [8, 12], each: true, rest: 90 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "calf", sets: 3, reps: [12, 20], rest: 60 },
        { ex: "cableLat", sets: 3, reps: [12, 15], each: true, rest: 60 },
        { ex: "pallof", sets: 3, reps: [10, 12], each: true, rest: 60 },
      ] },
    ] },
  },
};

PROGRAMS.build = {
  name: "Balanced Muscle",
  line: "Even muscle gain from head to toe.",
  who: "For anyone who wants to build muscle everywhere, with no weak spots.",
  focus: ["chest", "lats", "quads", "hams"],
  level: 2, def: 4,
  check: { profile: "build", emphasis: [], maxMin: 76 },
  about: [
    "Two upper-body days and two lower-body days. Every muscle gets a full dose twice a week.",
    "Big lifts first, smaller muscles after.",
  ],
  variants: {
    4: { days: [1, 2, 4, 5], sessions: [
      { name: "Upper 1", tag: "Upper 1", focus: "Bench press and rows, then shoulders and arms.", warm: "push", items: [
        { ex: "benchBB", sets: 4, reps: [6, 10], rest: 150 },
        { ex: "cableRow", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "dbPress", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "pulldown", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "pecdeck", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "bbCurl", sets: 3, reps: [8, 12], rest: 75 },
      ] },
      { name: "Lower 1", tag: "Lower 1", focus: "Squat first, then the machines.", warm: "legs", items: [
        { ex: "squat", sets: 4, reps: [6, 10], rest: 180 },
        { ex: "legpress", sets: 3, reps: [10, 15], rest: 120 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "legext", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "calf", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "hangraise", sets: 3, reps: [10, 15], rest: 60 },
      ] },
      { name: "Upper 2", tag: "Upper 2", focus: "Incline press and pull-ups, then the smaller muscles.", warm: "pull", items: [
        { ex: "inclineDB", sets: 4, reps: [8, 12], rest: 120 },
        { ex: "pullup", sets: 3, reps: [5, 10], rest: 150 },
        { ex: "csRow", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "reardelt", sets: 3, reps: [15, 20], rest: 60 },
        { ex: "straightArm", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "ohext", sets: 3, reps: [10, 12], rest: 75 },
      ] },
      { name: "Lower 2", tag: "Lower 2", focus: "Hamstrings and glutes first.", warm: "hinge", items: [
        { ex: "rdl", sets: 4, reps: [8, 12], rest: 150 },
        { ex: "bulgarian", sets: 3, reps: [8, 12], each: true, rest: 90 },
        { ex: "hipthrust", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "seatedLegCurl", sets: 3, reps: [10, 15], rest: 75 },
        { ex: "calf", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "cablecrunch", sets: 3, reps: [12, 15], rest: 60 },
      ] },
    ] },
  },
};

PROGRAMS.glutes = {
  name: "Glutes & Legs",
  line: "Stronger, rounder glutes and legs, with the upper body kept in shape.",
  who: "For anyone whose first goal is the lower body.",
  focus: ["glutes", "quads", "hams"],
  level: 2, def: 4,
  check: { profile: "build", emphasis: ["glutes", "quads", "hams"], lower: ["chest", "lats", "midback", "sdelt", "fdelt", "rdelt", "biceps", "triceps"], maxMin: 76 },
  about: [
    "Three lower-body days built around the hip thrust, the squat and single-leg work.",
    "One upper-body day, plus a little on the last day, keeps the rest of you strong.",
  ],
  variants: {
    4: { days: [1, 2, 4, 6], sessions: [
      { name: "Glutes & Hamstrings", tag: "Lower 1", focus: "Hip thrust and hip-hinge first.", warm: "hinge", items: [
        { ex: "hipthrust", sets: 3, reps: [8, 12], rest: 150 },
        { ex: "rdl", sets: 3, reps: [8, 12], rest: 150 },
        { ex: "bulgarian", sets: 3, reps: [8, 12], each: true, rest: 90 },
        { ex: "seatedLegCurl", sets: 3, reps: [10, 15], rest: 75 },
        { ex: "legext", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "cablecrunch", sets: 3, reps: [12, 15], rest: 60 },
      ] },
      { name: "Upper Body", tag: "Upper", focus: "One round for every upper-body muscle.", warm: "push", items: [
        { ex: "inclineDB", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "pulldown", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "machPress", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "cableRow", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "latRaise", sets: 3, reps: [12, 20], rest: 60 },
        { ex: "facepull", sets: 3, reps: [15, 20], rest: 60 },
      ] },
      { name: "Quads & Glutes", tag: "Lower 2", focus: "Squat first, then single-leg work.", warm: "legs", items: [
        { ex: "squat", sets: 4, reps: [6, 10], rest: 180 },
        { ex: "legpress", sets: 3, reps: [10, 15], rest: 120 },
        { ex: "lunge", sets: 3, reps: [10, 12], each: true, rest: 90 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "calf", sets: 4, reps: [12, 20], rest: 60 },
        { ex: "pallof", sets: 3, reps: [10, 12], each: true, rest: 60 },
      ] },
      { name: "Glutes & Upper", tag: "Lower 3", focus: "A second glute day, with a little upper-body work.", warm: "hinge", items: [
        { ex: "hipthrust", sets: 3, reps: [8, 12], rest: 150 },
        { ex: "backExt", sets: 3, reps: [10, 15], rest: 90 },
        { ex: "abduction", sets: 3, reps: [15, 20], rest: 60 },
        { ex: "csRow", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "benchDB", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "latRaise", sets: 3, reps: [12, 20], rest: 60 },
        { ex: "calf", sets: 4, reps: [12, 20], rest: 60 },
      ] },
    ] },
  },
};

PROGRAMS.lean = {
  name: "Lean & Defined",
  line: "Keep your muscle while the fat comes off.",
  who: "For anyone losing fat who wants shorter sessions and room for cardio.",
  focus: ["quads", "lats", "uchest", "sdelt"],
  level: 2, def: 3,
  check: { profile: "maintain", emphasis: [], maxMin: 66 },
  about: [
    "Three full-body days. Each one has a leg lift, a press, a pull and a little for the shoulders or core.",
    "The aim is to hold your strength while you eat less. Holding it is the win.",
  ],
  variants: {
    3: { days: [1, 3, 5], sessions: [
      { name: "Full Body A", tag: "A", focus: "Squat, press, row and curl.", warm: "full", items: [
        { ex: "squat", sets: 3, reps: [6, 10], rest: 180 },
        { ex: "inclineDB", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "cableRow", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 75 },
        { ex: "latRaise", sets: 3, reps: [12, 20], rest: 60 },
        { ex: "bbCurl", sets: 3, reps: [8, 12], rest: 75 },
      ] },
      { name: "Full Body B", tag: "B", focus: "Hip-hinge, shoulder press and pulldown.", warm: "full", items: [
        { ex: "rdl", sets: 3, reps: [8, 12], rest: 150 },
        { ex: "machPress", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "pulldown", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "bulgarian", sets: 3, reps: [8, 12], each: true, rest: 90 },
        { ex: "ohext", sets: 3, reps: [10, 12], rest: 75 },
        { ex: "calf", sets: 3, reps: [12, 20], rest: 60 },
      ] },
      { name: "Full Body C", tag: "C", focus: "Leg press, incline press, rows and abs.", warm: "full", items: [
        { ex: "legpress", sets: 3, reps: [10, 15], rest: 120 },
        { ex: "inclineBB", sets: 3, reps: [6, 10], rest: 150 },
        { ex: "dbRow", sets: 3, reps: [10, 12], each: true, rest: 90 },
        { ex: "hipthrust", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "latRaise", sets: 3, reps: [12, 20], rest: 60 },
        { ex: "hangraise", sets: 3, reps: [10, 15], rest: 60 },
      ] },
    ] },
  },
};

PROGRAMS.strength = {
  name: "Strength",
  line: "A bigger squat, bench press, deadlift and overhead press.",
  who: "For lifters who already move well with a barbell and want to get stronger.",
  focus: ["quads", "chest", "hams", "fdelt"],
  level: 2, def: 3,
  check: { profile: "strength", emphasis: [], optional: ["calves", "sdelt", "abs"], mains: ["squat", "benchBB", "deadlift", "ohp"], maxMin: 80 },
  about: [
    "Three full-body days built on four barbell lifts, done heavy for 3 to 5 reps with long rests.",
    "When every set reaches 5 reps, the bar gets heavier next time.",
  ],
  variants: {
    3: { days: [1, 3, 5], sessions: [
      { name: "Squat & Bench", tag: "A", focus: "Heavy squat and bench press, then back and hamstrings.", warm: "strength", items: [
        { ex: "squat", sets: 4, reps: [3, 5], rest: 210 },
        { ex: "benchBB", sets: 4, reps: [3, 5], rest: 180 },
        { ex: "csRow", sets: 4, reps: [6, 10], rest: 120 },
        { ex: "seatedLegCurl", sets: 3, reps: [8, 12], rest: 75 },
        { ex: "facepull", sets: 3, reps: [12, 15], rest: 60 },
      ] },
      { name: "Deadlift & Press", tag: "B", focus: "Heavy deadlift and overhead press, then pull-ups.", warm: "strength", items: [
        { ex: "deadlift", sets: 3, reps: [3, 5], rest: 240 },
        { ex: "ohp", sets: 4, reps: [3, 5], rest: 180 },
        { ex: "pullup", sets: 4, reps: [5, 8], rest: 150 },
        { ex: "bulgarian", sets: 3, reps: [6, 10], each: true, rest: 90 },
        { ex: "ohext", sets: 3, reps: [8, 12], rest: 75 },
      ] },
      { name: "Squat & Bench 2", tag: "C", focus: "The second squat and bench day, then pulldowns and core.", warm: "strength", items: [
        { ex: "squat", sets: 4, reps: [3, 5], rest: 210 },
        { ex: "benchBB", sets: 4, reps: [3, 5], rest: 180 },
        { ex: "pulldown", sets: 4, reps: [8, 10], rest: 120 },
        { ex: "rdl", sets: 3, reps: [6, 8], rest: 150 },
        { ex: "hangraise", sets: 3, reps: [10, 15], rest: 60 },
      ] },
    ] },
  },
};

PROGRAMS.foundation = {
  name: "Foundation",
  line: "Your first three months: learn the lifts, build the habit.",
  who: "For beginners, and for anyone coming back after a long break.",
  focus: ["quads", "chest", "lats", "glutes"],
  level: 1, def: 3,
  check: { profile: "maintain", emphasis: [], maxMin: 61 },
  about: [
    "Three short full-body days, mostly on machines, dumbbells and your own bodyweight. The two barbell lifts, the Romanian deadlift and the hip thrust, start with the empty bar; the Romanian deadlift can be done with two dumbbells.",
    "Keep two or three reps in hand on every set for the first four weeks. Clean reps come before heavy ones.",
  ],
  variants: {
    3: { days: [1, 3, 5], sessions: [
      { name: "Full Body A", tag: "A", focus: "Squat, press and row, with light weights and clean reps.", warm: "full", items: [
        { ex: "gobletSquat", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "inclineDB", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "cableRow", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "legcurl", sets: 2, reps: [12, 15], rest: 75 },
        { ex: "latRaise", sets: 2, reps: [12, 20], rest: 60 },
        { ex: "plank", sets: 2, hold: [30, 60], rest: 60 },
      ] },
      { name: "Full Body B", tag: "B", focus: "Leg press, pulldown and shoulder press.", warm: "full", items: [
        { ex: "legpress", sets: 3, reps: [10, 15], rest: 120 },
        { ex: "pulldown", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "machPress", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "rdl", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "pushdown", sets: 2, reps: [10, 15], rest: 75 },
        { ex: "dbCurl", sets: 2, reps: [10, 12], each: true, rest: 75 },
      ] },
      { name: "Full Body C", tag: "C", focus: "Squat again, push-ups, rows and hip thrusts.", warm: "full", items: [
        { ex: "gobletSquat", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "pushup", sets: 3, reps: [8, 15], rest: 120 },
        { ex: "csRow", sets: 3, reps: [10, 12], rest: 120 },
        { ex: "hipthrust", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "calf", sets: 3, reps: [12, 20], rest: 60 },
        { ex: "cablecrunch", sets: 2, reps: [12, 15], rest: 60 },
      ] },
    ] },
  },
};
