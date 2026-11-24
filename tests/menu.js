/* Menu do botão direito / segurar o dedo (pedido do dono, 0.48): músculo, exercício e treino mostram as opções
   deles + o menu geral; campo de texto fica com o menu do navegador; segurar no celular abre o menu sem escolher o músculo. */
const {chromium}=require('playwright');let bad=0;const ok=(c,m)=>{console.log((c?' ok  ':' ERRO')+' '+m);if(!c)bad++};
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];const o=require('path').join(__dirname,'out')+'/';require('fs').mkdirSync(o,{recursive:true});
// PC
let c=await b.newContext({viewport:{width:1280,height:800},colorScheme:'dark'});
await c.addInitScript(()=>{localStorage.setItem('atlas-intro','1');localStorage.setItem('atlas-conf',JSON.stringify({fig:'2d'}));localStorage.setItem('atlas-plans',JSON.stringify([{id:'p1',name:'Peito e tríceps',days:[0],items:[{name:'Supino reto',sets:3,reps:'8-12'}]}]))});
let p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/');await p.waitForTimeout(1000);
const m=await p.$('#fig [data-m="peito_medial"] path.m');const bb=await m.boundingBox();
await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2,{button:'right'});await p.waitForTimeout(300);
const mm=await p.evaluate(()=>[...document.querySelectorAll('#ctx h6,#ctx button')].map(x=>x.textContent.trim()).join(' | '));ok(/See exercises/.test(mm)&&/Reload/.test(mm),'PC: botão direito no músculo');
await p.screenshot({path:o+'ctx-pc-mus.png'});
await p.click('#ctx [data-cx="0"]');await p.waitForTimeout(400);
ok(await p.evaluate(()=>cur==='peito_medial'&&$('ctx').hidden),'escolher no menu fecha e faz a ação');
const ex=await p.$('.ex[data-i="1"]');const eb=await ex.boundingBox();await p.mouse.click(eb.x+40,eb.y+15,{button:'right'});await p.waitForTimeout(300);
const em=await p.evaluate(()=>[...document.querySelectorAll('#ctx h6,#ctx button')].slice(0,7).map(x=>x.textContent.trim()).join(' | '));ok(/Add to a workout/.test(em)&&/load progress/.test(em),'PC: menu do exercício');
await p.screenshot({path:o+'ctx-pc-ex.png'});
await p.keyboard.press('Escape');
await p.evaluate(()=>{setTab('ficha');fView='meus';renderFicha()});await p.waitForTimeout(300);
const pl=await p.$('.plan[data-pid="p1"] .plan-h');const pb=await pl.boundingBox();await p.mouse.click(pb.x+60,pb.y+15,{button:'right'});await p.waitForTimeout(300);
const pm=await p.evaluate(()=>[...document.querySelectorAll('#ctx h6,#ctx button')].slice(0,7).map(x=>x.textContent.trim()).join(' | '));ok(/Mark as done/.test(pm)&&/Rename/.test(pm),'PC: menu do treino');
const dup=await p.evaluate(()=>{const b=[...document.querySelectorAll("#ctx button")].find(x=>/Duplicate|Duplicar/.test(x.textContent));b.click();return plans.map(x=>x.name)});ok(dup.length===2&&/copy/.test(dup[1]),'Duplicar treino');
const inp=await p.$('[data-pf="name"]');const ib=await inp.boundingBox();await p.mouse.click(ib.x+20,ib.y+10,{button:'right'});await p.waitForTimeout(200);
ok(await p.evaluate(()=>$('ctx').hidden),'campo de texto fica com o menu do navegador');
await c.close();
// phone long press
c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:'light'});
await c.addInitScript(()=>{localStorage.setItem('atlas-intro','1');localStorage.setItem('atlas-conf',JSON.stringify({fig:'2d'}))});
p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/');await p.waitForTimeout(1000);
const m2=await p.$('#fig [data-m="peito_medial"] path.m');const b2=await m2.boundingBox();const X=b2.x+b2.width/2,Y=b2.y+b2.height/2;
const cdp=await c.newCDPSession(p);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:X,y:Y}]});await p.waitForTimeout(700);
await p.screenshot({path:o+'ctx-phone.png'});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(400);
ok(await p.evaluate(()=>!$('ctx').hidden&&cur===null),'celular: segurar abre o menu e não escolhe o músculo');
await c.close();
console.log(errs);await b.close();process.exit(bad||errs.length?1:0)})();
