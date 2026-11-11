/* ===================================================================
   The lookup tables answer only for their own keys.
   Saved data names exercises and programs. A name such as "toString" is
   found on every ordinary object, so without this a hand-edited or damaged
   save could pass for a real exercise and stop the app from opening.
   =================================================================== */
[EX, PROGRAMS, WARM, WARMSETS, FOOD, COND, ZN, MEALFOOD, MEALPLAN].forEach(t=>Object.setPrototypeOf(t,null));
for(const k in PROGRAMS) Object.setPrototypeOf(PROGRAMS[k].variants,null);
