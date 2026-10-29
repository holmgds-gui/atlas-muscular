/* Aviso "qual peso anotar" no Registro e no ranking. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,theme] of [['pt-BR','light'],['es-ES','dark']]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:loc,colorScheme:theme,timezoneId:'America/Sao_Paulo'});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(loc+' '+e.message));
await p.goto(BASE);
await p.evaluate(()=>{localStorage.clear();const R=(id,sel={})=>{const f=FAMBY[id];const s={...f.d,...sel};return {name:vName(f,s),ref:mkRef(f,s),sets:2,reps:'8-12'}};
 localStorage.setItem('atlas-plans',JSON.stringify([{id:'p1',name:'Teste',days:[0,1,2,3,4,5,6],items:[R('supino'),R('rosca',{e:'ha'}),R('pushdown'),R('barrafixa')]}]))});
await p.reload();await p.waitForTimeout(500);
await p.evaluate(()=>setTab('treino'));await p.waitForTimeout(200);
await p.click('#treinoBody [data-act="log"]');await p.waitForTimeout(300);
console.log(loc,'registro hints',await p.evaluate(()=>[...document.querySelectorAll('.set-h .kgh')].map(x=>x.textContent).join(' | ')));
await p.evaluate(()=>{const e=document.querySelectorAll('.set-h')[1];e&&e.scrollIntoView({block:'center'})});await p.waitForTimeout(100);
await p.screenshot({path:`${OUT}/${loc}-reg.png`});
await p.tap('.set-h [data-help="peso"]');await p.waitForTimeout(200);console.log(loc,'help',await p.evaluate(()=>!document.getElementById('helpSheet').hidden));
await p.evaluate(()=>closeModals());
// ranking form
await p.evaluate(()=>{setTab('prog');pView='kg';renderProg()});await p.waitForTimeout(300);
const ok=await p.evaluate(()=>{const R=(id,sel={})=>{const f=FAMBY[id];const s={...f.d,...sel};return {name:vName(f,s),ref:mkRef(f,s)}};try{rForm=R('rosca',{e:'ha'});renderRank();return true}catch(e){return e.message}});
console.log(loc,'rank form',ok,await p.evaluate(()=>{const f=document.getElementById('rkForm');return f&&(f.querySelector('.kgh')||{}).textContent}));
await p.evaluate(()=>{const f=document.getElementById('rkForm');f&&f.scrollIntoView({block:'center'})});await p.waitForTimeout(100);await p.screenshot({path:`${OUT}/${loc}-rank.png`});
await ctx.close()}
console.log('errs',errs);await b.close()})();
