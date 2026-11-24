/* Imagens para as lojas (Play Store / App Store): docs/loja/imagens/
   - <idioma>-<n>-<tela>.png  1080×1920 (9:16): frase no topo + a tela do app (tema escuro, dados de exemplo)
   - destaque-<idioma>.png    1024×500 (imagem de destaque da Play Store)
   - icone-512.png            512×512 (ícone da Play Store)
   Uso: python3 -m http.server 8765 &  depois  node tools/loja-shots.js   (LANGS=pt,en,es) */
const BASE=process.env.BASE||"http://localhost:8765/";
const path=require("path"),fs=require("fs");
const OUT=path.join(__dirname,"..","docs","loja","imagens"),RAW=path.join(__dirname,"..","tests","out","loja");
fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(RAW,{recursive:true});
const {chromium}=require("playwright");const seed=require("./demo-seed.js");
const CAP={
  atlas:["Toque no músculo. Veja os melhores exercícios.","Tap a muscle. See the best exercises.","Toca un músculo. Mira los mejores ejercicios."],
  ex:["Cada variação muda o músculo que trabalha","Every variation changes the muscle you work","Cada variación cambia el músculo que trabajas"],
  prontos:["3 perguntas e sua semana de treino fica pronta","3 questions and your training week is ready","3 preguntas y tu semana de entreno está lista"],
  live:["Treine ao vivo: séries, descanso e recordes","Train live: sets, rest timer and PRs","Entrena en vivo: series, descanso y récords"],
  prog:["Veja os músculos que você treinou na semana","See which muscles you trained this week","Mira los músculos que entrenaste en la semana"],
  rank:["Descubra seu nível de força, de Ameba a Bizarro","Find your strength level, from Amoeba to Freak","Tu nivel de fuerza, de Ameba a Fenómeno"],
  ach:["Mais de 90 conquistas para manter o ritmo","90+ achievements to keep you going","Más de 90 logros para no parar"]};
const TAG=["Treino, músculos e progresso","Workouts, muscles and progress","Entreno, músculos y progreso"];
const LI={pt:0,en:1,es:2};

