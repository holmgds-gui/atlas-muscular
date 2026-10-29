/* "Como fazer" no Atlas: abre, mostra a dica da variação e continua aberto ao trocar (pt, es, en) + aviso sem internet. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');const out=OUT;
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,theme] of [['pt-BR','light'],['es-ES','dark'],['en-US','light']]){
 const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:theme,locale:loc,timezoneId:'America/Sao_Paulo'});
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(loc+' '+e.message));
 await p.goto(BASE);await p.waitForTimeout(500);
 await p.evaluate(()=>{localStorage.clear()});await p.reload();await p.waitForTimeout(500);
 await p.evaluate(()=>{setTab('atlas');setModel('det');selectMuscle('peito_medial')});await p.waitForTimeout(200);
 // open the bench press card
 const idx=await p.evaluate(()=>{const els=[...document.querySelectorAll('.ex')];const e=els.find(x=>x.querySelector('[data-ref^="supino|"]'));return e?+e.dataset.i:-1});
 await p.evaluate(i=>selectExercise(i),idx);await p.waitForTimeout(200);
 await p.click(`.ex[data-i="${idx}"] [data-ax="b"][data-o="in"]`);await p.waitForTimeout(200);
 await p.click(`.ex[data-i="${idx}"] details.how summary`);await p.waitForTimeout(400);
 const info=await p.evaluate(()=>{const d=document.querySelector('.ex.sel details.how');return {open:d.open,len:d.innerText.length,v:(d.querySelector('.how-v')||{}).innerText}});
 console.log(loc,JSON.stringify(info).slice(0,300));
 await p.evaluate(()=>document.querySelector('.ex.sel details.how').scrollIntoView({block:'start'}));await p.waitForTimeout(150);
 await p.screenshot({path:`${out}/${loc}-atlas1.png`});
 await p.evaluate(()=>{const d=document.querySelector('.ex.sel details.how');d.querySelector('.how-v').scrollIntoView({block:'start'})});await p.waitForTimeout(150);
 await p.screenshot({path:`${out}/${loc}-atlas2.png`});
 // change variation: guide must stay open and the tip must change
 await p.click(`.ex[data-i="${idx}"] [data-ax="e"][data-o="ha"]`);await p.waitForTimeout(300);
 console.log(loc,'after change',await p.evaluate(()=>{const d=document.querySelector('.ex.sel details.how');return d&&[d.open,(d.querySelector('.how-v')||{}).innerText]}));
 await ctx.close()}
// offline fallback
const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();await p.route('**/how/*.json',r=>r.abort());
await p.goto(BASE);await p.waitForTimeout(500);
await p.evaluate(()=>{setTab('atlas');setModel('det');selectMuscle('biceps_longa');selectExercise(0)});await p.waitForTimeout(800);
console.log('offline',await p.evaluate(()=>document.querySelector('.ex.sel details.how .how-b').innerText));
console.log('errs',errs);await b.close()})();
