/* Treinos › "+ Treino só para hoje": monta, escolhe o dia e registra como feito sem o Ao vivo (pt claro, es escuro, en claro). */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,theme] of [['pt-BR','light'],['es-ES','dark'],['en-US','light']]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:loc,colorScheme:theme,timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="2d";localStorage.setItem("atlas-conf",JSON.stringify(c))}}}catch(e){}});
p.on('pageerror',e=>errs.push(loc+' '+e.message));
await p.goto(BASE);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(500);
await p.evaluate(()=>setTab('ficha'));await p.waitForTimeout(200);
await p.screenshot({path:`${OUT}/dia-${loc}-0.png`});
await p.tap('[data-dd="open"]');await p.waitForTimeout(250);
if(await p.evaluate(()=>$("picker").hidden))errs.push(loc+' picker não abriu');
// exercício próprio digitado + um da lista + cardio
await p.fill('#pq','Rosca <b>teste</b>');await p.waitForTimeout(150);
await p.evaluate(()=>document.querySelector('#plist .custom').click());await p.waitForTimeout(200);
await p.evaluate(()=>{const f=FAMS.find(f=>f.id==="supino")||FAMS[0];document.querySelector('[data-dd="add"]').click();pickCb(f.n||f.name||"Supino reto",null);closeModals()});
await p.evaluate(()=>{document.querySelector('[data-dd="add"]').click();pickCb("Corrida","cardio:run");closeModals()});await p.waitForTimeout(200);
const n=await p.evaluate(()=>dayDraft.items.length);if(n!==3)errs.push(loc+' itens '+n);
// preenche: 4 séries x 10 reps, 20 kg no primeiro
await p.fill('[data-ddf="sets"][data-j="0"]','4');await p.fill('[data-ddf="reps"][data-j="0"]','10');await p.fill('[data-ddf="kg"][data-j="0"]','20');
await p.fill('[data-ddf="name"]','Braço rápido');
await p.screenshot({path:`${OUT}/dia-${loc}-1.png`,fullPage:false});
// sobrevive a recarregar
await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>setTab('ficha'));await p.waitForTimeout(200);
if(!(await p.evaluate(()=>dayDraft&&dayDraft.items.length===3&&dayDraft.name==="Braço rápido")))errs.push(loc+' rascunho perdido');
// ontem
await p.tap('[data-dd="day"][data-v="y"]');await p.waitForTimeout(150);
await p.screenshot({path:`${OUT}/dia-${loc}-2.png`});
await p.tap('[data-dd="commit"]');await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const w=workouts[workouts.length-1];return {n:workouts.length,done:w.done,date:w.date,title:w.title,its:w.items.map(i=>i.name+':'+i.sets.map(s=>(s.r||'')+'x'+(s.kg||'')+(s.min||'')).join(',')),draft:dayDraft,plans:plans.length,
  y:(()=>{const d=new Date();d.setDate(d.getDate()-1);return isoDate(d)})()}});
console.log(loc,JSON.stringify(r));
if(r.done!==true||r.date!==r.y||r.draft!==null||r.plans!==0||!/<|>/.test(r.its[0])===false)errs.push(loc+' commit '+JSON.stringify(r));
if(!r.its[0].includes("10x20")||!r.its[2].endsWith(":x20"))errs.push(loc+" séries "+r.its);
await p.screenshot({path:`${OUT}/dia-${loc}-3.png`});
// salvar também em Meus treinos + futuro bloqueado
await p.tap('[data-dd="open"]');await p.waitForTimeout(200);await p.evaluate(()=>{pickCb("Agachamento",null);closeModals()});await p.waitForTimeout(150);
await p.evaluate(()=>{const i=document.querySelector('[data-ddf="save"]');i.click()});
await p.tap('[data-dd="day"][data-v="o"]');await p.waitForTimeout(150);
await p.evaluate(()=>{const i=document.querySelector('[data-ddf="date"]');i.value="2999-01-01";i.dispatchEvent(new Event("input",{bubbles:true}))});
await p.tap('[data-dd="commit"]');await p.waitForTimeout(300);
const r2=await p.evaluate(()=>{const w=workouts[workouts.length-1];return {date:w.date,plans:plans.length,pid:!!w.planId,today:isoDate(new Date())}});
console.log(loc,JSON.stringify(r2));if(r2.date>r2.today||r2.plans!==1||!r2.pid)errs.push(loc+' save/futuro '+JSON.stringify(r2));
// Hoje mostra como feito
await p.evaluate(()=>setTab('treino'));await p.waitForTimeout(250);await p.screenshot({path:`${OUT}/dia-${loc}-4-hoje.png`});
await ctx.close()}
console.log('errs',errs);await b.close();process.exit(errs.length?1:0)})();
