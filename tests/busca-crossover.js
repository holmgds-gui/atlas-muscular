/* Crossover (em pé entre as polias) é um exercício próprio, separado do Crucifixo (deitado/sentado) desde a 0.63.
   Confere nomes e busca em pt/en/es e a mudança dos treinos antigos salvos como "Crucifixo › polia". */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const {chromium}=require('playwright');
const ESP={'pt-BR':[['crossover','Crossover · polia alta'],['cross over','Crossover · polia alta'],['crossover polia baixa','Crossover · polia baixa'],['crossover media','Crossover · polia média'],
   ['crucifixo','Crucifixo reto · máquina (voador)'],['voador','Crucifixo reto · máquina (voador)'],['crucifixo halteres','Crucifixo reto · halteres']],
 'en-US':[['cable crossover low','Cable crossover · low cable'],['high cable crossover','Cable crossover · high cable']],
 'es-ES':[['cruce de poleas alta','Cruce de poleas · polea alta'],['crossover','Cruce de poleas · polea alta']]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,L] of Object.entries(ESP)){const p=await (await b.newContext({viewport:{width:390,height:844},locale:loc})).newPage();p.on('pageerror',e=>errs.push(loc+' '+e.message));
await p.addInitScript(()=>{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-conf",JSON.stringify({fig:"2d"}))});
await p.goto(BASE);await p.waitForTimeout(600);
for(const [q,want] of L){const got=await p.evaluate(q=>{const r=famSearch(q)[0];return r?vName(r.f,r.sel):""},q);console.log(got===want?' ok ':'FALHA',loc,q,'→',got);if(got!==want)errs.push(loc+' '+q+' → '+got)}
if(loc==='pt-BR'){
  // treinos antigos: Crucifixo › polia vira Crossover (declinado = alta, reto = média, inclinado = baixa); halteres não muda
  await p.evaluate(()=>{localStorage.setItem("atlas-workouts",JSON.stringify([{id:"w1",date:"2026-11-20",title:"A",done:true,items:[
    {name:"x",ref:"crucifixo|b=de,e=po,l=bi",sets:[{r:"10",kg:"15"}]},{name:"y",ref:"crucifixo|b=in,e=po,l=un",sets:[{r:"10",kg:""}]},{name:"z",ref:"crucifixo|b=re,e=ha,l=bi",sets:[{r:"10",kg:""}]}]}]));
    localStorage.setItem("atlas-plans",JSON.stringify([{id:"p1",name:"P",days:[],items:[{name:"x",ref:"crucifixo|b=re,e=po,l=bi",sets:3,reps:"10"}]}]))});
  await p.reload();await p.waitForTimeout(600);
  const r=await p.evaluate(()=>[...workouts[0].items.map(i=>i.ref+' = '+dName(i.name,i.ref)),plans[0].items[0].ref]);console.log(r);
  const want=['crossover|h=al,e=po,l=bi = Crossover · polia alta','crossover|h=ba,e=po,l=un = Crossover · polia baixa · um braço','crucifixo|b=re,e=ha,l=bi = Crucifixo reto · halteres','crossover|h=me,e=po,l=bi'];
  if(JSON.stringify(r)!==JSON.stringify(want))errs.push('migração '+JSON.stringify(r));
  const how=await p.evaluate(async()=>{const r=await fetch('how/pt.json');const d=await r.json();return !!(d.crossover&&d.crossover.v['h.al'])});if(!how)errs.push('como fazer do crossover');
  const lists=await p.evaluate(()=>['peito_superior','peito_medial','peito_inferior'].map(m=>m+': '+M[m].x.filter(e=>e.f.id==='crossover').map(e=>e[0]).join(', ')));console.log(lists);
}}
console.log('errs',errs);await b.close();process.exit(errs.length?1:0)})();
