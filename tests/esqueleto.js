/* 3D › Músculos · Raio-X · Esqueleto (0.65): o esqueleto (3d/ossos-1.glb / ossos-f-2.glb; desde a 0.66 o Esqueleto só aparece em Articulações) carrega, fica dentro do corpo,
   Raio-X deixa os músculos transparentes e ainda dá para tocar num músculo, Esqueleto esconde os músculos, ♂/♀ troca
   o esqueleto, e o botão só aparece no 3D. Prints em tests/out/esq-*.png. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];
for(const [loc,theme] of [['pt-BR','light'],['en-US','dark']]){
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:loc,colorScheme:theme})).newPage();
p.on('pageerror',e=>errs.push(loc+' '+e.message));
await p.addInitScript(()=>{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-conf",JSON.stringify({fig:"3d"}))});
await p.goto(BASE);await p.waitForFunction(()=>window.V3&&V3.keys().length>10,null,{timeout:60000});
await p.tap('#xrTgl');await p.waitForTimeout(200);
const items=await p.evaluate(()=>[...document.querySelectorAll('#xrPop [data-xr]')].map(x=>x.dataset.xr));console.log(loc,'músculos:',items);if(items.join()!=='off,raiox')errs.push(loc+' menu em Músculos '+items);
await p.evaluate(()=>{xrClose();setMode('art')});await p.waitForTimeout(400);await p.tap('#xrTgl');await p.waitForTimeout(200);
const items2=await p.evaluate(()=>[...document.querySelectorAll('#xrPop [data-xr]')].map(x=>x.dataset.xr));console.log(loc,'articulações:',items2);if(items2.join()!=='off,raiox,esq')errs.push(loc+' menu em Articulações '+items2);
await p.tap('[data-xr="esq"]');await p.waitForFunction(()=>V3.bonesReady(),null,{timeout:60000});await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const vis=V3.keys().filter(k=>V3.visible&&V3.visible(k));return {mode:V3.xrNow(),vis,box:V3.boxes&&V3.boxes()}});
console.log(loc,'esq',JSON.stringify(r).slice(0,300));
if(r.vis.length)errs.push(loc+' músculos visíveis no Esqueleto: '+r.vis);
if(r.box){const [s,c]=[r.box.bones,r.box.body];if(!(s.min[1]>=c.min[1]-0.01&&s.max[1]<=c.max[1]+0.01&&s.min[0]>=c.min[0]-0.01&&s.max[0]<=c.max[0]+0.01))errs.push(loc+' esqueleto fora do corpo '+JSON.stringify(r.box))}
await p.screenshot({path:`${OUT}/esq-${loc}-esqueleto.png`});
await p.evaluate(()=>setMode('mus'));await p.waitForTimeout(600);
const back=await p.evaluate(()=>[xrMode,V3.xrNow()]);console.log(loc,'saiu de Articulações:',back);if(back.join()!=='raiox,raiox')errs.push(loc+' esqueleto fora de Articulações '+back);
const pt=await p.evaluate(()=>V3.at('peito_medial'));await p.touchscreen.tap(pt.x,pt.y);await p.waitForTimeout(1200);
const t=await p.evaluate(()=>[V3.xrNow(),cur]);console.log(loc,'raiox tap',t);if(t[1]!=='peito_medial')errs.push(loc+' toque no Raio-X');
await p.screenshot({path:`${OUT}/esq-${loc}-raiox.png`});
await p.evaluate(()=>setSex('f'));await p.waitForFunction(()=>V3.sexNow()==='f'&&V3.bonesReady(),null,{timeout:60000});
await p.evaluate(()=>setXr('off'));await p.waitForTimeout(500);
const off=await p.evaluate(()=>[V3.xrNow(),V3.keys().filter(k=>V3.visible&&!V3.visible(k))]);console.log(loc,'off',off);if(off[0]!=='off')errs.push(loc+' voltar');
await p.evaluate(()=>set3D(false));await p.waitForTimeout(200);if(!(await p.evaluate(()=>document.getElementById('xrW').hidden)))errs.push(loc+' botão no 2D');
await p.context().close()}
console.log('errs',errs);await b.close();process.exit(errs.length?1:0)})();
