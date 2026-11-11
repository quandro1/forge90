/* ===== WARM-UP =====
   One rule for every session: five easy minutes, the drills for that day,
   then two lighter sets of the first lift (worked out from your log).
   Each drill carries a one-line instruction, shown under its name, so it
   can be followed with no signal. */
const WARM = {
  armCircle:   { name: "Arm Circles", reps: "20 forward, 20 back", cue: "Arms straight out to the sides. Draw big, slow circles from the shoulder." },
  bandPull:    { name: "Band Pull-Apart", reps: "2 × 15", cue: "Hold a light band at chest height with straight arms and pull your hands apart until it touches your chest. No band: do 15 slow reverse flies with empty hands." },
  catcow:      { name: "Cat-Cow", reps: "10 slow reps", cue: "On hands and knees. Round your back up toward the ceiling, then let it sink and lift your chest." },
  legswing:    { name: "Leg Swings", reps: "12 each leg", cue: "Hold a support. Swing one straight leg forward and back, a little higher each time." },
  worldsgreat: { name: "Lunge with a Reach", reps: "5 each side", cue: "Step into a deep lunge, put both hands on the floor inside the front foot, then reach the inside arm up to the ceiling and look at it." },
  glutebridge: { name: "Glute Bridge", reps: "2 × 12", cue: "Lie on your back with knees bent and feet flat. Lift your hips until your body is straight from shoulders to knees; squeeze for 1 second." },
  deadhang:    { name: "Dead Hang", reps: "2 × 20 s", cue: "Hang from a pull-up bar with straight arms and relaxed shoulders." },
  bwsquat:     { name: "Bodyweight Squat", reps: "10 slow reps", cue: "Feet shoulder-width apart. Sit down between your heels as low as is comfortable and stand up." },
};
const WARMSETS = {
  push:  { drills: ["armCircle", "bandPull"] },
  pull:  { drills: ["bandPull", "deadhang", "catcow"] },
  legs:  { drills: ["legswing", "worldsgreat", "bwsquat"] },
  hinge: { drills: ["legswing", "catcow", "glutebridge"] },
  full:  { drills: ["armCircle", "legswing", "bwsquat"] },
};