(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];
for(const lang of (process.env.LANGS||"pt,en,es").split(",")){const L=LI[lang];
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,timezoneId:"America/Sao_Paulo",colorScheme:"dark",locale:{pt:"pt-BR",en:"en-US",es:"es-ES"}[lang]});
  const p=await ctx.newPage();p.setDefaultTimeout(120000);p.on("pageerror",e=>errs.push(e.message));
  await p.clock.setFixedTime(new Date("2026-10-31T10:00:00-03:00"));
  await p.goto(BASE);await p.waitForTimeout(300);
  await p.evaluate(seed);await p.evaluate(l=>localStorage.setItem("atlas-conf",JSON.stringify({lang:l,theme:"dark",name:""})),lang);
  await p.reload();await p.waitForTimeout(600);
  await p.waitForFunction(()=>window.V3&&document.getElementById("v3load").hidden,null,{timeout:120000});await p.waitForTimeout(800);
  const top=async sel=>{await p.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return;let s=el.parentElement;while(s&&!(s.scrollHeight>s.clientHeight+4&&/(auto|scroll)/.test(getComputedStyle(s).overflowY)))s=s.parentElement;if(!s)return;
      const hb=document.querySelector("header").getBoundingClientRect().bottom;s.scrollTop+=el.getBoundingClientRect().top-hb-10},sel);await p.waitForTimeout(200)};
  const raw={};const shot=async k=>{await p.evaluate(()=>{for(const id of ["restPill","toast"]){const e=document.getElementById(id);if(e)e.style.visibility="hidden"}});const f=path.join(RAW,`${lang}-${k}.png`);await p.screenshot({path:f});raw[k]=f};
  await p.evaluate(()=>{setTab("atlas");selectMuscle("peito_medial");peek=true;render()});await p.waitForTimeout(1800);await shot("atlas");
  { const st=await p.addStyleTag({content:"#v3hint,.v3cred,.v3>*:not(canvas){visibility:hidden!important}"});
    const bx=await p.evaluate(()=>{const r=document.getElementById("v3").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}});
    const f=path.join(RAW,`${lang}-fig.png`);await p.screenshot({path:f,clip:bx});raw.fig=f;await st.evaluate(e=>e.remove()); }
  await p.evaluate(()=>{selectExercise(0)});await p.waitForTimeout(400);await p.evaluate(()=>{peek=false;render()});await p.waitForTimeout(500);await shot("ex");
  await p.evaluate(()=>{curEx=null;document.getElementById("clear").click()});
  await p.evaluate(()=>{fView="prontos";rtMus=null;rtTp="";rtSrc="";rtLv="b";rtQ={d:3,g:"h"};rtQi=0;rtOpen=null;setTab("ficha")});await p.waitForTimeout(500);
  await top(".rt-q");await shot("prontos");
  await p.evaluate(()=>setTab("treino"));await p.waitForTimeout(200);
  await p.click('[data-hv="live"]');await p.waitForTimeout(200);await p.click('[data-lv="start"]');await p.waitForTimeout(300);
  await p.click('[data-lv="setDone"]');await p.waitForTimeout(300);await p.click('[data-lv="setDone"]');await p.waitForTimeout(500);
  await p.evaluate(()=>{const w=liveW();w.start-=(23*60+41)*1000;saveW();renderTreino();document.getElementById("tab-treino").scrollTop=0});await p.waitForTimeout(400);await shot("live");
  await p.click('[data-rp="stop"]').catch(()=>{});
  await p.evaluate(()=>{pView="mus";setTab("prog")});await p.waitForTimeout(500);
  await p.waitForFunction(()=>!window.P3||!P3busy,null,{timeout:120000});await p.waitForTimeout(1500);await shot("prog");
  await p.evaluate(()=>{pView="kg";setTab("prog")});await p.waitForTimeout(1800);await top("#tab-prog .rk-hero");await shot("rank");
  await p.evaluate(()=>setTab("ach"));await p.waitForTimeout(500);await shot("ach");
  await ctx.close();
  // composição 1080×1920
  const c=await b.newContext({viewport:{width:1080,height:1920},deviceScaleFactor:1});const q=await c.newPage();await q.goto(BASE+"suporte.html");
  const img=f=>"data:image/png;base64,"+fs.readFileSync(f).toString("base64");
  const CSS=`<link rel="stylesheet" href="${BASE}fonts/fonts.css"><style>*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;overflow:hidden;background:#07080A;color:#F4F5F7;font-family:Barlow,sans-serif;position:relative}
    .glow{position:absolute;inset:-200px -100px auto;height:900px;background:radial-gradient(60% 55% at 50% 30%,rgba(255,45,61,.28),rgba(255,45,61,0) 70%)}
    .grid{position:absolute;inset:auto 0 0;height:700px;background:linear-gradient(transparent,#07080A 90%),repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 2px,transparent 2px 90px),repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 2px,transparent 2px 90px)}
    h1{position:relative;font:italic 900 82px/0.98 "Barlow Condensed",sans-serif;text-transform:uppercase;letter-spacing:.005em;padding:110px 80px 0;text-wrap:balance}
    h1::before{content:"";display:inline-block;width:20px;height:.78em;background:#FF2D3D;transform:skewX(-14deg);margin-right:26px;vertical-align:-.04em}
    .ph{position:absolute;left:50%;top:330px;transform:translateX(-50%);width:720px;border-radius:64px;overflow:hidden;border:3px solid #23262D;box-shadow:0 40px 120px rgba(0,0,0,.7),0 0 0 14px #111317,0 0 0 16px #2A2D34}
    .ph img{display:block;width:100%}</style>`;
  let n=0;for(const k of Object.keys(CAP)){n++;
    await q.setContent(`<!doctype html><html><head><meta charset="utf-8">${CSS}</head><body><div class="glow"></div><div class="grid"></div><h1>${CAP[k][L]}</h1><div class="ph"><img src="${img(raw[k])}"></div></body></html>`);
    await q.evaluate(async()=>{try{await document.fonts.load('italic 900 82px "Barlow Condensed"');}catch(e){}await document.fonts.ready;const ph=document.querySelector('.ph');ph.style.top=Math.max(330,Math.round(document.querySelector('h1').getBoundingClientRect().bottom+60))+'px'});await q.waitForTimeout(200);
    await q.screenshot({path:path.join(OUT,`${lang}-${n}-${k}.png`)})}
  // imagem de destaque 1024×500
  await q.setViewportSize({width:1024,height:500});
  await q.setContent(`<!doctype html><html><head><meta charset="utf-8">${CSS.replace("width:1080px;height:1920px","width:1024px;height:500px")}<style>
    .fg{display:flex;align-items:center;height:500px;padding:0 0 0 70px;position:relative}.fg .t{flex:1;z-index:1}.logo{width:120px;height:120px;background:url(${BASE}logo.png) center/contain no-repeat;margin-bottom:10px}
    .nm{font:italic 900 104px/0.9 "Barlow Condensed",sans-serif;letter-spacing:.01em}.nm i{color:#FF2D3D}.tg{font:600 30px Barlow,sans-serif;color:#C9CED6;margin-top:14px}
    .fig{width:460px;height:500px;background:url(${img(raw.fig)}) 50% 50%/auto 470px no-repeat;-webkit-mask:radial-gradient(50% 50% at 50% 50%,#000 75%,transparent 100%)}</style></head>
    <body><div class="glow" style="inset:-300px 0 auto auto;width:800px;height:900px"></div><div class="fg"><div class="t"><div class="logo"></div><div class="nm">MUSCLE <i>ATLAS</i></div><div class="tg">${TAG[L]}</div></div><div class="fig"></div></div></body></html>`);
  await q.evaluate(async()=>{try{await document.fonts.load('italic 900 104px "Barlow Condensed"');await document.fonts.load('600 30px Barlow');}catch(e){}await document.fonts.ready});await q.waitForTimeout(300);await q.screenshot({path:path.join(OUT,`destaque-${lang}.png`)});
  await c.close();console.log(lang,"ok")}
fs.copyFileSync(path.join(__dirname,"..","icon-512.png"),path.join(OUT,"icone-512.png"));
console.log("errs",errs);await b.close()})();
