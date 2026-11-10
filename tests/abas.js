/* Barras de abas que deslizam (pedido do dono): a "pílula" da opção escolhida desliza ao tocar e segue o dedo
   ao arrastar; soltar escolhe a opção embaixo dela. Confere Hoje (Registro/Ao vivo), Treinos (Meus/Prontos) e
   Progresso (Músculos/Força), que arrastar a barra não troca de página e que um arrasto curto volta para o lugar.
   Simula o dedo com TouchEvent. Celular, claro e escuro. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="2d";localStorage.setItem("atlas-conf",JSON.stringify(c))}}}catch(e){}});p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(600);
/* drag from the middle of button `from` by dx; `hold` leaves the finger down (for a screenshot) */
const drag=(seg,from,dx,dy=0,hold=false)=>p.evaluate(([seg,from,dx,dy,hold])=>{const g=[...document.querySelectorAll(seg)].find(e=>e.offsetWidth),el=g.querySelector(from),r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  const T=(xx,yy)=>new Touch({identifier:1,target:el,clientX:xx,clientY:yy});
  el.dispatchEvent(new TouchEvent('touchstart',{touches:[T(x,y)],changedTouches:[T(x,y)],bubbles:true}));
  for(let i=1;i<=6;i++)el.dispatchEvent(new TouchEvent('touchmove',{touches:[T(x+dx*i/6,y+dy*i/6)],changedTouches:[T(x+dx*i/6,y+dy*i/6)],bubbles:true}));
  if(!hold)el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[T(x+dx,y+dy)],bubbles:true}))},[seg,from,dx,dy,hold]);
const under=seg=>p.evaluate(seg=>{const g=[...document.querySelectorAll(seg)].find(e=>e.offsetWidth),t=g.querySelector('.seg-th').getBoundingClientRect(),
  on=g.querySelector('button[aria-pressed="true"]').getBoundingClientRect();return {ok:Math.abs(t.left-on.left)<2&&Math.abs(t.width-on.width)<2,tab,has:g.classList.contains('has-th')}},seg);
const st=()=>p.evaluate(()=>({tab,hView,fView,pView}));
// Hoje: drag Registro → Ao vivo
await p.evaluate(()=>{hView="reg";setTab("treino")});await p.waitForTimeout(400);
let u=await under('.seg.hview');if(!u.ok||!u.has){console.log('pílula fora do lugar',u);bad++}
await drag('.seg.hview','[data-hv="reg"]',90,0,true);await p.waitForTimeout(100);await p.screenshot({path:`${OUT}/abas-${th}-arrastando.png`});
await p.evaluate(()=>{const el=document.querySelector('.seg.hview [data-hv="reg"]');el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[new Touch({identifier:1,target:el,clientX:300,clientY:300})],bubbles:true}))});
await p.waitForTimeout(450);let s=await st();console.log(th,'Hoje arrastou',s.hView,s.tab);if(s.hView!=='live'||s.tab!=='treino')bad++;
u=await under('.seg.hview');if(!u.ok){console.log('pílula depois',u);bad++}
await p.screenshot({path:`${OUT}/abas-${th}-aovivo.png`});
// a short drag goes back to where it was
await drag('.seg.hview','[data-hv="live"]',-40);await p.waitForTimeout(450);s=await st();if(s.hView!=='live'){console.log('arrasto curto trocou');bad++}
u=await under('.seg.hview');if(!u.ok)bad++;
// a vertical drag on the bar does nothing
await drag('.seg.hview','[data-hv="live"]',-10,120);await p.waitForTimeout(300);s=await st();if(s.hView!=='live')bad++;
// back to Registro by dragging left
await drag('.seg.hview','[data-hv="live"]',-150);await p.waitForTimeout(450);s=await st();console.log(' volta',s.hView);if(s.hView!=='reg'||s.tab!=='treino')bad++;
// Treinos and Progresso
await p.evaluate(()=>{fView="meus";setTab("ficha")});await p.waitForTimeout(400);
await drag('.seg.fview','[data-fv="meus"]',160);await p.waitForTimeout(450);s=await st();console.log(' Treinos',s.fView,s.tab);if(s.fView!=='prontos'||s.tab!=='ficha')bad++;
u=await under('.seg.fview');if(!u.ok)bad++;
await p.evaluate(()=>{pView="mus";setTab("prog")});await p.waitForTimeout(400);
await drag('.seg.pview','[data-pv="mus"]',160);await p.waitForTimeout(450);s=await st();console.log(' Progresso',s.pView,s.tab);if(s.pView!=='kg'||s.tab!=='prog')bad++;
u=await under('.seg.pview');if(!u.ok)bad++;
// ring (owner: "ciclo infinito"): on Força, pulling the pill further right goes round to Músculos
await drag('.seg.pview','[data-pv="kg"]',120);await p.waitForTimeout(450);s=await st();console.log(' Força → de novo',s.pView);if(s.pView!=='mus')bad++;
u=await under('.seg.pview');if(!u.ok)bad++;
await drag('.seg.pview','[data-pv="mus"]',-120);await p.waitForTimeout(450);s=await st();console.log(' Músculos ← de novo',s.pView);if(s.pView!=='kg')bad++;
// a plain tap slides it too and ends under the new option
await p.tap('[data-pv="mus"]');await p.waitForTimeout(450);s=await st();if(s.pView!=='mus')bad++;u=await under('.seg.pview');if(!u.ok)bad++;
// Semana/Dia (no redraw of a whole page) also follows
await p.tap('[data-pm="day"]');await p.waitForTimeout(450);u=await under('.seg:has([data-pm])');if(!u.ok){console.log('Semana/Dia',u);bad++}
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
