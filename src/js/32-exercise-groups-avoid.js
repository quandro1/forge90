const EXGROUP={
 Chest:['inclineDB','inclineBB','pecdeck'],
 Back:['pulldown','pullup','cableRow','csRow','dbRow','straightArm'],
 Shoulders:['machPress','dbPress','latRaise','cableLat','reardelt','facepull'],
 Arms:['pushdown','ohext','bbCurl','dbCurl'],
 Legs:['squat','rdl','hipthrust','legpress','lunge','bulgarian','legcurl','legext','calf'],
 Core:['hangraise','cablecrunch','pallof','plank']
};

/* ---- "AVOID" NOTES ----------------------------------------------
   Ported from the 90-day guidebook so every movement carries a common-error
   warning, not just the ten that have a good/bad diagram in the figure engine. */
const AVOID={
 inclineBB:`Bench too steep — that turns it into a shoulder press — or flaring the elbows to 90°, which stresses the shoulder joint.`,
 pecdeck:`Going so wide at the back that you feel it in the front of the shoulder instead of the chest. Stop the stretch where the chest still owns it.`,
 machPress:`Starting the handles too low and bouncing out of the bottom.`,
 dbPress:`Over-arching the lower back to heave the weight up. Brace the abs and keep the ribs down.`,
 cableLat:`Swinging for momentum or shrugging the traps. Slow, torso still, elbow leads.`,
 pushdown:`Letting the elbows drift forward, which turns it into a chest and shoulder push.`,
 ohext:`Flaring the elbows wide or letting the upper arms drop. Keep them fixed and high.`,
 pullup:`Half reps and kipping. Full range under control beats sloppy volume — use a band or the assist machine if you need it.`,
 csRow:`Yanking with the lower back or shrugging upward. The chest pad is there so you row instead of heave.`,
 straightArm:`Bending the elbows, which makes it a triceps movement. Arms stay long, slight hinge at the hip.`,
 reardelt:`Too much weight, so the mid-traps and momentum take over. Light and controlled.`,
 bbCurl:`Swinging the torso for momentum. Upper arms still, strict movement.`,
 dbCurl:`Letting the elbows drift forward to cheat the stretch. Keep them back behind the torso.`,
 legpress:`Letting the lower back round off the pad at the bottom by going too deep, or snapping the knees straight at the top.`,
 lunge:`Short, choppy steps that put all of it on the knee. Step out far enough that the hip does the work.`,
 bulgarian:`Stance too short, so the knee shoots past the toes — or wobbling. Find your foot position and stay stable.`,
 legcurl:`Jerking the weight up and letting the hips pop off the bench.`,
 legext:`Swinging up with momentum and dropping the weight fast on the way down.`,
 calf:`Bouncing through tiny partial reps. Slow down — full stretch at the bottom, full squeeze at the top.`,
 cablecrunch:`Hinging at the hips and just bowing, instead of flexing the spine. Round the upper back down.`,
 pallof:`Letting the torso twist toward the machine. The entire point is to not rotate.`,
 hipthrust:`Arching the lower back to fake a higher lockout, or pushing through the toes. Ribs stay down, heels stay planted.`
};
