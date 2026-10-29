// node crawl.js pt|en  -> collects visible strings (pt) or Portuguese leftovers (en)
/* Coleta todos os textos visíveis num idioma (node tests/i18n-coleta.js pt|en|es) para achar sobras em português com tests/i18n-sobras.js. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');const fs=require('fs');
const lang=process.argv[2]||'pt';const out=require('path').join(OUT,'crawl-'+lang+'.json');
const seed=(lang)=>{const R=(id,sel={})=>{const f=FAMBY[id];const s={...f.d,...sel};return [vName(f,s),mkRef(f,s)]};
  const it=(x,sets,done)=>({name:x[0],ref:x[1],target:'8-12',notes:'',sets:sets.map(([r,kg])=>({r:String(r),kg:String(kg)}))});
  const t=new Date();const d=k=>{const z=new Date(t);z.setDate(z.getDate()-k);return isoDate(z)};
  const P=[{id:'p1',name:'Peito e tríceps',days:[0,3],items:[{name:R('supino')[0],ref:R('supino')[1],sets:3,reps:'8-12'},{name:'Supino inclinado com barra (≈30°)',sets:3,reps:'10'}]},
           {id:'p2',name:'Pernas',days:[],items:[{name:R('agach')[0],ref:R('agach')[1],sets:4,reps:'6-8'}]},{id:'p3',name:'',days:[],items:[]}];
  const W=[{id:'w1',date:d(1),title:'Peito e tríceps',planId:'p1',done:true,notes:'',items:[it(R('supino'),[[8,80],[6,85]]),it(R('pushdown'),[[12,35]]),it(['Meu exercício',null],[[10,20]])]},
    {id:'w2',date:d(3),title:'Pernas',planId:'p2',done:true,notes:'bom',items:[it(R('agach'),[[6,110]]),it(R('barrafixa'),[[8,'']]),it(R('flexao'),[[20,'']])]},
    {id:'w3',date:d(0),title:'Pernas',planId:'p2',done:false,notes:'',items:[it(R('agach'),[[5,100],['','']])]},
    {id:'w4',date:d(10),title:'Treino',planId:null,done:true,notes:'',items:[it(R('supino'),[[10,70]]),it(R('rosca'),[[10,30]])]},
    {id:'w5',date:d(0),title:'Treino de hoje',planId:null,done:false,notes:'',items:[it(R('rosca'),[[10,'']])]}];
  localStorage.clear();localStorage.setItem('atlas-plans',JSON.stringify(P));localStorage.setItem('atlas-workouts',JSON.stringify(W));
  localStorage.setItem('atlas-rank',JSON.stringify({bw:80,man:[{id:'m1',ref:R('hipthrust')[1],kg:140,r:8,date:d(2)}]}));
  localStorage.setItem('atlas-conf',JSON.stringify({lang,name:'Gui',goal:3,remind:true}));localStorage.setItem('atlas-tab','"atlas"')};
(async()=>{const b=await chromium.launch();const all=new Map();const errs=[];
for(const vp of [{width:390,height:844},{width:1280,height:860}]){
const ctx=await b.newContext({locale:{en:'en-US',es:'es-ES',pt:'pt-BR'}[lang],viewport:vp,isMobile:vp.width<500,hasTouch:vp.width<500,timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(300);await p.evaluate(seed,lang);await p.reload();await p.waitForTimeout(500);
await p.evaluate(()=>{window.__toasts=[];const o=window.toast;window.toast=m=>{o(m);setTimeout(()=>window.__toasts.push(document.getElementById('toast').textContent),40)}});
const grab=async(tag)=>{await p.waitForTimeout(60);const r=await p.evaluate(()=>{const o=[];const seen=new Set();
  const vis=e=>{const el=e.nodeType===3?e.parentElement:e;if(!el)return false;if(el.closest('[hidden]'))return false;return true};
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const t=n.nodeValue.trim();if(!t||!vis(n))continue;const pn=n.parentNode.nodeName;if(pn==="SCRIPT"||pn==="STYLE")continue;o.push(t)}
  document.querySelectorAll('[title],[aria-label],[placeholder]').forEach(e=>{if(!vis(e))return;for(const a of ['title','aria-label','placeholder'])if(e.hasAttribute(a))o.push(e.getAttribute(a))});
  o.push(...(window.__toasts||[]));window.__toasts=[];
  return o});for(const t of r){if(!all.has(t))all.set(t,tag)}};
const ev=(s,a)=>p.evaluate(s,a);const click=async sel=>{try{await p.click(sel,{timeout:1500})}catch(e){}await p.waitForTimeout(80)};
// ATLAS
await grab('atlas idle');
for(const m of await ev(()=>Object.keys(M))){await ev(m=>selectMuscle(m),m);await grab('mus '+m);}
await ev(()=>{selectMuscle('peito_superior');selectExercise(0)});await grab('ex open');
const axb=await ev(()=>document.querySelectorAll('[data-ax],[data-vax],[data-pax]').length);
await ev(()=>{const b=document.querySelector('#body button[data-o]');if(b)b.click()});await grab('variation');
await ev(()=>{const c=document.querySelectorAll('#chips button');if(c[1])c[1].click()});await grab('chip');
await ev(()=>setModel('bas'));await grab('bas');for(const g of await ev(()=>Object.keys(BASIC))){await ev(g=>selectGroup(g),g);await grab('grp '+g)}
await ev(()=>{selectGroup('peito');selectExercise(0)});await grab('bas ex');
await ev(()=>setModel('art'));await grab('art');for(const j of await ev(()=>Object.keys(JOINTS))){await ev(j=>selectJoint(j),j);await grab('joint '+j)}
await ev(()=>setModel('det'));
for(const q of ['supino','puxada pronada','bench','zzzz','peito']){await ev(()=>openSearch());await p.fill('#q',q);await p.waitForTimeout(150);await grab('search '+q)}
await p.fill('#q','');await ev(()=>closeSearch());
await ev(()=>{selectMuscle('biceps_longa')});await click('#listBtn');await grab('list');await click('#peekBtn');await grab('peek');
// help
for(const k of await ev(()=>Object.keys(HELP))){await ev(k=>openHelp(k),k);await grab('help '+k);await ev(()=>closeModals())}
// add sheet
await ev(()=>openAddSheet(vName(FAMBY.supino,FAMBY.supino.d),mkRef(FAMBY.supino,FAMBY.supino.d)));await grab('addsheet');await ev(()=>closeModals());
// picker
await ev(()=>openPicker('Adicionar exercício',()=>{}));await grab('picker');await ev(()=>{document.querySelector('#plist [data-pf]').click()});await grab('picker open');
await ev(()=>{const c=document.querySelectorAll('#pchips button');if(c[2])c[2].click()});await grab('picker chip');await p.fill('#pq','meu treino especial xyz');await p.waitForTimeout(150);await grab('picker custom');await ev(()=>closeModals());
// FICHA
await ev(()=>setTab('ficha'));await grab('ficha');
await ev(()=>{const b=document.querySelector('#fichaBody [data-op],#fichaBody [data-open],#fichaBody .plan button');if(b)b.click()});await grab('ficha open');
const fb=await ev(()=>[...document.querySelectorAll('#fichaBody [data-act]')].map(b=>b.dataset.act));
for(const a of [...new Set(fb)]){if(['del','delPlan','remove'].includes(a)||/del/i.test(a)){await ev(a=>{const b=document.querySelector(`#fichaBody [data-act="${a}"]`);if(b)b.click()},a);await grab('ficha '+a)}}
await ev(()=>setTab('ficha'));await ev(()=>{const b=[...document.querySelectorAll('#fichaBody button')].find(x=>/novo|criar|montar/i.test(x.textContent));if(b)b.click()});await grab('ficha new');
// TREINO
await ev(()=>setTab('treino'));await grab('treino');
const tacts=await ev(()=>[...document.querySelectorAll('#treinoBody [data-act]')].map(b=>b.dataset.act+'|'+(b.dataset.pid||b.dataset.wid||'')));
for(const a of ['log|p1']){await ev(a=>{const [k,id]=a.split('|');const b=document.querySelector(`#treinoBody [data-act="${k}"][data-pid="${id}"]`);if(b)b.click()},a);await grab('treino '+a)}
for(const a of await ev(()=>[...new Set([...document.querySelectorAll('#treinoBody [data-act]')].map(b=>b.dataset.act))])){
  if(['del','delW','askDel'].includes(a)||/del|undo|notes|addSet|rmSet/i.test(a)){await ev(a=>{const b=document.querySelector(`#treinoBody [data-act="${a}"]`);if(b)b.click()},a);await grab('treino w '+a)}}
await ev(()=>{openW=null;renderTreino()});await ev(()=>{const b=document.querySelector('#treinoBody [data-open]');if(b)b.click()});await grab('treino open');
await ev(()=>{openW=null;renderTreino();const b=document.querySelector('#treinoBody [data-day]');if(b)b.click()});await grab('treino past');
await ev(()=>{const b=document.querySelector('#treinoBody [data-act="startFree"]');if(b)b.click()});await grab('treino free');
await ev(()=>{openW=null;hDate=null;renderTreino();const b=document.querySelector('#treinoBody [data-act="quickDone"]');if(b)b.click()});await grab('treino quick');
await ev(()=>{const b=document.querySelector('#treinoBody [data-act="wkPrev"]');if(b)b.click()});await grab('treino wkprev');
// PROG
await ev(()=>{setTab('prog');pView='mus';pMode='week';renderProg()});await grab('prog week');
await ev(()=>{radSel='pernas';renderProg()});await grab('prog radar');
await ev(()=>{pMode='day';pOff=-1;renderProg()});await grab('prog day');
await ev(()=>{pMode='week';pOff=-3;renderProg()});await grab('prog empty');
await ev(()=>{pView='kg';pOff=0;renderProg()});await grab('prog kg');
await ev(()=>{const b=document.querySelector('[data-kx]');if(b)b.click()});await grab('kg open');
await ev(()=>{document.querySelectorAll('[data-rg2]').forEach(d=>d.open=true)});await grab('rank open');
await ev(()=>{rForm={name:vName(FAMBY.barrafixa,FAMBY.barrafixa.d),ref:mkRef(FAMBY.barrafixa,FAMBY.barrafixa.d)};renderRank()});await grab('rank form bw');
await ev(()=>{rForm={name:vName(FAMBY.supino,FAMBY.supino.d),ref:mkRef(FAMBY.supino,FAMBY.supino.d)};renderRank()});await grab('rank form');
await ev(()=>{const b=document.querySelector('[data-ract="save"]');if(b)b.click()});await grab('rank save empty');
await ev(()=>{rForm=null;rank.bw=null;delete rank.bw;renderRank()});await grab('rank nobw');
await ev(()=>{const w0=workouts;workouts=[];rank.man=[];renderRank();workouts=w0});await grab('rank empty');
await ev(()=>{document.querySelectorAll('.about').forEach(d=>d.open=true)});await grab('abouts');
// CONF
await ev(()=>setTab('conf'));await grab('conf');
for(const k of ['delHist','delMan','delAll']){await ev(k=>{cfConfirm=k;renderConf()},k);await grab('conf '+k)}
await ev(()=>{cfConfirm=null;pendingImport={plans:[],workouts:[]};renderConf()});await grab('conf import');await ev(()=>{pendingImport=null});
// toasts
for(const m of await ev(()=>{const o=[];return o})){}
await ctx.close()}
const arr=[...all].map(([t,tag])=>({t,tag}));fs.writeFileSync(out,JSON.stringify(arr,null,0));
console.log('strings',arr.length,'errs',errs.slice(0,5));await b.close()})();
