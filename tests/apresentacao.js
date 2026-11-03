/* Apresentação (carrossel da 1ª vez): aparece só para quem não tem dados, some depois de Pular/Começar,
   tela "Instale" só fora do app instalado, prints carregam, Configurações › Apresentação reabre. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
const IOS='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const AND='Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
(async()=>{const b=await chromium.launch();const errs=[],bad=[];
for(const [loc,theme,ua,name] of [['pt-BR','light',IOS,'pt-iphone'],['pt-BR','dark',IOS,'pt-iphone-escuro'],['es-ES','light',AND,'es-android'],['en-US','dark',null,'en-pc']]){
  const ctx=await b.newContext({viewport:ua?{width:390,height:844}:{width:1280,height:860},isMobile:!!ua,hasTouch:!!ua,deviceScaleFactor:2,colorScheme:theme,locale:loc,...(ua?{userAgent:ua}:{})});
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));
  const miss=[];p.on('response',r=>{if(/intro\/|icon-512/.test(r.url())&&!r.ok())miss.push(r.url())});
  await p.goto(BASE);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(700);
  const n=await p.evaluate(()=>document.querySelectorAll('#inTrack .in-s').length);
  if(await p.evaluate(()=>document.getElementById('intro').hidden))bad.push(name+': não abriu');
  const inst=await p.evaluate(()=>[...document.querySelectorAll('.in-steps li')].length);
  console.log(name,'telas',n,'passos instalar',inst);
  for(let i=0;i<n;i++){
    await p.waitForTimeout(450);
    if(i<3||i===n-1||name==='pt-iphone')await p.screenshot({path:`${OUT}/apresentacao-${name}-${i}.png`});
    const imgs=await p.evaluate(i=>[...document.querySelectorAll('#inTrack .in-s')[i].querySelectorAll('img')].map(im=>im.complete&&im.naturalWidth>0),i);
    if(imgs.includes(false)){await p.waitForTimeout(600);}
    if(i<n-1)await p.click('#inNext');
  }
  const btn=await p.evaluate(()=>document.getElementById('inNext').textContent);
  await p.click('#inNext');await p.waitForTimeout(200);
  if(!await p.evaluate(()=>document.getElementById('intro').hidden))bad.push(name+': não fechou com '+btn);
  await p.reload();await p.waitForTimeout(500);
  if(!await p.evaluate(()=>document.getElementById('intro').hidden))bad.push(name+': apareceu de novo');
  // reabrir pelas Configurações, passar arrastando e pular
  await p.evaluate(()=>setTab('conf'));await p.click('[data-cact="intro"]');await p.waitForTimeout(300);
  if(await p.evaluate(()=>document.getElementById('intro').hidden))bad.push(name+': Configurações não reabre');
  await p.evaluate(()=>{const t=document.getElementById('inTrack');t.style.scrollBehavior='auto';t.scrollLeft=t.clientWidth*2});await p.waitForTimeout(300);
  const bars=await p.evaluate(()=>document.querySelectorAll('#inBars i.on').length);if(bars!==3)bad.push(name+': barras '+bars);
  await p.click('#inSkip');await p.waitForTimeout(150);
  if(!await p.evaluate(()=>document.getElementById('intro').hidden))bad.push(name+': Pular não fecha');
  if(miss.length)bad.push(name+': imagens faltando '+miss.join(' '));
  await ctx.close();
}
// quem já usa o app (tem treinos) não vê
{const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();await p.goto(BASE);
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('atlas-workouts',JSON.stringify([{id:'x',date:'2026-10-01',title:'A',done:true,items:[]}]))});await p.reload();await p.waitForTimeout(400);
 if(!await p.evaluate(()=>document.getElementById('intro').hidden))bad.push('usuário antigo viu a apresentação');
 if(await p.evaluate(()=>localStorage.getItem('atlas-intro'))!=='1')bad.push('usuário antigo: marca não salva');
 // app instalado (display-mode standalone): sem a tela de instalar
 await p.evaluate(()=>localStorage.clear());await p.addInitScript(()=>{const mm=window.matchMedia;window.matchMedia=q=>q.includes('standalone')?{matches:true,addEventListener(){},removeEventListener(){}}:mm.call(window,q)});
 await p.reload();await p.waitForTimeout(500);
 const st=await p.evaluate(()=>[document.getElementById('intro').hidden,document.querySelectorAll('.in-steps').length,document.querySelectorAll('#inTrack .in-s').length]);
 console.log('instalado',st);if(st[0]||st[1])bad.push('instalado: '+st);
 await ctx.close()}
console.log('problemas',bad);console.log('errs',errs.filter(e=>!/TUNNEL/.test(e)));await b.close()})();
