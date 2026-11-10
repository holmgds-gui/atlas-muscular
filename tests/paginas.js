/* Arrastar para o lado passa de página em página (pedido do dono): Atlas → Meus treinos → Treinos prontos →
   Registro → Ao vivo → Músculos → Força, e de volta. Confere também que arrastar no boneco, para cima/baixo
   ou num campo não troca de página. Simula o dedo com TouchEvent. Celular, claro e escuro. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});p.on('pageerror',e=>errs.push(e.message));
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
// past the last page nothing happens
await swipe('#progBody',-150);await p.waitForTimeout(200);if(await where()!=='prog/kg')bad++;
// a vertical drag and a short drag do nothing
await swipe('#progBody',-40,-200);await p.waitForTimeout(200);if(await where()!=='prog/kg')bad++;
await swipe('#progBody',-30);await p.waitForTimeout(200);if(await where()!=='prog/kg')bad++;
// a field does nothing (body weight in the ranking)
if(await p.$('#progBody input')){await swipe('#progBody input',-150);await p.waitForTimeout(200);if(await where()!=='prog/kg'){console.log('campo trocou');bad++}}
for(let i=want.length-2;i>=0;i--){const sel=bodyOf[want[i+1].split('/')[0]];await swipe(sel,150);await p.waitForTimeout(350);w=await where();
  console.log(th,'→',w);if(w!==want[i])bad++}
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
