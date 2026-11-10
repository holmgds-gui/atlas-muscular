/* Boneco do Atlas (pedido do dono, 0.17): o app abre no 3D sem o botão 2D/3D; em Configurações › Boneco do Atlas,
   "Só 2D" volta para o 2D, "2D e 3D" mostra o botão no canto do boneco e "Só 3D" esconde de novo.
   Sem internet no teste, use THREE_DIR=<pasta do three@0.160.0>. Celular, claro e escuro. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const path=require("path"),fs=require("fs");
let TD=process.env.THREE_DIR;try{if(!TD)TD=path.dirname(require.resolve("three/package.json"))}catch(e){}
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR'});
if(TD)await ctx.route("https://cdn.jsdelivr.net/npm/three@0.160.0/**",r=>{const f=path.join(TD,new URL(r.request().url()).pathname.replace("/npm/three@0.160.0/",""));
  fs.existsSync(f)?r.fulfill({path:f,contentType:"application/javascript"}):r.abort()});
const p=await ctx.newPage();p.setDefaultTimeout(120000);await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);
await p.waitForFunction(()=>window.V3&&document.getElementById('v3load').hidden,null,{timeout:90000}).catch(()=>{console.log('3D não abriu sozinho');bad++});
const st=()=>p.evaluate(()=>({fig:CONF.fig,on:v3on,v3:!document.getElementById('v3').hidden,btn:!document.getElementById('b3d').hidden}));
let s=await st();console.log(th,'ao abrir',JSON.stringify(s));if(s.fig!=='3d'||!s.on||!s.v3||s.btn)bad++;
await p.waitForTimeout(600);await p.screenshot({path:`${OUT}/boneco-padrao-${th}-1-abre-3d.png`});
// Configurações › Boneco do Atlas
await p.evaluate(()=>setTab('conf'));await p.waitForTimeout(400);
const row=await p.$('[data-cf="fig"]');if(!row){console.log('opção não aparece');bad++}
await p.evaluate(()=>document.querySelector('[data-cf="fig"]').scrollIntoView({block:'center'}));await p.waitForTimeout(200);
await p.screenshot({path:`${OUT}/boneco-padrao-${th}-2-config.png`});
await p.tap('[data-cf="fig"][data-v="2d"]');await p.waitForTimeout(300);s=await st();console.log(' só 2D',JSON.stringify(s));if(s.fig!=='2d'||s.on||s.v3||s.btn)bad++;
await p.tap('[data-cf="fig"][data-v="both"]');await p.waitForTimeout(300);s=await st();console.log(' 2D e 3D',JSON.stringify(s));if(!s.btn)bad++;
await p.evaluate(()=>setTab('atlas'));await p.waitForTimeout(500);await p.screenshot({path:`${OUT}/boneco-padrao-${th}-3-ambos.png`});
// the button switches
const was=s.on;await p.tap('#b3d');await p.waitForTimeout(400);s=await st();if(s.on===was)bad++;
// back to "só 3D": 3D on, no button
await p.evaluate(()=>setTab('conf'));await p.waitForTimeout(300);await p.tap('[data-cf="fig"][data-v="3d"]');await p.waitForTimeout(400);
s=await st();console.log(' só 3D',JSON.stringify(s));if(!s.on||s.btn)bad++;
// saved: a reload opens the same way
await p.evaluate(()=>{CONF.fig='2d';saveConf()});await p.reload();await p.waitForTimeout(800);s=await st();console.log(' recarregou (2D)',JSON.stringify(s));if(s.on||s.btn)bad++;
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
