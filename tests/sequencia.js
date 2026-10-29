/* 🔥 da grade de Hoje mostra "1 semana" e abre as Conquistas. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,theme] of [['pt-BR','dark'],['en-US','light']]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:loc,colorScheme:theme,timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);
await p.evaluate(()=>{localStorage.clear();const mon=fromIso(monOf(isoDate(new Date())));const W=[];
 for(let i=0;i<4;i++){const d=new Date(mon);d.setDate(d.getDate()+i);W.push({id:'w'+i,date:isoDate(d),title:['Upper de seg','Upper','Leg day','Ombro 00'][i],done:true,notes:'',items:[{name:'Supino reto · barra',ref:'supino|b=re,e=ba,w=md,g=pr',target:'8-12',notes:'',sets:[{r:'8',kg:'60'}]}]})}
 localStorage.setItem('atlas-workouts',JSON.stringify(W))});
await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>setTab('treino'));await p.waitForTimeout(300);
console.log(loc,await p.evaluate(()=>document.querySelector('.streak').parentElement.textContent.trim()));
await p.screenshot({path:`${OUT}/streak-${loc}.png`,clip:{x:0,y:0,width:390,height:520}});
await p.tap('.streak');await p.waitForTimeout(300);
console.log(loc,'after tap',await p.evaluate(()=>[tab,pView]));
await ctx.close()}
console.log('errs',errs);await b.close()})();
