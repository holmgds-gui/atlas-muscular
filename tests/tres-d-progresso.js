/* 3D no app todo (pedido do dono, 0.18): Progresso › Músculos e Força mostram o boneco 3D (girável, botão Frente/Costas),
   pintado pelas séries (mapa de calor) e pelos níveis do ranking; tocar num músculo mostra o nome e o número; o cartão
   para Stories usa uma foto do 3D. Com "2D e 3D" cada boneco tem o botão de trocar; com "Só 2D" fica o desenho 2D.
   Sem internet no teste, use THREE_DIR=<pasta do three@0.160.0>. Celular, claro e escuro. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const path=require("path"),fs=require("fs");
let TD=process.env.THREE_DIR;try{if(!TD)TD=path.dirname(require.resolve("three/package.json"))}catch(e){}
const {chromium}=require('playwright');
const seed=()=>{const R=(id)=>{const f=FAMBY[id];return [vName(f,f.d),mkRef(f,f.d)]};
  const it=(id,n,r,kg)=>{const x=R(id);return {name:x[0],ref:x[1],target:"8-12",notes:"",sets:Array.from({length:n},()=>({r:String(r),kg:String(kg)}))}};
  const d=new Date();const iso=isoDate(d);
  localStorage.setItem("atlas-workouts",JSON.stringify([{id:"w1",date:iso,title:"Superior",planId:null,done:true,notes:"",items:[it("supino",4,8,80),it("rosca",3,10,30),it("remcurv",4,8,70)]}]));
  localStorage.setItem("atlas-rank",JSON.stringify({bw:80,man:[]}))};
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
if(TD)await ctx.route("https://cdn.jsdelivr.net/npm/three@0.160.0/**",r=>{const f=path.join(TD,new URL(r.request().url()).pathname.replace("/npm/three@0.160.0/",""));
  fs.existsSync(f)?r.fulfill({path:f,contentType:"application/javascript"}):r.abort()});
const p=await ctx.newPage();p.setDefaultTimeout(120000);await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});
p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(500);await p.evaluate(seed);await p.reload();await p.waitForTimeout(800);
// Progresso › Músculos
await p.evaluate(()=>{pView="mus";pMode="week";setTab("prog")});
await p.waitForFunction(()=>window.P3&&!P3busy,null,{timeout:120000}).catch(()=>{console.log('3D do Progresso não abriu');bad++});
await p.waitForTimeout(800);
let s=await p.evaluate(()=>({in:$("pfigBox").contains(P3EL),c:P3.color("peito_medial"),plain:P3.color("panturrilha_gastro"),view:P3EL.querySelector('[data-p3="view"]').textContent,two:!P3EL.querySelector('[data-p3="2d"]').hidden}));
console.log(th,'progresso',JSON.stringify(s));if(!s.in||!s.c||s.c===s.plain||s.two)bad++;
await p.evaluate(()=>document.getElementById("pfigBox").scrollIntoView({block:"center"}));await p.waitForTimeout(400);
await p.screenshot({path:`${OUT}/tres-d-progresso-${th}-1-musculos.png`});
// tap the chest → name + sets on top
const pt=await p.evaluate(()=>P3.at('peito_medial'));await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(400);
const tip=await p.evaluate(()=>{const t=P3EL.querySelector(".p3tip");return t.hidden?"":t.textContent});console.log(' toque',tip);if(!/séries/.test(tip))bad++;
// Frente/Costas
await p.tap('[data-p3="view"]');await p.waitForTimeout(800);const v2=await p.evaluate(()=>P3EL.querySelector('[data-p3="view"]').textContent);console.log(' virou',v2);if(!/Costas/i.test(v2))bad++;
await p.screenshot({path:`${OUT}/tres-d-progresso-${th}-2-costas.png`});
// Força: the same viewer, level colours
await p.evaluate(()=>{pView="kg";renderProg()});await p.waitForTimeout(1200);
s=await p.evaluate(()=>({in:!!$("rkFigBox")&&$("rkFigBox").contains(P3EL),c:P3.color("peito_medial"),plain:P3.color("panturrilha_gastro")}));console.log(' força',JSON.stringify(s));if(!s.in||s.c===s.plain)bad++;
await p.evaluate(()=>document.getElementById("rkFigBox").scrollIntoView({block:"center"}));await p.waitForTimeout(400);
await p.screenshot({path:`${OUT}/tres-d-progresso-${th}-3-forca.png`});
// Stories: a picture of the 3D
const sh=await p.evaluate(async()=>{const c=await p3shot(p3Prog(tally(pRange(),true).mus,BANDS[pMode]));return c?[c.width,c.height,c.toDataURL("image/png").length]:null});
console.log(' foto 3D',JSON.stringify(sh));if(!sh||sh[2]<20000)bad++;
const card=await p.evaluate(async()=>{const bl=await makeCard("week");if(!bl)return null;return await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(bl)})});
if(!card)bad++;else fs.writeFileSync(`${OUT}/tres-d-progresso-${th}-4-stories.png`,Buffer.from(card.split(",")[1],"base64"));
// "2D e 3D": a 2D button on the 3D; it goes to the 2D figure with a 3D button
await p.evaluate(()=>{CONF.fig="both";saveConf();pView="mus";renderProg()});await p.waitForTimeout(500);
await p.evaluate(()=>P3EL.querySelector('[data-p3="2d"]').click());await p.waitForTimeout(400);
s=await p.evaluate(()=>({flat:!!document.querySelector("#pfigBox .pfig"),sw:!!document.querySelector("#pfigBox .p3sw")}));console.log(' 2D e 3D → 2D',JSON.stringify(s));if(!s.flat||!s.sw)bad++;
await p.evaluate(()=>document.querySelector("#pfigBox .p3sw").click());await p.waitForTimeout(500);if(!await p.evaluate(()=>$("pfigBox").contains(P3EL)))bad++;
// "Só 2D": the 2D figure, no buttons
await p.evaluate(()=>{CONF.fig="2d";saveConf();renderProg()});await p.waitForTimeout(400);
s=await p.evaluate(()=>({flat:!!document.querySelector("#pfigBox .pfig"),sw:!!document.querySelector("#pfigBox .p3sw")}));console.log(' só 2D',JSON.stringify(s));if(!s.flat||s.sw)bad++;
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
