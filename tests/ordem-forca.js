/* Ordem do "Nível por grupo" em Progresso › Força (pedido do dono, 0.19): mais forte primeiro (padrão), mais fraco
   primeiro (o mais forte vai para o final), A–Z e ordem do corpo; os exercícios de cada grupo seguem a mesma ordem.
   A escolha fica salva. Celular, claro e escuro. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
const seed=()=>{const R=id=>{const f=FAMBY[id];return [vName(f,f.d),mkRef(f,f.d)]};
  const it=(id,r,kg)=>{const x=R(id);return {name:x[0],ref:x[1],target:"8-12",notes:"",sets:[{r:String(r),kg:String(kg)}]}};
  const iso=isoDate(new Date());
  localStorage.setItem("atlas-workouts",JSON.stringify([{id:"w1",date:iso,title:"T",planId:null,done:true,notes:"",
    items:[it("supino",5,120),it("rosca",10,12),it("agach",8,90),it("remcurv",8,60),it("desenv",8,30),it("terra",5,170)]}]));
  localStorage.setItem("atlas-rank",JSON.stringify({bw:80,man:[]}))};
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="2d";localStorage.setItem("atlas-conf",JSON.stringify(c))}}}catch(e){}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(400);await p.evaluate(seed);await p.reload();await p.waitForTimeout(500);
await p.evaluate(()=>{pView="kg";setTab("prog")});await p.waitForTimeout(500);
const rows=()=>p.evaluate(()=>[...document.querySelectorAll(".rk-g")].map(d=>({n:d.querySelector(".pg-n").firstChild.textContent.trim(),s:rankData().gs.find(x=>x.g===d.dataset.rg2).s})));
if(!await p.$("[data-rksort]")){console.log("sem seletor");bad++}
let r=await rows();console.log(th,"padrão",r.map(x=>x.n).join(" > "));
const desc=a=>a.every((x,i)=>!i||a[i-1].s>=x.s),asc=a=>a.every((x,i)=>!i||a[i-1].s<=x.s);
if(r.length<3||!desc(r))bad++;
await p.evaluate(()=>document.querySelector(".rk-g").scrollIntoView({block:"center"}));await p.screenshot({path:`${OUT}/ordem-forca-${th}.png`});
// inside the open group, the exercises are strongest first too
await p.evaluate(()=>{document.querySelectorAll(".rk-g").forEach(d=>d.open=true)});
const inner=await p.evaluate(()=>{const g=rankData().gs.find(x=>x.ex.length>1);if(!g)return null;const d=document.querySelector(`.rk-g[data-rg2="${g.g}"]`);
  const names=[...d.querySelectorAll(".rk-exn")].map(e=>e.firstChild.textContent.trim());const want=g.ex.slice().sort((a,b)=>b.s-a.s).map(o=>o.name);return {names,want}});
if(inner){console.log(" dentro",JSON.stringify(inner.names));if(JSON.stringify(inner.names)!==JSON.stringify(inner.want))bad++}
await p.selectOption("[data-rksort]","weak");await p.waitForTimeout(200);r=await rows();console.log(" mais fraco",r.map(x=>x.n).join(" > "));if(!asc(r))bad++;
await p.selectOption("[data-rksort]","az");await p.waitForTimeout(200);r=await rows();console.log(" A–Z",r.map(x=>x.n).join(" > "));
if(r.some((x,i)=>i&&r[i-1].n.localeCompare(x.n,"pt-BR",{sensitivity:"base"})>0))bad++;
await p.selectOption("[data-rksort]","body");await p.waitForTimeout(200);r=await rows();
const body=await p.evaluate(()=>rankData().gs.map(x=>BASIC[x.g].n));console.log(" corpo",r.map(x=>x.n).join(" > "));if(JSON.stringify(r.map(x=>x.n))!==JSON.stringify(body))bad++;
// kept
await p.selectOption("[data-rksort]","weak");await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>{pView="kg";setTab("prog")});await p.waitForTimeout(400);
if(await p.$eval("[data-rksort]",s=>s.value)!=="weak")bad++;
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
