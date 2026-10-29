/* "Como fazer" no Ao vivo e mensagem sem conexão. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');const out=OUT;
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(300);
await p.evaluate(()=>{localStorage.clear();const R=(id,sel={})=>{const f=FAMBY[id];const s={...f.d,...sel};return [vName(f,s),mkRef(f,s)]};
 localStorage.setItem('atlas-plans',JSON.stringify([{id:'p1',name:'Pernas',days:[0,1,2,3,4,5,6],items:[{name:R('agach',{e:'bf'})[0],ref:R('agach',{e:'bf'})[1],sets:3,reps:'6-10'},{name:R('pant',{p:'se'})[0],ref:R('pant',{p:'se'})[1],sets:3,reps:'10-15'}]}]))});
await p.reload();await p.waitForTimeout(400);
await p.evaluate(()=>setTab('treino'));await p.click('[data-hv="live"]');await p.waitForTimeout(200);await p.click('[data-lv="start"]');await p.waitForTimeout(300);
await p.click('.lv-ex details.how summary');await p.waitForTimeout(400);
console.log('live',await p.evaluate(()=>{const d=document.querySelector('.lv-ex details.how');return [d.open,(d.querySelector('.how-v')||{}).textContent]}));
await p.click('[data-lv="setDone"]');await p.waitForTimeout(400);
console.log('live after set (stays open)',await p.evaluate(()=>document.querySelector('.lv-ex details.how').open));
await p.evaluate(()=>document.querySelector('.lv-ex details.how .how-v').scrollIntoView({block:'center'}));await p.waitForTimeout(100);
await p.screenshot({path:`${out}/live.png`});
// Registro
await p.click('[data-hv="reg"]');await p.waitForTimeout(200);
console.log('registro how count',await p.evaluate(()=>document.querySelectorAll('#tab-treino details.how').length));
await ctx.close();
const c2=await b.newContext({viewport:{width:390,height:844}});const q=await c2.newPage();await q.route('**/how/*.json',r=>r.abort());
await q.goto(BASE);await q.waitForTimeout(400);
await q.evaluate(()=>{setTab('atlas');setModel('det');selectMuscle('biceps_longa');selectExercise(0)});await q.waitForTimeout(800);
console.log('offline:',await q.evaluate(()=>document.querySelector('.ex.sel details.how .how-b').textContent));
console.log('errs',errs);await b.close()})();
