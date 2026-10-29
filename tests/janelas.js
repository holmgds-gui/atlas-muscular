/* Montar treino (boneco), Trocar exercício, Treinos prontos e Cartão para Stories: tudo que usa a janela #gSheet. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,theme] of [['pt-BR','light'],['es-ES','dark']]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:loc,colorScheme:theme,timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(loc+' '+e.message));
await p.goto(BASE);await p.evaluate(()=>{localStorage.clear()});await p.reload();await p.waitForTimeout(600);
// 1 build -> train now
await p.tap('#buildBtn');await p.waitForTimeout(200);
for(const m of ['ombro_lateral','biceps_longa']){const box=await p.evaluate(m=>{const e=[...document.querySelectorAll(`[data-m="${m}"] path.m`)].find(x=>x.getBoundingClientRect().width>0);const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}},m);await p.touchscreen.tap(box.x,box.y);await p.waitForTimeout(250)}
await p.tap('[data-bb="go"]');await p.waitForTimeout(400);await p.screenshot({path:`${OUT}/${loc}-montar.png`});
await p.tap('#gSheet [data-g="live"]');await p.waitForTimeout(400);
console.log(loc,'1 build→live',await p.evaluate(()=>[tab,hView,!!live,liveW()&&liveW().items.length]));
// 2 swap in live
await p.tap('[data-lv="swap"]').catch(()=>{});await p.waitForTimeout(300);
const sw=await p.evaluate(()=>{const s=document.getElementById('gSheet');return !s.hidden&&s.querySelectorAll('[data-g]').length});
console.log(loc,'2 swap options',sw);
if(sw){const before=await p.evaluate(()=>liveW().items[live.i].name);await p.tap('#gSheet [data-g]');await p.waitForTimeout(300);console.log(loc,'  swapped',before,'→',await p.evaluate(()=>liveW().items[live.i].name))}
await p.evaluate(()=>closeModals());
// 3 programs
await p.evaluate(()=>setTab('ficha'));await p.waitForTimeout(200);
await p.evaluate(()=>openPrograms());await p.waitForTimeout(200);
const n0=await p.evaluate(()=>plans.length);await p.evaluate(()=>document.querySelector('[data-rt="week"]').click());await p.waitForTimeout(300);
console.log(loc,'3 treinos prontos: semana toda, plans',n0,'→',await p.evaluate(()=>plans.length));
// 4 story card
await p.evaluate(()=>{setTab('prog');pView='ach';renderProg()});await p.waitForTimeout(300);
await p.tap('[data-share="ach"]');await p.waitForTimeout(2500);
console.log(loc,'4 card sheet',await p.evaluate(()=>{const s=document.getElementById('gSheet');return !s.hidden&&!!s.querySelector('img.card-prev')}));
await ctx.close()}
console.log('errs',errs);await b.close()})();
