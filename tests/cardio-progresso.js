/* Progresso com cardio: músculos do cardio ficam clarinhos no boneco (1 série a cada 30 min, até 2; ajudantes metade),
   anel da meta da OMS e barras de minutos por dia (leve/moderado/forte). As conquistas não contam cardio como séries. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require("playwright");
(async()=>{const b=await chromium.launch();const errs=[],bad=[];
for(const [loc,theme] of [["pt-BR","light"],["es-ES","dark"]]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:"America/Sao_Paulo",locale:loc,colorScheme:theme});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});p.on("pageerror",e=>errs.push(e.message));
await p.clock.setFixedTime(new Date("2026-11-07T10:00:00-03:00"));
await p.goto(BASE);await p.waitForTimeout(300);
await p.evaluate(()=>{localStorage.clear();localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-rank",JSON.stringify({bw:80,man:[]}));
  const car=(d,k,min,int)=>({id:"c"+d+k,date:d,title:"Cardio",done:true,notes:"",items:[{name:k,ref:"cardio:"+k,target:"",notes:"",sets:[{min:String(min),km:"",int,ok:true}]}]});
  localStorage.setItem("atlas-workouts",JSON.stringify([car("2026-11-02","run",30,"m"),car("2026-11-04","bike",90,"f"),car("2026-11-05","walk",40,"l"),car("2026-11-06","box",20,"m")]))});
await p.reload();await p.waitForTimeout(400);
const T=await p.evaluate(()=>{const r={from:"2026-11-02",to:"2026-11-08"},a=tally(r,true),z=tally(r);return {quad:a.mus.quad_vasto_lateral,ham:a.mus.isquio_biceps_femoral,cs:a.cs,sets:a.sets,zero:Object.keys(z.mus).length}});
console.log(loc,JSON.stringify(T));
// corrida 30 = 1 (quad principal), bike 90 = 2 (cap), caminhada 40 = 1,33 (quad ajudante → 0,67), boxe 20 = 0,67 (quad ajudante → 0,33) → quad = 1+2+0,67+0,33 = 4
if(Math.abs(T.quad-4)>.01)bad.push(loc+" quadríceps "+T.quad);if(T.zero)bad.push(loc+": tally sem cardio pintou músculos");if(T.sets)bad.push(loc+": cardio contou como série");
await p.evaluate(()=>{pView="mus";pMode="week";setTab("prog")});await p.waitForTimeout(500);
if(!await p.$(".pfig [data-m]"))bad.push(loc+": boneco não apareceu");
const ring=await p.$eval(".c-ring",e=>e.getAttribute("aria-label")).catch(()=>null);console.log(loc,"anel",ring);if(!ring)bad.push(loc+": sem anel");
const nb=await p.$$eval(".c-bars rect",x=>x.length);if(nb<7)bad.push(loc+": barras "+nb);
await p.screenshot({path:`${OUT}/cardio-prog-${loc}-1.png`});
await p.evaluate(()=>document.querySelector(".cbox").scrollIntoView({block:"center"}));await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/cardio-prog-${loc}-2.png`});
// visão Dia: anel do dia (meta 30 min) — quarta tem bike 90 min forte = 180 equivalentes
await p.evaluate(()=>{pMode="day";pOff=-3;renderProg()});await p.waitForTimeout(300);
const dr=await p.$eval(".cbox .c-ring",e=>e.getAttribute("aria-label")).catch(()=>null);console.log(loc,"anel do dia",dr);if(!dr||!/30 min/.test(dr))bad.push(loc+": sem anel do dia");
await p.evaluate(()=>document.querySelector(".cbox").scrollIntoView({block:"center"}));await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/cardio-prog-${loc}-3-dia.png`});
await p.evaluate(()=>{pOff=0;renderProg()});await p.waitForTimeout(200);
if(!await p.$(".cbox .c-ring"))bad.push(loc+": dia sem cardio sem anel vazio");
await p.evaluate(()=>document.querySelector(".cbox").scrollIntoView({block:"center"}));await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/cardio-prog-${loc}-4-dia-vazio.png`});
await ctx.close()}
console.log("problemas",bad);console.log("errs",errs);await b.close()})();
