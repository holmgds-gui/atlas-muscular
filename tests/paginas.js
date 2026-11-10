/* Arrastar para o lado passa de página em página (pedido do dono): Atlas → Meus treinos → Treinos prontos →
   Registro → Ao vivo → Músculos → Força, e de volta. Confere também que arrastar no boneco, para cima/baixo
   ou num campo não troca de página. Simula o dedo com TouchEvent. Celular, claro e escuro. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="2d";localStorage.setItem("atlas-conf",JSON.stringify(c))}}}catch(e){}navigator.vibrate=()=>{window.__vib=(window.__vib||0)+1;return true}});p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(600);
const swipe=(sel,dx,dy=0)=>p.evaluate(([sel,dx,dy])=>{const el=[...document.querySelectorAll(sel)].find(e=>e.offsetParent!==null&&e.getBoundingClientRect().height>0)||document.querySelector(sel);
  const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+Math.min(30,r.height/2);
  const T=(xx,yy)=>new Touch({identifier:1,target:el,clientX:xx,clientY:yy});
  el.dispatchEvent(new TouchEvent('touchstart',{touches:[T(x,y)],changedTouches:[T(x,y)],bubbles:true}));
  el.dispatchEvent(new TouchEvent('touchmove',{touches:[T(x+dx,y+dy)],changedTouches:[T(x+dx,y+dy)],bubbles:true}));
  el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[T(x+dx,y+dy)],bubbles:true}))},[sel,dx,dy]);
const where=()=>p.evaluate(()=>PAGES[pageIdx()].join('/'));
const bodyOf={atlas:'#tab-atlas .panel h2','ficha':'#fichaBody','treino':'#treinoBody','prog':'#progBody'};
const want=['atlas','ficha/meus','ficha/prontos','treino/reg','treino/live','prog/mus','prog/kg'];
let w=await where();if(w!=='atlas'){console.log('início',w);bad++}
// swipe on the figure does nothing
await swipe('#tab-atlas .stage',-150);await p.waitForTimeout(200);if(await where()!=='atlas'){console.log('boneco trocou a página');bad++}
for(let i=1;i<want.length;i++){const sel=bodyOf[want[i-1].split('/')[0]];await swipe(sel,-150);await p.waitForTimeout(350);w=await where();
  console.log(th,'←',w);if(w!==want[i])bad++;await p.screenshot({path:`${OUT}/paginas-${th}-${i}.png`})}
// a ring (owner: "ciclo infinito"): after the last page comes the first, and back
await swipe('#progBody',-150);await p.waitForTimeout(350);w=await where();console.log(th,'← depois da última',w);if(w!=='atlas')bad++;
await swipe(bodyOf.atlas,150);await p.waitForTimeout(350);w=await where();console.log(th,'→ antes da primeira',w);if(w!=='prog/kg')bad++;
// a vertical drag and a short drag do nothing
await swipe('#progBody',-40,-200);await p.waitForTimeout(200);if(await where()!=='prog/kg')bad++;
await swipe('#progBody',-30);await p.waitForTimeout(200);if(await where()!=='prog/kg')bad++;
// a field does nothing (body weight in the ranking)
if(await p.$('#progBody input')){await swipe('#progBody input',-150);await p.waitForTimeout(200);if(await where()!=='prog/kg'){console.log('campo trocou');bad++}}
// vibrated on the page changes
const vib=await p.evaluate(()=>window.__vib||0);console.log(th,'vibrou',vib);if(vib<5)bad++;
// the page follows the finger: hold mid-drag, then let go short → springs back
await p.evaluate(()=>{const el=document.getElementById('progBody'),r=el.getBoundingClientRect(),x=300,y=r.top+60,T=xx=>new Touch({identifier:1,target:el,clientX:xx,clientY:y});
  el.dispatchEvent(new TouchEvent('touchstart',{touches:[T(x)],changedTouches:[T(x)],bubbles:true}));
  for(let i=1;i<=5;i++)el.dispatchEvent(new TouchEvent('touchmove',{touches:[T(x+20*i)],changedTouches:[T(x+20*i)],bubbles:true,cancelable:true}))});
await p.waitForTimeout(60);const tf=await p.evaluate(()=>document.getElementById('tab-prog').style.transform);console.log(' seguindo',tf);if(!/translateX\(100px\)/.test(tf))bad++;
await p.screenshot({path:`${OUT}/paginas-${th}-seguindo.png`});
await p.waitForTimeout(400);
await p.evaluate(()=>{const el=document.getElementById('progBody');el.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[new Touch({identifier:1,target:el,clientX:400,clientY:300})],bubbles:true}))});
await p.waitForTimeout(400);const back=await p.evaluate(()=>({t:document.getElementById('tab-prog').style.transform,w:PAGES[pageIdx()].join('/')}));console.log(' solta curto',JSON.stringify(back));if(back.t||back.w!=='prog/kg')bad++;
for(let i=want.length-2;i>=0;i--){const sel=bodyOf[want[i+1].split('/')[0]];await swipe(sel,150);await p.waitForTimeout(350);w=await where();
  console.log(th,'→',w);if(w!==want[i])bad++}
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
