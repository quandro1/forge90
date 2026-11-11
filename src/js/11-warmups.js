/* ===== WARM-UP DRILLS ===== */
const WARM={
 armCircle:{name:`Arm Circles`,reps:`20 fwd / 20 back`,cue:`Big slow circles, warm the shoulders`,pose:{j:J({eL:[28,40],eR:[82,40],hL:[14,40],hR:[96,40]}),arrow:[[96,40],[88,28],10]}},
 bandPull:{name:`Band Pull-Apart`,reps:`2 × 15`,cue:`Pull a band apart at chest height, squeeze shoulder blades`,pose:{j:J({eL:[34,52],eR:[76,52],hL:[24,50],hR:[86,50]}),arrow:[[44,50],[24,50],0]}},
 catcow:{name:`Cat-Cow`,reps:`10 reps`,cue:`On all fours, round then arch the spine slowly`,pose:{j:J({head:[24,70],sC:[36,74],hC:[78,76],sL:[34,72],sR:[38,76],eL:[34,92],eR:[36,92],hL:[32,108],hR:[34,108],hipL:[80,77],hipR:[82,79],kL:[92,96],kR:[94,98],fL:[92,110],fR:[94,110]}),arrow:[[57,66],[57,82],0]}},
 legswing:{name:`Leg Swings`,reps:`12 each leg`,cue:`Hold support, swing one leg front to back`,pose:{j:J({fL:[47,148],kL:[47,119],hipR:[58,90],kR:[78,108],fR:[92,96]}),floor:true,arrow:[[88,98],[42,116],12]}},
 worldsgreat:{name:`World's Greatest Stretch`,reps:`5 each side`,cue:`Deep lunge, reach the top arm up and rotate open`,pose:{j:J({head:[50,28],sC:[52,42],hC:[55,80],sL:[46,42],sR:[60,44],eL:[42,60],eR:[66,28],hL:[40,78],hR:[70,14],hipL:[54,82],hipR:[58,84],kL:[40,118],kR:[80,98],fL:[36,148],fR:[90,108]}),floor:true,arrow:[[70,30],[72,14],6]}},
 glutebridge:{name:`Glute Bridge`,reps:`2 × 12`,cue:`On your back, drive hips up, squeeze glutes`,pose:{j:J({head:[18,118],sC:[30,116],hC:[60,104],sL:[28,114],sR:[32,118],eL:[24,124],eR:[26,124],hL:[18,128],hR:[20,128],hipL:[62,103],hipR:[64,105],kL:[84,108],kR:[86,110],fL:[96,124],fR:[98,126]}),arrow:[[60,118],[60,103],0]}},
 deadhang:{name:`Dead Hang`,reps:`2 × 20s`,cue:`Hang from the bar, decompress and warm the lats/grip`,pose:{j:J({head:[55,40],sC:[55,54],hC:[55,104],sL:[44,55],sR:[66,55],eL:[40,32],eR:[70,32],hL:[40,16],hR:[70,16],hipL:[49,106],hipR:[61,106],kL:[49,132],kR:[61,132],fL:[49,156],fR:[61,156]}),eq:'pullbar'}}
};
const WARMSETS={
 push:{drills:['armCircle','bandPull'],lines:[`5 min easy bike or treadmill to raise the temperature`,`2 light "feeder" sets of your first pressing exercise`]},
 pull:{drills:['bandPull','deadhang','catcow'],lines:[`5 min easy cardio`,`1 light set of your first pulling exercise before you load up`]},
 legs:{drills:['legswing','worldsgreat','glutebridge'],lines:[`5 min easy bike`,`10 slow bodyweight squats to groove the pattern`]}
};
