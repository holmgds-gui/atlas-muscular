/* Crossover (Crucifixo na polia): nome "Crossover · polia alta/média/baixa" e busca por crossover / cross over / polia alta (pt, en, es). */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const {chromium}=require('playwright');
const ESP={'pt-BR':[['crossover','Crossover · polia média'],['cross over','Crossover · polia média'],['crossover polia alta','Crossover · polia alta'],['crossover baixa','Crossover · polia baixa'],['crucifixo polia','Crossover · polia média'],['voador','Crucifixo reto · máquina (voador)']],
 'en-US':[['cable crossover low','Cable crossover · low pulley'],['high pulley crossover','Cable crossover · high pulley']],
 'es-ES':[['cruce de poleas alta','Cruce de poleas · polea alta'],['crossover','Cruce de poleas · polea media']]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,L] of Object.entries(ESP)){const p=await (await b.newContext({viewport:{width:390,height:844},locale:loc})).newPage();p.on('pageerror',e=>errs.push(loc+' '+e.message));
await p.addInitScript(()=>{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-conf",JSON.stringify({fig:"2d"}))});
await p.goto(BASE);await p.waitForTimeout(600);
for(const [q,want] of L){const got=await p.evaluate(q=>{const r=famSearch(q)[0];return r?vName(r.f,r.sel):""},q);console.log(got===want?' ok ':'FALHA',loc,q,'→',got);if(got!==want)errs.push(loc+' '+q+' → '+got)}}
console.log('errs',errs);await b.close();process.exit(errs.length?1:0)})();
