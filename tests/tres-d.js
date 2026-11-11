/* Boneco 3D no Atlas (pedido do dono): botão "3D" no canto de baixo do boneco; tocar num músculo funciona igual ao 2D
   (vermelho + lista; exercício pinta sinergistas de laranja); Grupos e Cardio pintam o 3D; Articulações mostra as juntas no 3D (tocar escolhe); botão 3D pequeno com a lista aberta;
   com ♀ o 3D troca para o corpo feminino (0.15), com os seios translúcidos que não recebem toque (0.17): tocar neles escolhe o peitoral. Também confere que o ⤢ sumiu no celular e que dois toques voltam o zoom.
   O Three.js vem do jsDelivr; sem internet no teste, use THREE_DIR=<pasta do pacote three@0.160.0>. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const path=require("path"),fs=require("fs");
let TD=process.env.THREE_DIR;try{if(!TD)TD=path.dirname(require.resolve("three/package.json"))}catch(e){}
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];let bad=0;
for(const th of ['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR'});
if(TD)await ctx.route("https://cdn.jsdelivr.net/npm/three@0.160.0/**",r=>{const f=path.join(TD,new URL(r.request().url()).pathname.replace("/npm/three@0.160.0/",""));
  fs.existsSync(f)?r.fulfill({path:f,contentType:"application/javascript"}):r.abort()});
const p=await ctx.newPage();p.setDefaultTimeout(120000);await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");{const c=JSON.parse(localStorage.getItem("atlas-conf")||"{}");if(!c.fig){c.fig="both";localStorage.setItem("atlas-conf",JSON.stringify(c))}};localStorage.setItem("atlas-sex","m")}catch(e){}});
p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts\.g/.test(m.text()))errs.push(m.text())});
await p.goto(BASE);await p.waitForTimeout(700);
// "2D e 3D" opens in 3D (0.17): this test starts from the 2D and turns the 3D on with the button
await p.evaluate(()=>set3D(false));await p.waitForTimeout(200);
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
// owner: limits — not too far, never inside the body, never straight from above/below
const lim=async(x,y,z)=>{await p.evaluate(([x,y,z])=>V3.place(x,y,z),[x,y,z]);await p.waitForTimeout(250);return p.evaluate(()=>V3.cam())};
let c=await lim(0,0,30);console.log(' longe',JSON.stringify(c));if(c.dist>c.max+0.01)bad++;
c=await lim(0,0,0.02);console.log(' dentro',JSON.stringify(c));if(c.surf<0.12||c.dist<c.min-0.01)bad++;   // 0.19: not too close either
c=await lim(0,3,0.01);console.log(' de cima',JSON.stringify(c));if(c.polar<71)bad++;   // 0.19: 72–108°
c=await lim(0,-3,0.01);console.log(' de baixo',JSON.stringify(c));if(c.polar>109)bad++;
c=await (async()=>{await p.evaluate(()=>{V3.look(0);});await p.waitForTimeout(300);return p.evaluate(()=>V3.cam())})();console.log(' limites',JSON.stringify({min:c.min,max:c.max}));if(!(c.min>0.6&&c.max<c.min*3))bad++;
await p.evaluate(()=>V3.view('front'));await p.waitForTimeout(800);
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
// with the list over the figure the 3D/2D button is still there, small
const sb=await p.evaluate(()=>{const b=document.getElementById('b3d'),r=b.getBoundingClientRect();return {cov:document.getElementById('tab-atlas').classList.contains('covered'),w:Math.round(r.width),vis:getComputedStyle(b).display!=='none'}});console.log(' botão pequeno',JSON.stringify(sb));if(!sb.vis||sb.w>50)bad++;
await p.screenshot({path:`${OUT}/tres-d-${th}-6-cardio.png`});
// Articulações in 3D: joint marks; tapping one picks it (red) like in 2D
await p.evaluate(()=>{document.getElementById('clear').click();setMode('art')});await p.waitForTimeout(800);
let a=await p.evaluate(()=>({on:v3on,btn:!document.getElementById('b3d').hidden,j:V3.jointAt('joelho')}));console.log(' articulações',JSON.stringify(a));if(!a.on||!a.btn||!a.j)bad++;
await p.screenshot({path:`${OUT}/tres-d-${th}-7-juntas.png`});
await p.touchscreen.tap(a.j.x,a.j.y);await p.waitForTimeout(600);
a=await p.evaluate(()=>({curJ,cov:document.getElementById('tab-atlas').classList.contains('covered'),c:V3.jointAt('joelho').c,t:getComputedStyle(document.documentElement).getPropertyValue('--target').trim().toLowerCase()}));
console.log(' toque no joelho',JSON.stringify(a));if(a.curJ!=='joelho'||a.c!==a.t)bad++;
await p.evaluate(()=>{peek=true;render()});await p.waitForTimeout(600);await p.screenshot({path:`${OUT}/tres-d-${th}-8-joelho.png`});
await p.evaluate(()=>setMode('mus'));await p.waitForTimeout(300);
// ♀ (owner 0.15–0.17): the 3D swaps to the female body; the breasts are a see-through aura ("mama"): a tap on the chest goes through to the pectoral
await p.evaluate(()=>set3D(true));await p.waitForTimeout(500);await p.evaluate(()=>setSex('f'));
await p.waitForFunction(()=>V3.sexNow()==='f'&&document.getElementById('v3load').hidden&&V3.keys().length>30,null,{timeout:90000}).catch(()=>{console.log('corpo ♀ não carregou');bad++});
await p.evaluate(()=>V3.view('front'));await p.waitForTimeout(900);
a=await p.evaluate(()=>({on:v3on,sx:V3.sexNow(),mama:V3.keys().includes('mama'),j:!!V3.jointAt('joelho')}));console.log(' ♀',JSON.stringify(a));if(!a.on||a.sx!=='f'||!a.mama||!a.j)bad++;
await p.screenshot({path:`${OUT}/tres-d-${th}-5-fem.png`});
const mp=await p.evaluate(()=>V3.at('mama'));await p.touchscreen.tap(mp.x,mp.y);await p.waitForTimeout(500);
s=await p.evaluate(()=>({cur,c:V3.color(cur),t:getComputedStyle(document.documentElement).getPropertyValue('--target').trim().toLowerCase()}));
console.log(' ♀ toque no peito',JSON.stringify(s));if(!/^peito/.test(s.cur||'')||s.c!==s.t)bad++;
await p.evaluate(()=>{peek=true;render()});await p.waitForTimeout(600);await p.screenshot({path:`${OUT}/tres-d-${th}-5b-fem-peito.png`});
await p.evaluate(()=>{document.getElementById('clear').click();setSex('m')});
await p.waitForFunction(()=>V3.sexNow()==='m'&&document.getElementById('v3load').hidden,null,{timeout:90000}).catch(()=>{console.log('volta ♂ falhou');bad++});
// back to 2D
await p.tap('#b3d');await p.waitForTimeout(300);if(await p.evaluate(()=>v3on||!document.getElementById('v3').hidden))bad++;
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
