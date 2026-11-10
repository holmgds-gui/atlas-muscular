/* Atlas › Grupos (owner): 6 big groups, each in its own colour; tapping a group opens its muscles; tapping a muscle
   only highlights it (no exercise list). Phone, light and dark, pt/en/es. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const [loc,th] of [['pt-BR','dark'],['pt-BR','light'],['en-US','light'],['es-ES','dark']]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:loc,colorScheme:th});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});p.on('pageerror',e=>errs.push(loc+' '+e.message));
await p.goto(BASE);await p.waitForTimeout(500);
await p.tap('[data-mode="grp"]');await p.waitForTimeout(250);
const a=await p.evaluate(()=>{const f=document.getElementById('fig');const ms=[...f.querySelectorAll('[data-m]')];
  return {grp:f.classList.contains('grp'),nogp:ms.filter(e=>!e.dataset.gp).map(e=>e.dataset.m),cols:new Set(ms.map(e=>getComputedStyle(e.querySelector('.m')).fill)).size,
    rows:document.querySelectorAll('.gl-h').length,covered:document.getElementById('tab-atlas').classList.contains('covered'),btn:document.querySelector('[data-mode="grp"]').textContent}});
console.log(loc,th,JSON.stringify(a));if(!a.grp||a.nogp.length||a.rows!==6||a.cols<6||a.covered)bad++;
await p.screenshot({path:`${OUT}/grupos-${loc}-${th}-0.png`});
await p.tap('[data-gk="bracos"]');await p.waitForTimeout(250);
const names=await p.evaluate(()=>[...document.querySelectorAll('[data-gm]')].map(b=>b.textContent));console.log(' braços:',names.join(' | '));if(names.length!==9)bad++;
await p.tap('[data-gm="biceps_curta"]');await p.waitForTimeout(250);
const c=await p.evaluate(()=>({hi:[...document.querySelectorAll('#fig .ghi')].map(e=>e.dataset.m),exList:!!document.querySelector('#body .ex'),title:document.getElementById('title').textContent}));
console.log(' destaque:',JSON.stringify(c));if(c.exList||!c.hi.every(m=>m==='biceps_curta')||!c.hi.length)bad++;
await p.screenshot({path:`${OUT}/grupos-${loc}-${th}-1.png`});
// tap on the figure highlights too; Limpar leaves the mode
await p.evaluate(()=>{const e=document.querySelector('#fig [data-m="peito_medial"] .m');onFigTap(e.closest('[data-m]'))});await p.waitForTimeout(200);
const d=await p.evaluate(()=>({open:document.querySelector('.gl-h[aria-expanded="true"]')?.dataset.gk,hi:[...document.querySelectorAll('#fig .ghi')].map(e=>e.dataset.m)}));
console.log(' toque no boneco:',JSON.stringify(d));if(d.open!=='peito')bad++;
await p.tap('#clear');await p.waitForTimeout(200);
const e=await p.evaluate(()=>({grp:document.getElementById('fig').classList.contains('grp'),pressed:document.querySelector('[data-mode="grp"]').getAttribute('aria-pressed')}));if(e.grp||e.pressed!=='false')bad++;
// a normal muscle tap still works after leaving
await p.evaluate(()=>selectMuscle('biceps_longa'));await p.waitForTimeout(200);
if(!(await p.evaluate(()=>!!document.querySelector('#body .ex'))))bad++;
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
