/* Meus treinos: segurar a alça ≡ de um exercício e arrastar muda a ordem (pedido do dono, no lugar de ↑ ↓).
   Celular, claro e escuro; usa o ponteiro (mouse) porque o Playwright não arrasta com toque. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(600);
await p.evaluate(()=>{const names=["Supino reto","Remada curvada","Agachamento","Rosca direta"];
  plans=[{id:"t1",name:"Teste",days:[],items:names.map(n=>({name:n,sets:3,reps:"8-12"}))}];savePlans();openPlan="t1";fView="meus";setTab("ficha")});
await p.waitForTimeout(400);
await p.evaluate(()=>{const sc=document.getElementById('tab-ficha'),f=document.querySelector('.fi');sc.scrollTop+=f.getBoundingClientRect().top-180});await p.waitForTimeout(200);
const order=()=>p.evaluate(()=>plans[0].items.map(i=>i.name));
const hs=await p.$$('.fi-drag');if(hs.length!==4){console.log('alças',hs.length);bad++}
if(await p.$('.fi [data-act="up"]')){console.log('ainda tem ↑');bad++}
// drag the 1st below the 3rd
const a=await hs[0].boundingBox(),F=await p.$$('.fi'),r0=await F[0].boundingBox(),c=await F[2].boundingBox();
// the row's middle goes a little past the 3rd row's middle
await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();
await p.mouse.move(a.x+a.width/2,a.y+a.height/2+(c.y+c.height/2-(r0.y+r0.height/2))+8,{steps:12});await p.waitForTimeout(250);
await p.screenshot({path:`${OUT}/reordenar-${th}-arrastando.png`});
await p.mouse.up();await p.waitForTimeout(300);
let o=await order();console.log(th,o.join(' | '));if(o[2]!=="Supino reto"||o[0]!=="Remada curvada")bad++;
// drag the last to the top
const h2=await p.$$('.fi-drag'),d=await h2[3].boundingBox(),t=await (await p.$$('.fi'))[0].boundingBox();
await p.mouse.move(d.x+d.width/2,d.y+d.height/2);await p.mouse.down();await p.mouse.move(d.x+d.width/2,t.y+5,{steps:12});await p.mouse.up();await p.waitForTimeout(300);
o=await order();console.log(' ',o.join(' | '));if(o.join()!=="Rosca direta,Remada curvada,Agachamento,Supino reto")bad++;
// a tiny move does nothing
const h3=await p.$$('.fi-drag'),e3=await h3[1].boundingBox();await p.mouse.move(e3.x+5,e3.y+5);await p.mouse.down();await p.mouse.move(e3.x+5,e3.y+12,{steps:3});await p.mouse.up();await p.waitForTimeout(200);
const o2=await order();if(o2.join()!==o.join())bad++;
// saved
const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem("atlas-plans"))[0].items.map(i=>i.name));if(saved.join()!==o.join())bad++;
await p.screenshot({path:`${OUT}/reordenar-${th}-depois.png`});
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
