/* Ordem de Meus treinos (pedido do dono, 0.19): Do meu jeito, A–Z, Mais novos, Mais antigos, Feitos recentemente,
   Mais feitos e Mais exercícios. A escolha fica salva. Celular, claro e escuro. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
const id=(t,s)=>t.toString(36)+s;   // same shape as uid(): Date.now() in base 36 + 4 characters
const T0=Date.parse("2026-01-10T12:00:00Z");
const PLANS=[
  {id:id(T0+3e9,"aaaa"),name:"Costas e bíceps",days:[2],items:[{name:"a"},{name:"b"},{name:"c"}]},
  {id:id(T0,"bbbb"),name:"peito e tríceps",days:[0],items:[{name:"a"},{name:"b"}]},
  {id:id(T0+9e9,"cccc"),name:"Ábdomen",days:[],items:[{name:"a"}]},
  {id:id(T0+6e9,"dddd"),name:"Pernas",days:[4],items:[{name:"a"},{name:"b"},{name:"c"},{name:"d"},{name:"e"}]}];
const W=(pid,date,done=true)=>({id:"w"+date+pid.slice(-2),date,title:"x",planId:pid,done,notes:"",items:[]});
const WORK=[W(PLANS[1].id,"2026-11-02"),W(PLANS[1].id,"2026-11-05"),W(PLANS[1].id,"2026-11-09"),W(PLANS[0].id,"2026-11-10"),W(PLANS[3].id,"2026-11-03"),W(PLANS[3].id,"2026-11-06"),W(PLANS[2].id,"2026-11-11",false)];
const WANT={mine:["Costas e bíceps","peito e tríceps","Ábdomen","Pernas"],
  az:["Ábdomen","Costas e bíceps","peito e tríceps","Pernas"],   // no matter upper/lower case or accents
  new:["Ábdomen","Pernas","Costas e bíceps","peito e tríceps"],
  old:["peito e tríceps","Costas e bíceps","Pernas","Ábdomen"],
  last:["Costas e bíceps","peito e tríceps","Pernas","Ábdomen"],   // a workout begun but not done does not count
  most:["peito e tríceps","Pernas","Costas e bíceps","Ábdomen"],
  ex:["Pernas","Costas e bíceps","peito e tríceps","Ábdomen"]};
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();await p.addInitScript(([pl,wk])=>{try{localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="2d";localStorage.setItem("atlas-conf",JSON.stringify(c))}}
  if(!localStorage.getItem("atlas-plans"))localStorage.setItem("atlas-plans",JSON.stringify(pl));if(!localStorage.getItem("atlas-workouts"))localStorage.setItem("atlas-workouts",JSON.stringify(wk))}catch(e){}},[PLANS,WORK]);
p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(500);await p.evaluate(()=>{fView="meus";openPlan=null;setTab("ficha")});await p.waitForTimeout(400);
const names=()=>p.evaluate(()=>[...document.querySelectorAll("#fichaBody .plan .plan-h .wx-n")].map(x=>x.textContent));
if(!await p.$("[data-fsort]")){console.log("sem o seletor de ordem");bad++}
for(const k of Object.keys(WANT)){await p.selectOption("[data-fsort]",k);await p.waitForTimeout(150);const n=await names();const ok=JSON.stringify(n)===JSON.stringify(WANT[k]);
  console.log(th,k.padEnd(4),ok?"ok":"ERRADO",n.join(" | "));if(!ok)bad++;
  if(k==="last")await p.screenshot({path:`${OUT}/ordem-treinos-${th}.png`})}
// the choice is kept
await p.selectOption("[data-fsort]","most");await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>{fView="meus";setTab("ficha")});await p.waitForTimeout(300);
const v=await p.$eval("[data-fsort]",s=>s.value);console.log(" salvo:",v);if(v!=="most")bad++;
// opening a workout and adding one still work with a sort on
await p.evaluate(()=>{openPlan=plans[0].id;renderFicha()});await p.waitForTimeout(200);if(!await p.$("#fichaBody .title-inp"))bad++;
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
