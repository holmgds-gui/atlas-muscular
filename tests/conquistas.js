/* Conquistas com um histórico de exemplo e aviso de conquista nova (pt, es, en). */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');const out=OUT;
(async()=>{const b=await chromium.launch();const errs=[];
for(const [loc,theme] of [['pt-BR','light'],['es-ES','dark'],['en-US','dark']]){
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:'America/Sao_Paulo',colorScheme:theme,locale:loc});
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(300);
await p.evaluate(()=>{localStorage.clear();
  const R=(id,sel={})=>{const f=FAMBY[id];const s={...f.d,...sel};return [vName(f,s),mkRef(f,s)]};
  const it=(x,sets)=>({name:x[0],ref:x[1],target:'8-12',notes:'',sets:sets.map(([r,kg])=>({r:String(r),kg:String(kg)}))});
  const W=[];let id=0;const add=(d,items,extra={})=>W.push({id:'w'+(id++),date:isoDate(d),title:'T',done:true,notes:'',items,...extra});
  const mon=fromIso(monOf(isoDate(new Date())));
  // 6 full weeks before this one, 3 workouts each (Mon chest, Wed legs, Fri back)
  for(let k=7;k>=1;k--){const m=new Date(mon);m.setDate(m.getDate()-7*k);
    const d1=new Date(m),d3=new Date(m),d5=new Date(m);d3.setDate(d3.getDate()+2);d5.setDate(d5.getDate()+4);
    const kgB=70+ (7-k)*2.5;
    add(d1,[it(R('supino'),[[8,kgB],[8,kgB],[8,kgB]]),it(R('rosca'),[[10,14],[10,14]])]);
    if(k===3){add(d3,[it(R('desenv',{e:'ba'}),[[8,40]])]);}  // upper only week (no legs)
    else add(d3,[it(R('agach'),[[5,100],[5,100],[5,100]]),it(R('stiff'),[[8,80]])]);
    add(d5,[it(R('barrafixa'),[[10,''],[8,'']]),it(R('remcurv'),[[8,80]])]);
    if(k===2){const d6=new Date(m);d6.setDate(d6.getDate()+5);add(d6,[it(R('agach'),[[5,105]])]);const d7=new Date(m);d7.setDate(d7.getDate()+6);add(d7,[it(R('terra'),[[3,140]])]);}
  }
  // this week: 1 live workout at 6:30, 12 minutes, two the same day
  const t=new Date();t.setHours(6,30,0,0);
  add(new Date(),[it(R('flexao'),[[22,'']])],{start:t.getTime(),dur:720});
  add(new Date(),[it(R('supino'),[[5,82.5]]),it(R('rosca'),[[10,14]])]);
  localStorage.setItem('atlas-workouts',JSON.stringify(W));
  localStorage.setItem('atlas-rank',JSON.stringify({bw:80,man:[]}));
});
await p.reload();await p.waitForTimeout(400);
const S=await p.evaluate(()=>{const S=achStats();delete S.weeks;return S});
if(loc==='pt-BR')console.log(JSON.stringify(S));
await p.evaluate(()=>{setTab('prog');pView='ach';renderProg()});await p.waitForTimeout(300);
const got=await p.evaluate(()=>{const S=achStats();return [ACH.length,ACH.filter(a=>achOk(a,S)).map(a=>a.id).join(' ')]});
if(loc==='pt-BR')console.log(got);
await p.screenshot({path:`${out}/${loc}-0.png`});
const secs=await p.evaluate(()=>document.querySelectorAll('.ach-sec').length);
for(let i=0;i<secs;i++){await p.evaluate(i=>{document.querySelectorAll('.ach-sec')[i].scrollIntoView({block:'start'});const t=document.getElementById('tab-prog');t.scrollTop-=70;window.scrollBy(0,-70)},i);await p.waitForTimeout(80);await p.screenshot({path:`${out}/${loc}-s${i}.png`})}
await p.evaluate(()=>{ach.seen=[];saveAch();checkAch()});await p.waitForTimeout(2700);
console.log(loc,'toast',await p.evaluate(()=>document.getElementById('toast').textContent));
const blob=await p.evaluate(async()=>{const b=await makeCard('ach');const r=new FileReader();return await new Promise(res=>{r.onload=()=>res(r.result);r.readAsDataURL(b)})});
require('fs').writeFileSync(`${out}/${loc}-card.png`,Buffer.from(blob.split(',')[1],'base64'));
// Hoje streak badge
await p.evaluate(()=>setTab('treino'));await p.waitForTimeout(200);await p.screenshot({path:`${out}/${loc}-hoje.png`});
await ctx.close()}
console.log('errs',errs);await b.close()})();
