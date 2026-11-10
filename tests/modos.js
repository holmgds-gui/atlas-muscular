/* Atlas › seletor de modos (pedido do dono): uma faixa que se arrasta para o lado, na ordem Músculos → Grupos →
   Articulações → Cardio; setas ‹ › e pontinhos; o item do meio vira o modo. Celular, claro e escuro. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR'});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="2d";localStorage.setItem("atlas-conf",JSON.stringify(c))}}}catch(e){}});p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(600);
const st=()=>p.evaluate(()=>({mode:curMode(),mid:(()=>{const t=document.getElementById('msTrack'),c=t.getBoundingClientRect(),x=c.left+c.width/2;return [...t.querySelectorAll('[data-mode]')].find(b=>{const r=b.getBoundingClientRect();return r.left<=x&&r.right>=x})?.dataset.mode})(),
  dot:[...document.querySelectorAll('#modeSw .ms-dots i')].findIndex(d=>d.classList.contains('on')),order:[...document.querySelectorAll('#msTrack [data-mode]')].map(b=>b.dataset.mode).join(',')}));
let s=await st();console.log(th,'início',JSON.stringify(s));if(s.mode!=='mus'||s.mid!=='mus'||s.order!=='mus,grp,art,cd')bad++;
await p.screenshot({path:`${OUT}/modos-${th}-0.png`,clip:{x:0,y:60,width:390,height:150}});
// swipe: scroll the strip one item to the right, as a finger would
for(const want of ['grp','art']){await p.evaluate(()=>{const t=document.getElementById('msTrack'),b=t.querySelector('[aria-pressed="true"]');t.scrollBy({left:b.offsetWidth,behavior:'auto'})});await p.waitForTimeout(700);
  s=await st();console.log(' arrastou →',JSON.stringify(s));if(s.mode!==want||s.mid!==want)bad++}
await p.screenshot({path:`${OUT}/modos-${th}-art.png`,clip:{x:0,y:60,width:390,height:150}});
await p.tap('#modeSw [data-step="-1"]');await p.waitForTimeout(700);s=await st();console.log(' seta ‹',JSON.stringify(s));if(s.mode!=='grp'||s.mid!=='grp')bad++;
await p.tap('#modeSw [data-step="1"]');await p.waitForTimeout(700);s=await st();console.log(' seta ›',JSON.stringify(s));if(s.mode!=='art'||s.mid!=='art')bad++;
// last one: Cardio opens its list (on the phone the figure goes to the corner and the strip hides, as before); ✕ goes back
await p.evaluate(()=>{const t=document.getElementById('msTrack'),b=t.querySelector('[aria-pressed="true"]');t.scrollBy({left:b.offsetWidth,behavior:'auto'})});await p.waitForTimeout(700);
s=await st();console.log(' arrastou → cardio',s.mode);if(s.mode!=='cd')bad++;
await p.tap('#clear');await p.waitForTimeout(800);s=await st();console.log(' ✕',JSON.stringify(s));if(s.mode!=='mus'||s.mid!=='mus')bad++;
// changed elsewhere (tap on the figure) → strip follows
await p.evaluate(()=>{setMode('grp')});await p.waitForTimeout(700);await p.evaluate(()=>selectMuscle('biceps_longa'));await p.waitForTimeout(300);await p.tap('#clear');await p.waitForTimeout(800);
s=await st();console.log(' depois de um músculo',JSON.stringify(s));if(s.mode!=='mus'||s.mid!=='mus')bad++;
// ring (owner: "ciclo infinito"): ‹ on Músculos goes to Cardio; pulling the strip past its start does too
await p.tap('#modeSw [data-step="-1"]');await p.waitForTimeout(700);s=await st();console.log(' ‹ no começo',s.mode);if(s.mode!=='cd')bad++;
await p.tap('#clear');await p.waitForTimeout(800);
await p.evaluate(()=>{const t=document.getElementById('msTrack'),r=t.getBoundingClientRect(),y=r.top+r.height/2,T=x=>new Touch({identifier:1,target:t,clientX:x,clientY:y});t.scrollLeft=0;
  t.dispatchEvent(new TouchEvent('touchstart',{touches:[T(150)],changedTouches:[T(150)],bubbles:true}));t.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[T(260)],bubbles:true}))});
await p.waitForTimeout(700);s=await st();console.log(' puxou para trás no começo',s.mode);if(s.mode!=='cd')bad++;
await p.tap('#clear');await p.waitForTimeout(800);
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
