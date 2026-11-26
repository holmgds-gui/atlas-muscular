/* 0.66: o app sempre abre em Atlas › Músculos (não na última aba usada) e o modo Cardio abre com o boneco grande
   (a lista só ao puxar a folha para cima), igual aos outros modos. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const theme of ['light','dark']){
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:'pt-BR',colorScheme:theme})).newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{localStorage.setItem("atlas-intro","1");const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="2d";localStorage.setItem("atlas-conf",JSON.stringify(c))}});
await p.goto(BASE);await p.waitForTimeout(500);
await p.evaluate(()=>{setModel('art');setTab('prog')});await p.waitForTimeout(200);
await p.reload();await p.waitForTimeout(700);
const r=await p.evaluate(()=>[tab,curMode(),document.getElementById('tab-atlas').hidden]);console.log(theme,'abriu em',r);
if(r[0]!=='atlas'||r[1]!=='mus'||r[2])errs.push('não abriu no início '+r);
await p.evaluate(()=>setMode('cd'));await p.waitForTimeout(500);
const c=await p.evaluate(()=>[curMode(),isCovered(),document.getElementById('tab-atlas').classList.contains('covered')]);console.log(theme,'cardio',c);
if(c[0]!=='cd'||c[2])errs.push('cardio abriu coberto '+c);
await p.screenshot({path:`${OUT}/inicio-${theme}-cardio.png`});
await p.evaluate(()=>sheetMove('up'));await p.waitForTimeout(500);
const u=await p.evaluate(()=>document.getElementById('tab-atlas').classList.contains('covered'));console.log(theme,'puxou: lista',u);if(!u)errs.push('não abriu a lista ao puxar');
await p.screenshot({path:`${OUT}/inicio-${theme}-cardio-lista.png`});
await p.evaluate(()=>sheetMove('down'));await p.waitForTimeout(400);
if(await p.evaluate(()=>document.getElementById('tab-atlas').classList.contains('covered')))errs.push('não voltou ao boneco grande');
// ♂/♀ saiu da barra do Atlas e foi para Configurações › Corpo do boneco
if(await p.evaluate(()=>!!document.getElementById('sexTgl')))errs.push('botão ♂/♀ ainda no Atlas');
await p.evaluate(()=>setTab('conf'));await p.waitForTimeout(300);await p.tap('[data-cf="sex"][data-v="f"]');await p.waitForTimeout(300);
const sx=await p.evaluate(()=>[sex,localStorage.getItem('atlas-sex'),document.querySelector('[data-cf="sex"][data-v="f"]').getAttribute('aria-pressed')]);console.log(theme,'config sexo',sx);if(sx.join()!=='f,f,true')errs.push('config sexo '+sx);
await p.screenshot({path:`${OUT}/inicio-${theme}-config.png`});
await p.tap('[data-cf="sex"][data-v="m"]');await p.evaluate(()=>setTab('atlas'));await p.waitForTimeout(300);
// grupos continua igual
await p.evaluate(()=>setMode('grp'));await p.waitForTimeout(300);if(await p.evaluate(()=>isCovered()))errs.push('grupos coberto');
await p.context().close()}
console.log('errs',errs);await b.close();process.exit(errs.length?1:0)})();
