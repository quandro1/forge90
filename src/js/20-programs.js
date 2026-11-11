/* ===================================================================
   PROGRAMS
   A program is a training target. Each has one variant per days-a-week
   it is offered at; a variant lists its sessions in week order, and each
   session lists its items: the exercise and exactly how it is prescribed
   here (sets, reps or hold seconds, rest in seconds).
     def    the days-a-week variant offered first
     days   default training weekdays (0 = Sunday … 6 = Saturday)
     reps   [low, high] | a fixed number | "amrap"     hold: [low, high] seconds
     each   true when the reps are per side
   =================================================================== */
const PROGRAMS = {};
PROGRAMS.vtaper = {
  name: "V-Taper",
  line: "Wider shoulders and back, a tighter waist.",
  who: "For anyone past the first few months of lifting who wants the classic athletic shape.",
  focus: ["sdelt", "lats", "uchest"],
  level: 2,
  def: 5,
  about: [
    "Side delts, lats and upper chest get the most work; legs and core are trained fully so the shape is balanced.",
    "Every muscle is trained twice a week.",
  ],
  variants: {
    5: { days: [1, 2, 3, 4, 5], sessions: [
      { name: "Chest & Shoulders", tag: "Push", focus: "Heavy incline first, then width", warm: "push", items: [
        { ex: "inclineBB", sets: 4, reps: [6, 10], rest: 120 },
        { ex: "pecdeck", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "machPress", sets: 4, reps: [8, 12], rest: 90 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 45 },
        { ex: "pushdown", sets: 3, reps: [10, 15], rest: 60 },
      ] },
      { name: "Back Width & Biceps", tag: "Pull", focus: "Vertical pulling for the taper, arms last", warm: "pull", items: [
        { ex: "pullup", sets: 3, reps: "amrap", rest: 120 },
        { ex: "pulldown", sets: 4, reps: [10, 12], rest: 90 },
        { ex: "cableRow", sets: 4, reps: [10, 12], rest: 90 },
        { ex: "straightArm", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "reardelt", sets: 4, reps: [15, 20], rest: 45 },
        { ex: "bbCurl", sets: 3, reps: [8, 12], rest: 60 },
      ] },
      { name: "Quads & Core", tag: "Legs", focus: "Squat, press, and a braced midsection", warm: "legs", items: [
        { ex: "squat", sets: 4, reps: [6, 10], rest: 150 },
        { ex: "legpress", sets: 4, reps: [10, 15], rest: 90 },
        { ex: "legext", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "calf", sets: 4, reps: [12, 20], rest: 45 },
        { ex: "hangraise", sets: 3, reps: [10, 15], rest: 60 },
        { ex: "cablecrunch", sets: 3, reps: [12, 15], rest: 60 },
      ] },
      { name: "The V-Taper Day", tag: "Delts + Arms", focus: "Second dose of delts and upper chest — this is the shape day", warm: "push", items: [
        { ex: "dbPress", sets: 4, reps: [8, 12], rest: 90 },
        { ex: "inclineDB", sets: 4, reps: [8, 12], rest: 90 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 45 },
        { ex: "cableLat", sets: 3, reps: [12, 15], rest: 45 },
        { ex: "facepull", sets: 3, reps: [15, 20], rest: 45 },
        { ex: "dbCurl", sets: 3, reps: [10, 12], each: true, rest: 60 },
        { ex: "ohext", sets: 3, reps: [10, 12], rest: 60 },
      ] },
      { name: "Glutes, Hams & Thickness", tag: "Posterior", focus: "The hinge day — plus horizontal rowing for back depth", warm: "legs", items: [
        { ex: "hipthrust", sets: 4, reps: [8, 12], rest: 90 },
        { ex: "rdl", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "bulgarian", sets: 3, reps: [8, 12], each: true, rest: 90 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "csRow", sets: 4, reps: [10, 12], rest: 90 },
        { ex: "dbRow", sets: 3, reps: [10, 12], each: true, rest: 60 },
        { ex: "pallof", sets: 3, reps: [10, 12], each: true, rest: 45 },
      ] },
    ] },
    4: { days: [1, 2, 4, 5], sessions: [
      { name: "Push Emphasis", tag: "Upper A", focus: "Incline press, shoulders, a row to keep it balanced", warm: "push", items: [
        { ex: "inclineBB", sets: 4, reps: [6, 10], rest: 120 },
        { ex: "machPress", sets: 4, reps: [8, 12], rest: 90 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 45 },
        { ex: "cableRow", sets: 4, reps: [10, 12], rest: 90 },
        { ex: "facepull", sets: 3, reps: [15, 20], rest: 45 },
        { ex: "bbCurl", sets: 3, reps: [8, 12], rest: 60 },
      ] },
      { name: "Quads & Core", tag: "Lower A", focus: "Squat-led, core to finish", warm: "legs", items: [
        { ex: "squat", sets: 4, reps: [6, 10], rest: 150 },
        { ex: "legpress", sets: 4, reps: [10, 15], rest: 90 },
        { ex: "legext", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "legcurl", sets: 3, reps: [12, 15], rest: 60 },
        { ex: "calf", sets: 4, reps: [12, 20], rest: 45 },
        { ex: "hangraise", sets: 3, reps: [10, 15], rest: 60 },
      ] },
      { name: "Pull Emphasis", tag: "Upper B", focus: "Back width and thickness, upper chest, delts", warm: "pull", items: [
        { ex: "pulldown", sets: 4, reps: [10, 12], rest: 90 },
        { ex: "csRow", sets: 4, reps: [10, 12], rest: 90 },
        { ex: "inclineDB", sets: 4, reps: [8, 12], rest: 90 },
        { ex: "dbPress", sets: 4, reps: [8, 12], rest: 90 },
        { ex: "latRaise", sets: 4, reps: [12, 20], rest: 45 },
        { ex: "reardelt", sets: 4, reps: [15, 20], rest: 45 },
        { ex: "pushdown", sets: 3, reps: [10, 15], rest: 60 },
      ] },
      { name: "Glutes & Hamstrings", tag: "Lower B", focus: "The hinge day, plus anti-rotation core", warm: "legs", items: [
        { ex: "hipthrust", sets: 4, reps: [8, 12], rest: 90 },
        { ex: "rdl", sets: 3, reps: [8, 12], rest: 120 },
        { ex: "bulgarian", sets: 3, reps: [8, 12], each: true, rest: 90 },
        { ex: "calf", sets: 4, reps: [12, 20], rest: 45 },
        { ex: "pallof", sets: 3, reps: [10, 12], each: true, rest: 45 },
        { ex: "cablecrunch", sets: 3, reps: [12, 15], rest: 60 },
      ] },
    ] },
  },
};
