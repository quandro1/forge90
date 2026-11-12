/* ===================================================================
   CORE — DOM helpers, dates, icons
   =================================================================== */
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.prototype.slice.call((r||document).querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
/* digits and decimal marks from any keyboard -> 0-9 and a dot */
const latinNumber=s=>String(s)
  .replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-0x660))
  .replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-0x6F0))
  .replace(/[,٫،]/g,'.');
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));

/* ---- date helpers (local calendar days, no timezone drift) ------- */
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parseISO=s=>{const p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
const isDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&iso(parseISO(s))===s;
const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x;};
const daysBetween=(a,b)=>Math.round((parseISO(iso(b))-parseISO(iso(a)))/86400000);
/* The training day runs from 03:00 to 03:00, so a session that crosses midnight
   stays on the day it began. TODAY is fixed for the life of the page; the page
   reloads when it is shown again on a later day. */
/* a segmented control tells a screen reader which side is chosen, as well as showing it */
function segSync(){ $$('.seg button').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('on')))); }
const BLOCK_DAYS=91;                        // a block is thirteen weeks
const DELOAD_WEEKS=[6,12];                  // the two planned easy weeks of a block
const NEWS=3;                             // the number of the latest "what changed" note on Today (raise it when one is added to NEWS_NOTES)
const DAY_ROLL_H=3;
const dayOf=d=>iso(new Date(d.getTime()-DAY_ROLL_H*3600000));
const TODAY=dayOf(new Date());
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOWL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate=s=>{const d=parseISO(s);return DOW[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()];};

const ICO={
  tick:'<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  up:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  hold:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  dot:'<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="12" cy="12" r="3.5"/></svg>'
};
