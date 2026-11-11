/* ===== WARM-UP DRILLS ===== */
const WARM = {
  armCircle: { name: "Arm Circles", reps: "20 fwd / 20 back", cue: "Big slow circles, warm the shoulders" },
  bandPull: { name: "Band Pull-Apart", reps: "2 × 15", cue: "Pull a band apart at chest height, squeeze shoulder blades" },
  catcow: { name: "Cat-Cow", reps: "10 reps", cue: "On all fours, round then arch the spine slowly" },
  legswing: { name: "Leg Swings", reps: "12 each leg", cue: "Hold support, swing one leg front to back" },
  worldsgreat: { name: "World's Greatest Stretch", reps: "5 each side", cue: "Deep lunge, reach the top arm up and rotate open" },
  glutebridge: { name: "Glute Bridge", reps: "2 × 12", cue: "On your back, drive hips up, squeeze glutes" },
  deadhang: { name: "Dead Hang", reps: "2 × 20s", cue: "Hang from the bar, decompress and warm the lats/grip" },
};
const WARMSETS = {
  push: { drills: ["armCircle", "bandPull"], lines: ["5 min easy bike or treadmill to raise the temperature", "2 light \"feeder\" sets of your first pressing exercise"] },
  pull: { drills: ["bandPull", "deadhang", "catcow"], lines: ["5 min easy cardio", "1 light set of your first pulling exercise before you load up"] },
  legs: { drills: ["legswing", "worldsgreat", "glutebridge"], lines: ["5 min easy bike", "10 slow bodyweight squats to groove the pattern"] },
};
