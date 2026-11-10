/* Painel do Atlas que se arrasta (pedido do dono, no lugar do botão "Ver lista") e janelas que fecham arrastando
   para baixo. Simula o dedo com TouchEvent. Celular, claro e escuro. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR'});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(600);
const drag=(sel,dy)=>p.evaluate(([sel,dy])=>{const el=document.querySelector(sel),r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+Math.min(20,r.height/2);
  const T=(yy)=>new Touch({identifier:1,target:el,clientX:x,clientY:yy});
  el.dispatchEvent(new TouchEvent('touchstart',{touches:[T(y)],changedTouches:[T(y)],bubbles:true}));
  el.dispatchEvent(new TouchEvent('touchmove',{touches:[T(y+dy)],changedTouches:[T(y+dy)],bubbles:true}));
  el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[T(y+dy)],bubbles:true}))},[sel,dy]);
const st=()=>p.evaluate(()=>{const a=document.getElementById('tab-atlas');return {idle:a.classList.contains('idle'),cov:a.classList.contains('covered'),list:listOpen,peek,hint:!document.getElementById('pSwipe').hidden,ver:getComputedStyle(document.getElementById('listBtn')).display}});
let s=await st();console.log(th,'início',JSON.stringify(s));if(!s.idle||!s.hint||s.ver!=='none')bad++;
await p.screenshot({path:`${OUT}/arrastar-${th}-0.png`});
await drag('#pGrab',-120);await p.waitForTimeout(400);s=await st();console.log(' ↑',JSON.stringify(s));if(!s.list||!s.cov)bad++;
await p.screenshot({path:`${OUT}/arrastar-${th}-1-lista.png`});
await drag('#pGrab',120);await p.waitForTimeout(400);s=await st();console.log(' ↓',JSON.stringify(s));if(s.list||!s.idle)bad++;
// a muscle: covered; down shows the figure big; up brings the list back
await p.evaluate(()=>selectMuscle('peito_medial'));await p.waitForTimeout(400);s=await st();if(!s.cov)bad++;
await drag('#body',140);await p.waitForTimeout(400);s=await st();console.log(' músculo ↓',JSON.stringify(s));if(s.cov||!s.peek)bad++;
await p.screenshot({path:`${OUT}/arrastar-${th}-2-boneco.png`});
await drag('#pGrab',-140);await p.waitForTimeout(400);s=await st();console.log(' músculo ↑',JSON.stringify(s));if(!s.cov||s.peek)bad++;
// pushing up inside the list only scrolls it
await drag('#body',-140);await p.waitForTimeout(300);s=await st();if(!s.cov)bad++;
await p.tap('#clear');await p.waitForTimeout(300);
// groups: up covers, down uncovers
await p.evaluate(()=>setMode('grp'));await p.waitForTimeout(400);await drag('#pGrab',-120);await p.waitForTimeout(400);s=await st();console.log(' grupos ↑',JSON.stringify(s));if(!s.cov)bad++;
await drag('#pGrab',120);await p.waitForTimeout(400);s=await st();if(s.cov)bad++;
await p.evaluate(()=>setMode('mus'));await p.waitForTimeout(300);
// sheets close when dragged down from the top
await p.evaluate(()=>openHelp('atlas'));await p.waitForTimeout(300);
await drag('#helpSheet .sheet-h',140);await p.waitForTimeout(400);const h=await p.evaluate(()=>document.getElementById('helpSheet').hidden);console.log(' janela ↓ fechou',h);if(!h)bad++;
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
