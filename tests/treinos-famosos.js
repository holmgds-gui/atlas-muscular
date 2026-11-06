/* Treinos dos famosos: cada exercício existe e cada variação é válida; filtros de tipo/fonte; marca no canto;
   "Adicionar o programa todo"; textos traduzidos (pt, en, es). */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;
for(const [loc,theme] of [['pt-BR','light'],['en-US','dark'],['es-ES','light']]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:loc,colorScheme:theme,timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});p.on('pageerror',e=>errs.push(loc+' '+e.message));
await p.goto(BASE);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(500);
if(loc==='pt-BR'){const r=await p.evaluate(()=>{const out=[];let n=0;
  for(const w of RT.filter(w=>w.pg)){n++;for(const [id,ov] of w.it){const f=FAMBY[id];if(!f){out.push(w.id+': família '+id);continue}
    for(const [k,v] of Object.entries(ov)){const ax=f.ax.find(a=>a[0]===k);if(!ax)out.push(w.id+' '+id+': eixo '+k);else if(!ax[3].some(o=>o.k===v))out.push(w.id+' '+id+': '+k+'='+v)}}
    const it=rtItems(w);if(it.some(x=>!exInfo(x.name,x.ref)))out.push(w.id+': exInfo');}
  return {n,progs:RF_P.length,b:RT.filter(w=>w.pg&&w.lv==="b").length,a:RT.filter(w=>w.pg&&w.lv==="a").length,out}});
  console.log('famosos',r.n,'programas',r.progs,'iniciante',r.b,'avançado',r.a);if(r.out.length){bad++;console.log('PROBLEMAS',r.out)}}
await p.evaluate(()=>setTab('ficha'));await p.tap('[data-fv="prontos"]');await p.waitForTimeout(200);
await p.tap('[data-rtsrc="fam"]');await p.waitForTimeout(200);
const c=await p.evaluate(()=>({sec:document.querySelectorAll('.rt-pg').length,app:document.querySelectorAll('.rt-sp:not(.rt-pg)').length,wm:[...document.querySelectorAll('.rt-wm')].slice(0,3).map(x=>x.textContent)}));
console.log(loc,'b fam',c);if(c.app||!c.sec)bad++;
await p.screenshot({path:`${OUT}/${loc}-fam-0.png`});
await p.tap('[data-rtlv="a"]');await p.waitForTimeout(200);
for(const tp of ["fb","ul","ppl","iso","spl"]){await p.tap(`[data-rttp="${tp}"]`);await p.waitForTimeout(100);
  const r=await p.evaluate(tp=>({n:document.querySelectorAll('.rt-wh').length,ok:[...document.querySelectorAll('.rt-wh')].every(b=>RT.find(w=>w.id===b.dataset.id).sp===tp)}),tp);
  console.log(loc,'a',tp,r);if(!r.ok||!r.n)bad++}
await p.tap('[data-rttp="spl"]');await p.waitForTimeout(100);
await p.evaluate(()=>document.querySelector('.rt-wh').click());await p.waitForTimeout(300);
await p.screenshot({path:`${OUT}/${loc}-fam-1-aberto.png`});
await p.tap('[data-rttp=""]');await p.waitForTimeout(100);
await p.evaluate(()=>document.querySelector('[data-rt="prog"][data-pg="phul"]').click());await p.waitForTimeout(200);
const pl=await p.evaluate(()=>plans.map(x=>x.name+' ['+x.days+'] '+x.items.length));console.log(loc,'prog',pl);if(pl.length!==4)bad++;
await p.evaluate(()=>{document.querySelector('[data-id="f_g6_0"]')||0});
// Portuguese left in en/es
if(loc!=='pt-BR'){const pt=await p.evaluate(()=>{const W=["exercícios","séries","Adicionar","Treinos dos famosos","Pernas","Costas","Peito","Ombros","Braços"," e "];const t=document.getElementById('fichaBody').innerText;return W.filter(w=>t.includes(w))});console.log(loc,'pt words',pt)}
await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
