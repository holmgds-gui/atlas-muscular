/* Instalar no computador (pedido do dono, 0.22): o Chrome aceita instalar o app (sem erros de instalação); quando o
   navegador oferece a instalação aparece o botão de instalar no topo e em Configurações › Instalar no computador, e
   tocar nele abre a janela do navegador; sem a oferta, a página mostra os passos do menu de cada navegador (Chrome,
   Edge, Safari do Mac; o Firefox não instala). A apresentação no computador diz "Instale no computador". */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
const UA={chrome:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  edge:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  firefox:"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
  safari:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"};
const WANT={chrome:/Transmitir, salvar e compartilhar/,edge:/Instalar este site como um aplicativo/,firefox:/não instala apps/,safari:/Adicionar ao Dock/};
const fake=()=>{const e=new Event("beforeinstallprompt");window.__prompted=0;e.prompt=()=>{window.__prompted++};e.userChoice=Promise.resolve({outcome:"accepted"});dispatchEvent(e)};
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
const init=()=>{try{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-conf",JSON.stringify({fig:"2d"}))}catch(e){}};
// installable for Chrome
{const ctx=await b.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();await p.addInitScript(init);await p.goto(BASE);await p.waitForTimeout(2500);
 const s=await ctx.newCDPSession(p);const ie=(await s.send("Page.getInstallabilityErrors")).installabilityErrors;console.log('erros de instalação',JSON.stringify(ie));if(ie.length)bad++;await ctx.close()}
for(const th of ['light','dark'])for(const br of Object.keys(UA)){if(th==='dark'&&br!=='chrome')continue;
  const ctx=await b.newContext({viewport:{width:1280,height:800},userAgent:UA[br],colorScheme:th,locale:'pt-BR'});const p=await ctx.newPage();await p.addInitScript(init);
  p.on('pageerror',e=>errs.push(br+': '+e.message));
  await p.goto(BASE);await p.waitForTimeout(500);
  await p.evaluate(()=>setTab("conf"));await p.waitForTimeout(300);
  const row=await p.evaluate(()=>{const b=document.querySelector('[data-cact="install"]');const r=b&&b.closest(".cf-row");return {txt:r?r.innerText:"",btn:b&&!b.hidden,top:!document.getElementById("instBtn").hidden}});
  const ok=WANT[br].test(row.txt)&&!row.btn&&!row.top;console.log(th,br,ok?'ok':'ERRADO',JSON.stringify(row.txt.slice(0,80)));if(!ok)bad++;
  if(br==='chrome'){
    await p.evaluate(fake);await p.waitForTimeout(150);
    let v=await p.evaluate(()=>({top:!document.getElementById("instBtn").hidden,btn:!document.querySelector('[data-cact="install"]').hidden}));console.log(' com a oferta',JSON.stringify(v));if(!v.top||!v.btn)bad++;
    await p.evaluate(()=>document.querySelector('[data-cact="install"]').closest(".cf-row").scrollIntoView({block:"center"}));
    await p.screenshot({path:`${OUT}/instalar-${th}-config.png`});
    await p.click('[data-cact="install"]');await p.waitForTimeout(200);
    v=await p.evaluate(()=>({n:window.__prompted,top:!document.getElementById("instBtn").hidden}));console.log(' depois de tocar',JSON.stringify(v));if(v.n!==1||v.top)bad++;
    // header button works too
    await p.evaluate(fake);await p.waitForTimeout(100);await p.screenshot({path:`${OUT}/instalar-${th}-topo.png`,clip:{x:0,y:0,width:1280,height:90}});
    await p.click('#instBtn');await p.waitForTimeout(200);if(await p.evaluate(()=>window.__prompted)!==1)bad++;
    // the welcome tour on a computer
    await p.evaluate(()=>openIntro());await p.waitForTimeout(300);await p.evaluate(()=>document.querySelectorAll("#intro h2")[1].scrollIntoView());
    const t=await p.evaluate(()=>[...document.querySelectorAll("#intro h2")].map(h=>h.textContent).find(x=>/Instale/.test(x)));console.log(' apresentação',t);if(t!=="Instale no computador")bad++;
  }
  await ctx.close()}
// phone with the offer: the header button stays hidden (no room; the option is in Configurações) and nothing overflows
{const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",colorScheme:'dark'});
 const p=await ctx.newPage();await p.addInitScript(init);await p.goto(BASE);await p.waitForTimeout(500);await p.evaluate(fake);await p.waitForTimeout(150);
 const w=await p.evaluate(()=>{const h=document.querySelector("header");return {sw:h.scrollWidth,cw:h.clientWidth,doc:document.documentElement.scrollWidth}});const hid=await p.evaluate(()=>getComputedStyle(document.getElementById('instBtn')).display==='none');console.log('celular',JSON.stringify(w),'botão do topo escondido',hid);if(w.doc>390||!hid)bad++;
 await p.screenshot({path:`${OUT}/instalar-celular.png`,clip:{x:0,y:0,width:390,height:80}});await ctx.close()}
// English / Spanish
for(const [loc,re] of [["en-US",/Install on your computer/],["es-ES",/Instalar en la computadora/]]){const ctx=await b.newContext({viewport:{width:1280,height:800},userAgent:UA.chrome,locale:loc});
 const p=await ctx.newPage();await p.addInitScript(init);await p.goto(BASE);await p.waitForTimeout(500);await p.evaluate(()=>setTab("conf"));await p.waitForTimeout(300);
 const t=await p.evaluate(()=>document.querySelector('[data-cact="install"]').closest(".cf-row").innerText);const lab=await p.getAttribute('#instBtn','aria-label');
 console.log(loc,re.test(t)?'ok':'ERRADO',lab);if(!re.test(t)||/Instalar o app/.test(lab))bad++;await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
