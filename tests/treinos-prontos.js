/* Treinos prontos: filtro por músculo (Costas), salvar, semana toda e Treinar agora (pt, es, en). */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,theme] of [['pt-BR','light'],['es-ES','dark'],['en-US','light']]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:loc,colorScheme:theme,timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(loc+' '+e.message));
await p.goto(BASE);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(500);
await p.evaluate(()=>setTab('ficha'));await p.waitForTimeout(200);
await p.screenshot({path:`${OUT}/${loc}-0-meus.png`});
await p.tap('[data-fv="prontos"]');await p.waitForTimeout(200);
await p.screenshot({path:`${OUT}/${loc}-1-prontos.png`});
// filter costas
await p.tap('[data-rtm="costas"]');await p.waitForTimeout(200);
const list=await p.evaluate(()=>[...document.querySelectorAll('.rt-sp')].map(s=>s.querySelector('.section-t').textContent+': '+[...s.querySelectorAll('.rt-wh b')].map(x=>x.textContent).join(', ')));
console.log(loc,'b costas',list);
await p.screenshot({path:`${OUT}/${loc}-2-costas.png`});
await p.tap('[data-rtlv="a"]');await p.waitForTimeout(200);
console.log(loc,'a costas',await p.evaluate(()=>[...document.querySelectorAll('.rt-sp')].map(s=>s.querySelector('.section-t').textContent+': '+[...s.querySelectorAll('.rt-wh b')].map(x=>x.textContent).join(', '))));
// open the iso back workout
await p.evaluate(()=>{const b=[...document.querySelectorAll('.rt-wh')].pop();b.click()});await p.waitForTimeout(400);
await p.screenshot({path:`${OUT}/${loc}-3-aberto.png`});
await p.evaluate(()=>document.querySelector('.rt-w.open [data-rt="save"]').click());await p.waitForTimeout(200);
console.log(loc,'saved plans',await p.evaluate(()=>plans.map(x=>x.name+' ('+x.items.length+')')));
// filter all, add week ul advanced
await p.tap('[data-rtm=""]');await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('[data-rt="week"][data-sp="ul"]').click());await p.waitForTimeout(200);
console.log(loc,'after week',await p.evaluate(()=>plans.map(x=>x.name+' '+x.days.join()).join(' | ')));
// train now
await p.evaluate(()=>{document.querySelector('.rt-wh').click()});await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelector('.rt-w.open [data-rt="live"]').click());await p.waitForTimeout(400);
console.log(loc,'live',await p.evaluate(()=>[tab,hView,liveW()&&liveW().title,liveW()&&liveW().items.length]));
await ctx.close()}
console.log('errs',errs);await b.close()})();
