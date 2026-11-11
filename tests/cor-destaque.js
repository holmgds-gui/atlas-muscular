/* Cor de destaque (pedido do dono, 0.21): a cor escolhida em Configurações troca o vermelho do app todo — título, aba,
   músculo escolhido no 2D e no 3D, rótulos, gráfico, logo — e não só o título. Apagar e avisos continuam vermelhos.
   Laranja: os sinergistas viram amarelo para não confundir. Voltar para Vermelho tira tudo. Celular, claro e escuro.
   O 3D vem do jsDelivr; sem internet no teste, use THREE_DIR=<pasta do three@0.160.0>. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const path=require("path"),fs=require("fs");
let TD=process.env.THREE_DIR;try{if(!TD)TD=path.dirname(require.resolve("three/package.json"))}catch(e){}
const {chromium}=require('playwright');
const hex=c=>{const m=c.match(/\d+(\.\d+)?/g);return m?"#"+m.slice(0,3).map(x=>(+x|0).toString(16).padStart(2,"0")).join(""):c.trim().toLowerCase()};
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];let bad=0;
for(const th of ['light','dark']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR'});
if(TD)await ctx.route("https://cdn.jsdelivr.net/npm/three@0.160.0/**",r=>{const f=path.join(TD,new URL(r.request().url()).pathname.replace("/npm/three@0.160.0/",""));
  fs.existsSync(f)?r.fulfill({path:f,contentType:"application/javascript"}):r.abort()});
const p=await ctx.newPage();p.setDefaultTimeout(120000);await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="both";localStorage.setItem("atlas-conf",JSON.stringify(c))}}}catch(e){}});
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts\.g/.test(m.text()))errs.push(m.text())});
await p.goto(BASE);await p.waitForTimeout(700);
const red=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--target').trim().toLowerCase());
// choose purple in Configurações
await p.evaluate(()=>setTab("conf"));await p.waitForTimeout(300);
await p.tap('[data-cf="accent"][data-v="#8B5CF6"]');await p.waitForTimeout(300);
await p.screenshot({path:`${OUT}/cor-destaque-${th}-1-config.png`});
const want=th==='dark'?await p.evaluate(()=>accMix("#8b5cf6","#ffffff",.12)):"#8b5cf6";
const S=()=>p.evaluate(()=>{const cs=e=>e&&getComputedStyle(e);const r=getComputedStyle(document.documentElement);
  const d=document.createElement("button");d.className="btn danger";document.body.appendChild(d);const dc=cs(d).color;d.remove();
  return {t:r.getPropertyValue('--target').trim().toLowerCase(),k1:r.getPropertyValue('--k1').trim().toLowerCase(),syn:r.getPropertyValue('--syn').trim().toLowerCase(),
    title:cs(document.querySelector(".brand h1 b")).color,tab:cs(document.querySelector('.btabs button[aria-current="page"]'))?.color,
    logo:cs(document.querySelector("#lgR stop")).stopColor,danger:dc}});
let s=await S();console.log(th,'roxo',JSON.stringify(s));
if(s.t!==want||s.k1!==want||hex(s.title)!==want||hex(s.danger)!==red||hex(s.logo)==="#f45a60")bad++;
// Atlas 2D: the chosen muscle is purple
await p.evaluate(()=>{setTab("atlas");set3D(false)});await p.waitForTimeout(300);
await p.evaluate(()=>selectMuscle("peito_medial"));await p.waitForTimeout(300);
const m=await p.evaluate(()=>{const g=document.querySelector("#gT stop:nth-child(2)");return {on:!!document.querySelector('[data-m].on'),stop:getComputedStyle(g).stopColor,eb:getComputedStyle(document.querySelector(".eyebrow")).color}});
console.log(' 2D',JSON.stringify(m));if(!m.on||hex(m.stop)!==want||hex(m.eb)!==want)bad++;
await p.evaluate(()=>{peek=true;render()});await p.waitForTimeout(400);await p.screenshot({path:`${OUT}/cor-destaque-${th}-2-atlas2d.png`});
// Atlas 3D: the chosen muscle is purple, and changes live when the colour changes
await p.evaluate(()=>set3D(true));
await p.waitForFunction(()=>window.V3&&document.getElementById('v3load').hidden&&V3.keys().length>30,null,{timeout:90000}).catch(()=>{console.log(' 3D não carregou');bad++});
await p.evaluate(()=>{selectMuscle("peito_medial");peek=true;render()});await p.waitForTimeout(800);
let c3=await p.evaluate(()=>V3.color(cur));console.log(' 3D',c3);if(c3!==want)bad++;
await p.screenshot({path:`${OUT}/cor-destaque-${th}-3-atlas3d.png`});
await p.evaluate(()=>{CONF.accent="#2FA866";saveConf();applyConf()});await p.waitForTimeout(400);
const g=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--target').trim().toLowerCase());
c3=await p.evaluate(()=>V3.color(cur));console.log(' 3D verde',c3,g);if(c3!==g)bad++;
// orange: synergists turn yellow so they don't look like the target
await p.evaluate(()=>{CONF.accent="#F07818";saveConf();applyConf()});await p.waitForTimeout(200);
s=await S();console.log(' laranja',s.t,'sinergistas',s.syn);if(!/^#(d9a400|f2c94c)$/.test(s.syn))bad++;
// Stories card still works with an accent
const card=await p.evaluate(async()=>{CONF.accent="#8B5CF6";saveConf();applyConf();const bl=await makeCard("week");return bl?await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(bl)}):null});
if(!card)bad++;else fs.writeFileSync(`${OUT}/cor-destaque-${th}-4-stories.png`,Buffer.from(card.split(",")[1],"base64"));
// back to red: no overrides left
await p.evaluate(()=>setTab("conf"));await p.waitForTimeout(300);await p.tap('[data-cf="accent"][data-v=""]');await p.waitForTimeout(300);
s=await S();console.log(' vermelho',JSON.stringify(s));if(s.t!==red||await p.evaluate(()=>document.documentElement.style.cssText.includes("--target")))bad++;
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
