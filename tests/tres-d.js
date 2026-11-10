/* Boneco 3D no Atlas (pedido do dono): botão "3D" no canto de baixo do boneco; tocar num músculo funciona igual ao 2D
   (vermelho + lista; exercício pinta sinergistas de laranja); Grupos e Cardio pintam o 3D; Articulações volta ao 2D;
   com ♀ aparece o aviso "Modelo 3D masculino". Também confere que o ⤢ sumiu no celular e que dois toques voltam o zoom.
   O Three.js vem do jsDelivr; sem internet no teste, use THREE_DIR=<pasta do pacote three@0.160.0>. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const path=require("path"),fs=require("fs");
let TD=process.env.THREE_DIR;try{if(!TD)TD=path.dirname(require.resolve("three/package.json"))}catch(e){}
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR'});
if(TD)await ctx.route("https://cdn.jsdelivr.net/npm/three@0.160.0/**",r=>{const f=path.join(TD,new URL(r.request().url()).pathname.replace("/npm/three@0.160.0/",""));
  fs.existsSync(f)?r.fulfill({path:f,contentType:"application/javascript"}):r.abort()});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-sex","m")}catch(e){}});
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts\.g/.test(m.text()))errs.push(m.text())});
await p.goto(BASE);await p.waitForTimeout(700);
// the ⤢ square is gone on the phone
const zr=await p.evaluate(()=>getComputedStyle(document.getElementById('zReset')).display==='none'||!document.getElementById('zReset').offsetParent);if(!zr){console.log('⤢ ainda aparece');bad++}
// double tap resets the 2D zoom
await p.evaluate(()=>{zoomAt(2)});const z1=await p.evaluate(()=>vb[2]<BOX[view][2]-.5);
const fb=await p.$('#fig');const fbb=await fb.boundingBox();await p.touchscreen.tap(fbb.x+20,fbb.y+fbb.height-30);await p.waitForTimeout(120);await p.touchscreen.tap(fbb.x+20,fbb.y+fbb.height-30);await p.waitForTimeout(200);
const z2=await p.evaluate(()=>vb[2]<BOX[view][2]-.5);console.log(th,'zoom',z1,'→ dois toques',z2);if(!z1||z2)bad++;
// 3D button
const bb=await (await p.$('#b3d')).boundingBox();console.log(' botão 3D',bb&&[Math.round(bb.x),Math.round(bb.y)]);if(!bb||bb.x<300)bad++;
await p.screenshot({path:`${OUT}/tres-d-${th}-0-botao.png`});
await p.tap('#b3d');
await p.waitForFunction(()=>V3&&document.getElementById('v3load').hidden,null,{timeout:60000}).catch(()=>{console.log('3D não carregou');bad++});
await p.waitForTimeout(800);await p.screenshot({path:`${OUT}/tres-d-${th}-1-3d.png`});
const keys=await p.evaluate(()=>V3.keys().length);console.log(' partes 3D',keys);if(keys<35)bad++;
// tap the chest in 3D → same as 2D
const pt=await p.evaluate(()=>V3.at('peito_medial'));await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(500);
let s=await p.evaluate(()=>({cur,cov:document.getElementById('tab-atlas').classList.contains('covered'),c:V3.color('peito_medial'),t:getComputedStyle(document.documentElement).getPropertyValue('--target').trim().toLowerCase()}));
console.log(' toque no peito',JSON.stringify(s));if(!/^peito/.test(s.cur||'')||!s.cov)bad++;
const red=await p.evaluate(k=>V3.color(k),s.cur);if(red!==s.t){console.log(' cor',red,s.t);bad++}
await p.screenshot({path:`${OUT}/tres-d-${th}-2-peito.png`});
// the tap must not also open the exercise under the finger (late click)
if(await p.evaluate(()=>curEx)!==null){console.log(' clique atrasado abriu exercício');bad++}
// open the first exercise → synergists orange in 3D
await p.evaluate(()=>selectExercise(0));await p.waitForTimeout(300);
const so=await p.evaluate(()=>{const syn=getComputedStyle(document.documentElement).getPropertyValue('--syn').trim().toLowerCase();return V3.keys().filter(k=>V3.color(k)===syn)});console.log(' sinergistas laranja',so.join(','));if(!so.length)bad++;
// the sheet down → big 3D figure with the colours
await p.evaluate(()=>{peek=true;render()});await p.waitForTimeout(600);await p.screenshot({path:`${OUT}/tres-d-${th}-3-exercicio.png`});
// Grupos paints groups
await p.evaluate(()=>{document.getElementById('clear').click();setMode('grp')});await p.waitForTimeout(600);
const gc=await p.evaluate(()=>new Set(['peito_medial','dorsal_superior','quad_reto_femoral','biceps_longa','ombro_lateral','abdomen_supra'].map(k=>V3.color(k))).size);console.log(' grupos cores',gc);if(gc<5)bad++;
await p.screenshot({path:`${OUT}/tres-d-${th}-4-grupos.png`});
// Cardio paints the muscles of the chosen cardio
await p.evaluate(()=>{setMode('cd');cdSel=Object.keys(CD_MUS)[0];paint();render()});await p.waitForTimeout(400);
const cdOn=await p.evaluate(()=>{const t=getComputedStyle(document.documentElement).getPropertyValue('--target').trim().toLowerCase();return V3.keys().filter(k=>V3.color(k)===t).length});console.log(' cardio vermelhos',cdOn);if(!cdOn)bad++;
// Articulações → back to 2D, no button
await p.evaluate(()=>{document.getElementById('clear').click();setMode('art')});await p.waitForTimeout(400);
let a=await p.evaluate(()=>({on:v3on,btn:!document.getElementById('b3d').hidden}));console.log(' articulações',JSON.stringify(a));if(a.on||a.btn)bad++;
await p.evaluate(()=>setMode('mus'));await p.waitForTimeout(300);
// ♀: 3D stays male with a note
await p.tap('#b3d');await p.waitForTimeout(500);await p.evaluate(()=>setSex('f'));await p.waitForTimeout(400);
a=await p.evaluate(()=>({on:v3on,note:!document.getElementById('v3note').hidden}));console.log(' ♀',JSON.stringify(a));if(!a.on||!a.note)bad++;
await p.screenshot({path:`${OUT}/tres-d-${th}-5-fem.png`});
// back to 2D
await p.tap('#b3d');await p.waitForTimeout(300);if(await p.evaluate(()=>v3on||!document.getElementById('v3').hidden))bad++;
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
