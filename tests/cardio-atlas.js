/* Atlas › 🏃 Cardio: botão embaixo de "Ver lista", lista em ordem de gasto (muda com intensidade e tempo),
   toque pinta os músculos (principais vermelho, ajudantes laranja), + manda para um treino, Limpar e tocar no boneco saem. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require("playwright");
(async()=>{const b=await chromium.launch();const errs=[],bad=[];
for(const [loc,theme,vp] of [["pt-BR","light",{width:390,height:844}],["en-US","dark",{width:390,height:844}],["es-ES","light",{width:1280,height:860}]]){
  const mob=vp.width<500;
  const ctx=await b.newContext({viewport:vp,isMobile:mob,hasTouch:mob,deviceScaleFactor:2,colorScheme:theme,locale:loc});
  const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="2d";localStorage.setItem("atlas-conf",JSON.stringify(c))}}}catch(e){}});p.on("pageerror",e=>errs.push(loc+" "+e.message));
  const shot=n=>p.screenshot({path:`${OUT}/cardio-atlas-${loc}-${n}.png`});
  await p.goto(BASE);await p.evaluate(()=>{localStorage.clear();localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="2d";localStorage.setItem("atlas-conf",JSON.stringify(c))}};localStorage.setItem("atlas-rank",JSON.stringify({bw:80,man:[]}))});await p.reload();await p.waitForTimeout(500);
  if(!await p.isVisible('[data-mode="cd"]'))bad.push(loc+": botão Cardio não aparece");
  await shot("0-inicio");
  await p.click('[data-mode="cd"]');await p.waitForTimeout(300);
  const order=await p.$$eval("[data-cd]",x=>x.map(e=>e.dataset.cd));console.log(loc,"moderado 30 min",order.join(" "));
  if(order.length!==16)bad.push(loc+": lista "+order.length);
  await shot("1-lista");
  await p.click('[data-cdi="l"]');await p.waitForTimeout(100);const o2=await p.$$eval("[data-cd]",x=>x.map(e=>e.dataset.cd));console.log(loc,"leve",o2.join(" "));
  const kc30=await p.$eval('[data-cd] .cd-bar b',e=>e.textContent);await p.click('[data-cdm="60"]');await p.waitForTimeout(100);const kc60=await p.$eval('[data-cd] .cd-bar b',e=>e.textContent);
  console.log(loc,"kcal 30→60",kc30,kc60);if(parseInt(kc60.replace(/\D/g,""))!==2*parseInt(kc30.replace(/\D/g,""))&&Math.abs(parseInt(kc60.replace(/\D/g,""))-2*parseInt(kc30.replace(/\D/g,"")))>1)bad.push(loc+": tempo não dobrou");
  await p.click('[data-cdi="m"]');await p.click('[data-cdm="30"]');await p.waitForTimeout(100);
  await p.click('[data-cd="row"]');await p.waitForTimeout(300);
  const painted=await p.evaluate(()=>({on:[...new Set([...document.querySelectorAll("[data-m].on")].map(e=>e.dataset.m))],syn:[...new Set([...document.querySelectorAll("[data-m].syn")].map(e=>e.dataset.m))]}));
  console.log(loc,"remo pinta",painted.on.length,painted.syn.length);if(!painted.on.includes("dorsal_superior")||!painted.syn.includes("romboides"))bad.push(loc+": remo não pintou");
  if(mob){await p.evaluate(()=>{peek=true;render()});await p.waitForTimeout(400);await shot("2-remo-boneco");await p.click("#pGrab");await p.waitForTimeout(300)}
  await shot("3-remo");
  // + manda para um treino novo
  await p.click('[data-cdadd="run"]');await p.waitForTimeout(150);await p.click('[data-to="new"]');await p.waitForTimeout(200);
  const pl=await p.evaluate(()=>plans[plans.length-1].items[0]);console.log(loc,"plano",JSON.stringify(pl));if(pl.ref!=="cardio:run"||!pl.min)bad.push(loc+": + não criou cardio no treino");
  // volta ao Atlas: tocar num músculo sai do cardio
  await p.evaluate(()=>setTab("atlas"));await p.waitForTimeout(200);
  if(!await p.evaluate(()=>cdOn))bad.push(loc+": cardio fechou ao trocar de aba");
  await p.evaluate(()=>selectMuscle("peito_medial"));await p.waitForTimeout(150);
  if(await p.evaluate(()=>cdOn))bad.push(loc+": músculo não saiu do cardio");
  await p.click('[data-mode="cd"]').catch(()=>{});await p.evaluate(()=>{if(!cdOn)openCardioList()});await p.click("#clear");await p.waitForTimeout(150);
  if(await p.evaluate(()=>cdOn||document.querySelectorAll("[data-m].on,[data-m].syn").length))bad.push(loc+": Limpar não saiu");
  await ctx.close();
}
console.log("problemas",bad);console.log("errs",errs.filter(e=>!/TUNNEL/.test(e)));await b.close()})();
