/* Prints do carrossel de boas-vindas (intro/<idioma>-<tema>-<tela>.webp).
   Uso: python3 -m http.server 8765 &  depois  node tools/intro-shots.js
   Gera PNGs em tests/out/intro/ e converte para WebP com Python (Pillow) em intro/. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";
const path=require("path"),fs=require("fs"),{execFileSync}=require("child_process");
const RAW=path.join(__dirname,"..","tests","out","intro"),DST=path.join(__dirname,"..","intro");
fs.mkdirSync(RAW,{recursive:true});fs.mkdirSync(DST,{recursive:true});
const {chromium}=require("playwright");
// parte da tela usada em cada print (px CSS, tela de 390 × 844)
const CLIP_H=600; // abaixo do cabeçalho, que se repete em todas
const ONLY=process.env.ONLY;

const seed=()=>{
  localStorage.clear();
  const R=(id,sel={})=>{const f=FAMBY[id];const s={...f.d,...sel};return [vName(f,s),mkRef(f,s)]};
  const it=(id,sets,t="8-12")=>{const x=R(id);return {name:x[0],ref:x[1],target:t,notes:"",sets:sets.map(([r,kg])=>({r:String(r),kg:String(kg)}))}};
  const pl=(id,s,r)=>{const x=R(id);return {name:x[0],ref:x[1],sets:s,reps:r}};
  const S=(n,r,kg)=>Array.from({length:n},()=>[r,kg]);
  const A=f=>[it("supino",S(4,8,80*f)),it("remcurv",S(4,8,70*f)),it("desenv",S(3,8,45*f)),it("puxada",S(3,10,60*f)),it("rosca",S(3,10,30*f),"10-15"),it("pushdown",S(3,12,30*f),"10-15")];
  const B=f=>[it("agach",S(4,6,100*f)),it("stiff",S(3,8,80*f)),it("legpress",S(3,12,200*f),"10-15"),it("flexora",S(3,12,45*f),"10-15"),it("pant",S(4,15,80*f),"12-20"),it("crunch",S(3,15,0),"12-20")];
  const C=f=>[it("barrafixa",S(4,8,0)),it("elevlat",S(4,15,10*f),"12-20"),it("crucifixo",S(3,12,16*f),"10-15"),it("remapoiada",S(3,10,26*f)),it("frances",S(3,12,20*f),"10-15"),it("encolh",S(3,12,60*f),"10-15")];
  const D=f=>[it("terra",S(3,5,140*f),"4-6"),it("hipthrust",S(3,10,120*f)),it("extensora",S(3,12,50*f),"10-15"),it("afundo",S(3,10,20*f)),it("pant",S(3,15,80*f),"12-20"),it("prancha",S(3,1,0))];
  const day=o=>{const d=new Date();d.setDate(d.getDate()-o);return isoDate(d)};
  const W=[];let id=0;
  // hoje = sábado: seg (5), ter (4), qui (2), sex (1); e as 3 semanas anteriores com cargas um pouco menores
  for(const [wk,f] of [[0,1],[1,.95],[2,.92],[3,.9]]){
    for(const [o,t,fn] of [[5,"Superior A",A],[4,"Inferior A",B],[2,"Superior B",C],[1,"Inferior B",D]])
      W.push({id:"w"+(id++),date:day(o+wk*7),title:t,planId:"p"+t,done:true,notes:"",items:fn(f)});
  }
  localStorage.setItem("atlas-workouts",JSON.stringify(W));
  const P=[["Superior A",[pl("supino",4,"6-10"),pl("remcurv",4,"6-10"),pl("desenv",3,"8-12"),pl("puxada",3,"8-12"),pl("rosca",3,"10-15"),pl("pushdown",3,"10-15")]],
    ["Inferior A",[pl("agach",4,"6-10"),pl("stiff",3,"8-12"),pl("legpress",3,"10-15"),pl("flexora",3,"10-15"),pl("pant",4,"12-20")]]];
  localStorage.setItem("atlas-plans",JSON.stringify(P.map(([n,items],i)=>({id:"p"+n,name:n,days:i?[1,4]:[0,3],items}))));
  localStorage.setItem("atlas-rank",JSON.stringify({bw:80,man:[]}));
  localStorage.setItem("atlas-intro","1");
};

(async()=>{const b=await chromium.launch();const errs=[];
for(const lang of (process.env.LANGS||"pt,en,es").split(","))for(const theme of (process.env.THEMES||"light,dark").split(",")){
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:"America/Sao_Paulo",colorScheme:theme,locale:{pt:"pt-BR",en:"en-US",es:"es-ES"}[lang]});
  const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
  await p.clock.setFixedTime(new Date("2026-10-31T10:00:00-03:00"));
  await p.goto(BASE);await p.waitForTimeout(300);
  await p.evaluate(seed);await p.evaluate(l=>localStorage.setItem("atlas-conf",JSON.stringify({lang:l})),lang);
  await p.reload();await p.waitForTimeout(600);
  const top=async sel=>{await p.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return;let s=el.parentElement;while(s&&!(s.scrollHeight>s.clientHeight+4&&/(auto|scroll)/.test(getComputedStyle(s).overflowY)))s=s.parentElement;if(!s)return;
      const hb=document.querySelector("header").getBoundingClientRect().bottom;s.scrollTop+=el.getBoundingClientRect().top-hb-10},sel);await p.waitForTimeout(150)};
  const shot=async k=>{if(ONLY&&!ONLY.split(",").includes(k))return;const y=await p.evaluate(()=>Math.round(document.querySelector("header").getBoundingClientRect().bottom)),h=CLIP_H;const f=path.join(RAW,`${lang}-${theme}-${k}.png`);
    await p.screenshot({path:f,clip:{x:0,y,width:390,height:h}});
    execFileSync("python3",["-I","-c","import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im=im.resize((540,round(im.height*540/im.width)),Image.LANCZOS);im.save(sys.argv[2],'WEBP',quality=74,method=6)",f,path.join(DST,`${lang}-${theme}-${k}.webp`)])};
  // 1. Atlas: músculo escolhido
  await p.evaluate(()=>{setTab("atlas");selectMuscle("peito_medial");peek=true;render()});await p.waitForTimeout(500);await shot("atlas");
  // 2. exercício aberto (sinergistas e variações)
  await p.evaluate(()=>{selectExercise(0)});await p.waitForTimeout(400);
  await p.evaluate(()=>{peek=false;render()});await p.waitForTimeout(300);await shot("ex");
  // 3. Treinos prontos
  await p.evaluate(()=>{fView="prontos";rtMus=null;rtOpen=null;rtOpen=RT.find(w=>w.lv==="b").id;setTab("ficha")});await p.waitForTimeout(300);await top(".rt-w.open");await shot("prontos");
  // 4. Ao vivo: começa o Superior A e faz uma série
  await p.evaluate(()=>{setTab("treino")});await p.waitForTimeout(200);
  await p.click('[data-hv="live"]');await p.waitForTimeout(200);
  await p.click('[data-lv="start"]');await p.waitForTimeout(300);
  await p.click('[data-lv="setDone"]');await p.waitForTimeout(300);
  await p.click('[data-lv="setDone"]');await p.waitForTimeout(500);
  await p.evaluate(()=>{const w=liveW();w.start-=(23*60+41)*1000;saveW();renderTreino();document.getElementById("tab-treino").scrollTop=0});await p.waitForTimeout(300);await top(".hview");await shot("live");
  await p.click('[data-rp="stop"]').catch(()=>{});
  // 5. Progresso › Músculos
  await p.evaluate(()=>{pView="mus";setTab("prog")});await p.waitForTimeout(500);await top("#tab-prog .pview");await shot("prog");
  // 6. Progresso › Força (ranking)
  await p.evaluate(()=>{pView="kg";setTab("prog")});await p.waitForTimeout(600);await top("#tab-prog .rk-hero");await shot("rank");
  // 7. Conquistas
  await p.evaluate(()=>{pView="ach";setTab("prog")});await p.waitForTimeout(400);await top("#tab-prog .pview");await shot("ach");
  await ctx.close();console.log(lang,theme,"ok");
}
console.log("errs",errs.filter(e=>!/TUNNEL/.test(e)));await b.close()})();
