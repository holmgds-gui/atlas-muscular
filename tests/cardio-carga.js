/* Meus treinos sem campo de carga (o dono preferiu anotar só no Hoje/Ao vivo) e cardio
   (no seletor de exercício, no treino montado, Registro, Ao vivo, "+ Registrar cardio", Progresso e Conquistas). */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require("playwright");
(async()=>{const b=await chromium.launch();const errs=[],bad=[];
for(const [loc,theme] of [["pt-BR","light"],["es-ES","dark"]]){
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:"America/Sao_Paulo",colorScheme:theme,locale:loc});
  const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});p.on("pageerror",e=>errs.push(loc+" "+e.message));
  const shot=n=>p.screenshot({path:`${OUT}/cardio-${loc}-${n}.png`});
  await p.goto(BASE);await p.waitForTimeout(300);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem("atlas-intro","1");
    const f=FAMBY.supino,sel={...f.d},d=new Date();d.setDate(d.getDate()-7);
    localStorage.setItem("atlas-workouts",JSON.stringify([{id:"old",date:isoDate(d),title:"A",planId:null,done:true,notes:"",items:[{name:vName(f,sel),ref:mkRef(f,sel),target:"8-12",notes:"",sets:[{r:"8",kg:"80"},{r:"8",kg:"80"},{r:"7",kg:"80"}]}]}]));
    localStorage.setItem("atlas-rank",JSON.stringify({bw:80,man:[]}))});
  await p.reload();await p.waitForTimeout(500);
  // 1. Meus treinos: novo treino + supino pelo seletor
  await p.evaluate(()=>{fView="meus";setTab("ficha")});await p.click('[data-act="newPlan"]');await p.fill('[data-pf="name"]',"Teste");
  await p.click('[data-act="add"]');await p.fill("#pq","supino reto barra");await p.waitForTimeout(150);
  await p.click("#plist [data-pf]");await p.click("[data-padd]");await p.waitForTimeout(200);
  if(await p.$('.fi [data-f="kg"]'))bad.push(loc+": campo de carga ainda aparece em Meus treinos");
  // 2. cardio pelo chip
  await p.click('[data-act="add"]');await p.click('[data-pg="cardio"]');await p.waitForTimeout(100);
  const nC=await p.$$eval("#plist [data-pc]",x=>x.length);if(nC!==16)bad.push(loc+": cardios no seletor "+nC);
  await p.click('#plist [data-pc="run"]');await p.waitForTimeout(150);
  await p.fill('.fi [data-f="min"]',"25");await p.selectOption('.fi [data-f="int"]',"f");await p.waitForTimeout(100);
  const kc=await p.evaluate(()=>document.querySelector(".fi-kc").textContent);console.log(loc,"kcal plano",kc);if(!/kcal/.test(kc))bad.push(loc+": kcal no plano");
  // busca acha cardio
  await p.click('[data-act="add"]');await p.fill("#pq","esteira");await p.waitForTimeout(100);
  const found=await p.$$eval("#plist [data-pc]",x=>x.map(e=>e.dataset.pc));if(!found.includes("walk")||!found.includes("run"))bad.push(loc+": busca esteira "+found);
  await p.fill("#pq","mai tai");await p.waitForTimeout(100);if(!(await p.$$eval("#plist [data-pc]",x=>x.map(e=>e.dataset.pc))).includes("muay"))bad.push(loc+": busca mai tai");
  await p.evaluate(()=>closeModals());
  await p.evaluate(()=>document.querySelector(".plan .fi").scrollIntoView({block:"center"}));await p.waitForTimeout(100);await shot("1-meus-treinos");
  const pl=await p.evaluate(()=>plans[0].items.map(i=>({kg:i.kg,min:i.min,int:i.int,ref:i.ref})));console.log(loc,"plano",JSON.stringify(pl));
  if(pl[0].kg||pl[1].min!=="25"||pl[1].int!=="f")bad.push(loc+": plano não salvou");
  // 3. Hoje › Anotar séries: carga já preenchida, cartão de cardio
  await p.evaluate(()=>setTab("treino"));await p.click('[data-act="log"]');await p.waitForTimeout(200);
  const pre=await p.evaluate(()=>{const w=workouts.find(x=>x.id===openW);return {kg:w.items[0].sets.map(s=>s.kg),ct:w.items[1].target,cs:w.items[1].sets}});
  console.log(loc,"registro",JSON.stringify(pre));if(pre.kg.some(k=>k!==""))bad.push(loc+": carga veio preenchida");if(pre.ct!=="25")bad.push(loc+": meta do cardio");
  await p.evaluate(()=>document.querySelector(".cint").scrollIntoView({block:"center"}));await p.waitForTimeout(100);await shot("2-registro");
  await p.click('[data-act="cInt"][data-v="m"]');await p.fill('[data-sf="min"]',"30");await p.waitForTimeout(50);
  await p.click('[data-act="done"]');await p.waitForTimeout(200);
  // 4. Ao vivo com cardio
  await p.evaluate(()=>{openW=null;setTab("treino")});await p.click('[data-hv="live"]');await p.click('[data-lv="start"]');await p.waitForTimeout(200);
  await p.click('[data-lv="pickEx"][data-i="1"]');await p.waitForTimeout(150);
  await p.fill("#lvMin","22");if(await p.$("#lvKm"))await p.fill("#lvKm","4,1");await p.click('[data-lv="cInt"][data-v="f"]');await p.waitForTimeout(100);
  const kept=await p.evaluate(()=>document.getElementById("lvMin").value);if(kept!=="22")bad.push(loc+": minutos sumiram ao trocar intensidade");
  await p.evaluate(()=>{document.getElementById("tab-treino").scrollTop=0});await shot("3-aovivo");
  await p.click('[data-lv="cDone"]');await p.waitForTimeout(100);
  const lv=await p.evaluate(()=>{const w=liveW();return w.items[1].sets[0]});console.log(loc,"ao vivo",JSON.stringify(lv));if(!lv.ok||lv.min!=="22"||lv.int!=="f")bad.push(loc+": ao vivo cardio");
  await p.click('[data-lv="pickEx"][data-i="0"]');await p.click('[data-lv="setDone"]');await p.waitForTimeout(100);
  await p.click('[data-lv="finish"]');await p.waitForTimeout(200);await p.click('[data-lv="sumOk"]');
  // 5. + Registrar cardio
  await p.click('[data-hv="reg"]');await p.click('[data-act="cardio"]');await p.waitForTimeout(150);
  await p.click('[data-g="ck"][data-k="bike"]');await p.fill("#cqMin","40");await p.fill("#cqKm","15");await p.click('[data-g="ci"][data-v="l"]');await p.waitForTimeout(100);
  await shot("4-registrar-cardio");
  await p.click('[data-g="save"]');await p.waitForTimeout(300);
  const cw=await p.evaluate(()=>{const w=workouts[workouts.length-1];return [w.done,w.items[0].ref,w.items[0].sets[0]]});console.log(loc,"avulso",JSON.stringify(cw));
  if(cw[0]!==true||cw[1]!=="cardio:bike")bad.push(loc+": cardio avulso");
  await shot("5-hoje");
  // 6. Progresso
  await p.evaluate(()=>{pView="mus";pMode="week";setTab("prog")});await p.waitForTimeout(400);
  const C=await p.evaluate(()=>{const r=pRange();const c=cardioIn(r.from,r.to);return {...c,days:c.days.size}});console.log(loc,"semana",JSON.stringify(C));
  // 30 min moderado (Registro) + 22 forte (ao vivo) + 40 leve (avulso) = 92 min; OMS = 30 + 44 = 74
  if(C.min!==92||C.who!==74||C.n!==3)bad.push(loc+": soma do cardio "+C.min+"/"+C.who+"/"+C.n);
  await p.evaluate(()=>document.querySelector(".cbox").scrollIntoView({block:"center"}));await p.waitForTimeout(150);await shot("6-progresso");
  const T=await p.evaluate(()=>{const r=pRange();return tally(r).unk.size});if(T)bad.push(loc+": cardio caiu em 'exercício desconhecido'");
  await p.evaluate(()=>setTab("ach"));await p.waitForTimeout(300);
  const A=await p.evaluate(()=>{const S=achStats();return {c1:achOk(ACH.find(a=>a.id==="c1"),S),cN:S.cN,cMin:S.cMin,sets:S.sets}});console.log(loc,"conquistas",JSON.stringify(A));
  if(!A.c1)bad.push(loc+": conquista primeiro cardio");
  await p.evaluate(()=>{const h=[...document.querySelectorAll(".ach-sec")].find(x=>/Cardio/.test(x.textContent));if(h)h.scrollIntoView({block:"start"})});await p.waitForTimeout(150);await shot("7-conquistas");
  await ctx.close();
}
console.log("problemas",bad);console.log("errs",errs.filter(e=>!/TUNNEL/.test(e)));await b.close()})();
