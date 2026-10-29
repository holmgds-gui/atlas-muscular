/* Hoje › Ao vivo: série a série, descanso, recorde, concluir e sugestão no Registro (pt e es). */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');const out=OUT;
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,theme] of [['pt-BR','light'],['es-ES','dark']]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:'America/Sao_Paulo',colorScheme:theme,locale:loc});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(300);
await p.evaluate(()=>{localStorage.clear();
  const R=(id,sel={})=>{const f=FAMBY[id];const s={...f.d,...sel};return [vName(f,s),mkRef(f,s)]};
  const it=(x,sets,t='8-12')=>({name:x[0],ref:x[1],target:t,notes:'',sets:sets.map(([r,kg])=>({r:String(r),kg:String(kg)}))});
  const d=new Date();d.setDate(d.getDate()-3);const iso=isoDate(d);
  const P=[{id:'p1',name:'Peito e tríceps',days:[0,1,2,3,4,5,6],items:[{name:R('supino')[0],ref:R('supino')[1],sets:3,reps:'8-12'},{name:R('pushdown')[0],ref:R('pushdown')[1],sets:3,reps:'10-15'}]}];
  localStorage.setItem('atlas-plans',JSON.stringify(P));
  localStorage.setItem('atlas-workouts',JSON.stringify([{id:'a',date:iso,title:'Peito e tríceps',planId:'p1',done:true,notes:'',items:[it(R('supino'),[[12,80],[12,80],[12,80]]),it(R('pushdown'),[[12,30],[11,30]],'10-15')]}]));
  localStorage.setItem('atlas-conf',JSON.stringify({rest:90}));
});
await p.reload();await p.waitForTimeout(400);
await p.evaluate(()=>setTab('treino'));await p.waitForTimeout(200);
await p.screenshot({path:`${out}/${loc}-0-registro.png`});
await p.click('[data-hv="live"]');await p.waitForTimeout(200);
await p.screenshot({path:`${out}/${loc}-1-escolher.png`});
await p.click('[data-lv="start"]');await p.waitForTimeout(300);
await p.screenshot({path:`${out}/${loc}-2-aovivo.png`,fullPage:false});
// do set 1 with suggestion (should be 82.5 x 8 -> PR heavy)
await p.click('[data-lv="setDone"]');await p.waitForTimeout(400);
console.log(loc,'toast',await p.evaluate(()=>document.getElementById('toast').textContent),'rest',await p.evaluate(()=>!!rest),await p.evaluate(()=>JSON.stringify(liveW().items[0].sets)));
await p.waitForTimeout(1200);
await p.screenshot({path:`${out}/${loc}-3-descanso.png`});
// go to atlas to see pill
await p.evaluate(()=>setTab('atlas'));await p.waitForTimeout(1100);
await p.screenshot({path:`${out}/${loc}-4-pilula.png`});
await p.click('#restPillT');await p.waitForTimeout(300);console.log('after pill',await p.evaluate(()=>[tab,document.getElementById('tab-treino').hidden,hView,!!document.getElementById('lvR'),getComputedStyle(document.getElementById('tab-treino')).display]));
// fill remaining sets
for(let k=0;k<4;k++){await p.fill('#lvR','10');await p.click('[data-lv="setDone"]');await p.waitForTimeout(150)}
await p.click('[data-lv="rStop"]').catch(()=>{});
await p.evaluate(()=>document.querySelector('[data-lv="finish"]').scrollIntoView({block:'center'}));await p.waitForTimeout(100);
await p.screenshot({path:`${out}/${loc}-5-fim-lista.png`});
await p.click('[data-lv="finish"]');await p.waitForTimeout(300);
await p.evaluate(()=>document.getElementById('tab-treino').scrollTop=0);
await p.screenshot({path:`${out}/${loc}-6-resumo.png`});
console.log(loc,'done',await p.evaluate(()=>workouts.map(w=>[w.done,w.dur,w.items.map(i=>i.sets.length).join('/')])));
await p.click('[data-lv="sumOk"]');await p.click('[data-hv="reg"]');await p.waitForTimeout(200);
await p.evaluate(()=>{const b=document.querySelector('#treinoBody [data-act="log"]');if(b)b.click()});await p.waitForTimeout(200);
await p.screenshot({path:`${out}/${loc}-7-sugestao-registro.png`});
await ctx.close()}
console.log('errs',errs);await b.close()})();
