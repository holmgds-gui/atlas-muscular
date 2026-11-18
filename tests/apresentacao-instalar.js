/* Tela "Instale" da apresentação (pedido do dono, 0.25: "ensine a colocar o app na tela de início como ícone"):
   um desenho de celular (ou computador) mostra os passos em sequência — tocar em Compartilhar, Adicionar à Tela de
   Início, o ícone aparece — junto com a lista numerada (o passo da vez fica marcado; tocar num passo mostra o desenho dele).
   iPhone (Safari), Android (Chrome) e computador (Chrome), claro e escuro; tira prints dos 3 quadros. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium,devices}=require('playwright');
const DEV={ios:{...devices["iPhone 13"]},and:{...devices["Pixel 7"]},pc:{viewport:{width:1280,height:800},userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"}};
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;const ok=(c,m)=>{console.log((c?' ok  ':' ERRO')+' '+m);if(!c)bad++};
for(const th of ['light','dark'])for(const k of ['ios','and','pc']){
  const ctx=await b.newContext({...DEV[k],colorScheme:th,locale:'pt-BR'});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(k+' '+e.message));
  await p.goto(BASE+"?intro");await p.waitForTimeout(600);
  await p.evaluate(()=>inGo(1));await p.waitForTimeout(700);
  const r=await p.evaluate(()=>({demo:$("insDemo")&&$("insDemo").dataset.k,h2:$("inTrack").children[1].querySelector("h2").textContent,
    steps:[...document.querySelectorAll(".in-steps li")].map(li=>li.dataset.f??"-").join(""),on:document.querySelector(".in-steps li.on")?.dataset.f}));
  ok(r.demo===k&&r.on==="0",`${th} ${k}: ${r.h2} · desenho ${r.demo} · passos ${r.steps} · marcado ${r.on}`);
  for(const f of [0,1,2]){await p.evaluate(f=>{clearInterval(insT);insShow(f)},f);await p.waitForTimeout(500);
    const t=await p.evaluate(()=>{const d=$("insDemo").getBoundingClientRect(),t=document.querySelector(".ins-tap").getBoundingClientRect();
      return {inside:t.left+t.width/2>=d.left&&t.left+t.width/2<=d.right&&t.top+t.height/2>=d.top&&t.top+t.height/2<=d.bottom,op:getComputedStyle(document.querySelector(".ins-tap")).opacity}});
    ok(t.inside,`${th} ${k} quadro ${f}: o dedo fica dentro do desenho`);
    await p.screenshot({path:`${OUT}/instalar-carrossel-${th}-${k}-${f}.png`})}
  // the loop moves on by itself
  await p.evaluate(()=>insStart());await p.waitForTimeout(2700);ok(await p.evaluate(()=>$("insDemo").dataset.f)==="1",`${th} ${k}: passa sozinho para o 2º quadro`);
  // tapping step 3 shows the icon frame
  await p.evaluate(()=>document.querySelector('.in-steps li[data-f="2"]').click());ok(await p.evaluate(()=>$("insDemo").dataset.f)==="2",`${th} ${k}: tocar no passo mostra o quadro dele`);
  await ctx.close()}
// installed app: no install slide
{const ctx=await b.newContext({...DEV.ios});const p=await ctx.newPage();await p.addInitScript(()=>{const mm=matchMedia.bind(window);window.matchMedia=q=>/standalone/.test(q)?{matches:true,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}:mm(q)});
 await p.goto(BASE+"?intro");await p.waitForTimeout(500);ok(!await p.evaluate(()=>!!$("insDemo")),"app instalado: sem a tela de instalar");await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
