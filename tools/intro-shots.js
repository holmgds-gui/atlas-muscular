/* Prints do carrossel de boas-vindas (intro/<idioma>-<tema>-<tela>.webp).
   Uso: python3 -m http.server 8765 &  depois  node tools/intro-shots.js
   Gera PNGs em tests/out/intro/ e converte para WebP com Python (Pillow) em intro/.
   O Atlas abre em 3D (0.17): sem internet, use THREE_DIR=<pasta do three@0.160.0>. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";
const path=require("path"),fs=require("fs"),{execFileSync}=require("child_process");
const RAW=path.join(__dirname,"..","tests","out","intro"),DST=path.join(__dirname,"..","intro");
fs.mkdirSync(RAW,{recursive:true});fs.mkdirSync(DST,{recursive:true});
const {chromium}=require("playwright");
// parte da tela usada em cada print (px CSS, tela de 390 × 844)
const CLIP_H=600; // abaixo do cabeçalho, que se repete em todas
const ONLY=process.env.ONLY;

const seed=require("./demo-seed.js");

let TD=process.env.THREE_DIR;try{if(!TD)TD=path.dirname(require.resolve("three/package.json"))}catch(e){}
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];
for(const lang of (process.env.LANGS||"pt,en,es").split(","))for(const theme of (process.env.THEMES||"light,dark").split(",")){
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:"America/Sao_Paulo",colorScheme:theme,locale:{pt:"pt-BR",en:"en-US",es:"es-ES"}[lang]});
  if(TD)await ctx.route("https://cdn.jsdelivr.net/npm/three@0.160.0/**",r=>{const f=path.join(TD,new URL(r.request().url()).pathname.replace("/npm/three@0.160.0/",""));
    fs.existsSync(f)?r.fulfill({path:f,contentType:"application/javascript"}):r.abort()});
  const p=await ctx.newPage();p.setDefaultTimeout(120000);p.on("pageerror",e=>errs.push(e.message));
  await p.clock.setFixedTime(new Date("2026-10-31T10:00:00-03:00"));
  await p.goto(BASE);await p.waitForTimeout(300);
  await p.evaluate(seed);await p.evaluate(l=>localStorage.setItem("atlas-conf",JSON.stringify({lang:l})),lang);
  await p.reload();await p.waitForTimeout(600);
  await p.waitForFunction(()=>window.V3&&document.getElementById("v3load").hidden,null,{timeout:120000});await p.waitForTimeout(800);
  const top=async sel=>{await p.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return;let s=el.parentElement;while(s&&!(s.scrollHeight>s.clientHeight+4&&/(auto|scroll)/.test(getComputedStyle(s).overflowY)))s=s.parentElement;if(!s)return;
      const hb=document.querySelector("header").getBoundingClientRect().bottom;s.scrollTop+=el.getBoundingClientRect().top-hb-10},sel);await p.waitForTimeout(150)};
  const shot=async k=>{if(ONLY&&!ONLY.split(",").includes(k))return;const y=await p.evaluate(()=>Math.round(document.querySelector("header").getBoundingClientRect().bottom)),h=CLIP_H;const f=path.join(RAW,`${lang}-${theme}-${k}.png`);
    await p.screenshot({path:f,clip:{x:0,y,width:390,height:h}});
    execFileSync("python3",["-I","-c","import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im=im.resize((540,round(im.height*540/im.width)),Image.LANCZOS);im.save(sys.argv[2],'WEBP',quality=74,method=6)",f,path.join(DST,`${lang}-${theme}-${k}.webp`)])};
  // 1. Atlas (3D): músculo escolhido
  await p.evaluate(()=>{setTab("atlas");selectMuscle("peito_medial");peek=true;render()});await p.waitForTimeout(1500);await shot("atlas");
  // 2. exercício aberto (sinergistas e variações)
  await p.evaluate(()=>{selectExercise(0)});await p.waitForTimeout(400);
  await p.evaluate(()=>{peek=false;render()});await p.waitForTimeout(300);await shot("ex");
  // 2a. modos do Atlas: Grupos (cores por grupo no 3D)
  await p.evaluate(()=>{curEx=null;document.getElementById("clear").click();setMode("grp")});await p.waitForTimeout(1500);await shot("modos");
  // 2b. Atlas › Cardio: lista e um cardio aberto (músculos no boneco)
  await p.evaluate(()=>{curEx=null;setMode("cd");cdInt="m";cdMin=30;cdSel="run";paint();render()});await p.waitForTimeout(1500);await shot("cardio");
  await p.evaluate(()=>{cdOn=false;cdSel=null;peek=false;render()});
  // 3. Treinos prontos: "Qual treino é para mim?" respondido (3 dias, iniciante, ganhar músculo)
  await p.evaluate(()=>{fView="prontos";rtMus=null;rtTp="";rtSrc="";rtLv="b";rtQ={d:3,g:"h"};rtQi=0;rtOpen=null;setTab("ficha")});await p.waitForTimeout(400);
  await p.evaluate(()=>{document.querySelector(".rt-q .rt-qq:nth-of-type(3)")?.setAttribute("data-shot","1")||document.querySelector(".rt-q").setAttribute("data-shot","1")});await top("[data-shot]");await shot("prontos");
  // 4. Ao vivo: começa o Superior A e faz uma série
  await p.evaluate(()=>{setTab("treino")});await p.waitForTimeout(200);
  await p.click('[data-hv="live"]');await p.waitForTimeout(200);
  await p.click('[data-lv="start"]');await p.waitForTimeout(300);
  await p.click('[data-lv="setDone"]');await p.waitForTimeout(300);
  await p.click('[data-lv="setDone"]');await p.waitForTimeout(500);
  await p.evaluate(()=>{const w=liveW();w.start-=(23*60+41)*1000;saveW();renderTreino();document.getElementById("tab-treino").scrollTop=0});await p.waitForTimeout(300);await top(".hview");await shot("live");
  await p.click('[data-rp="stop"]').catch(()=>{});
  // 5. Progresso › Músculos
  await p.evaluate(()=>{pView="mus";setTab("prog")});await p.waitForTimeout(500);
  await p.waitForFunction(()=>!window.P3||!P3busy,null,{timeout:120000});await p.waitForTimeout(1200);await top("#tab-prog .pview");await shot("prog");
  await top("#tab-prog .cbox");await shot("cprog");
  // 6. Progresso › Força (ranking)
  await p.evaluate(()=>{pView="kg";setTab("prog")});await p.waitForTimeout(1500);await top("#tab-prog .rk-hero");await shot("rank");
  // 7. Conquistas
  await p.evaluate(()=>setTab("ach"));await p.waitForTimeout(400);await top("#tab-ach .ach-top");await shot("ach");
  await ctx.close();console.log(lang,theme,"ok");
}
console.log("errs",errs.filter(e=>!/TUNNEL/.test(e)));await b.close()})();
