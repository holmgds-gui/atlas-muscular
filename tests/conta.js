/* Conta e sincronização (pedido do dono, 0.23: login com Google, Firebase). Dois "aparelhos" (dois navegadores
   separados) entram na mesma conta:
   - o 1º sobe tudo que tinha; o 2º junta o dele com o da conta, sem duplicar, e o 1º recebe o do 2º;
   - criar, mudar e apagar num aparece no outro; sem internet guarda e envia quando volta; o idioma não é levado;
   - recarregar continua conectado e sem duplicar; Sair deixa os dados no aparelho; Apagar minha conta limpa a nuvem.
   Precisa do emulador de login do Firebase (firebase emulators:start --only auth --project demo-atlas, porta 9099)
   e da pasta do pacote firebase@13.1.0 do npm em FIREBASE_DIR. O Firestore é imitado por tests/lib/firestore-falso.js
   com a "nuvem falsa" que este teste sobe na porta 8790. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const path=require("path"),fs=require("fs"),http=require("http");
const FD=process.env.FIREBASE_DIR;if(!FD){console.log("defina FIREBASE_DIR (pasta do pacote firebase@13.1.0)");process.exit(2)}
const {chromium}=require('playwright');
// ---- fake cloud
const docs=new Map();let ver=0;
const srv=http.createServer((q,r)=>{r.setHeader("Access-Control-Allow-Origin","*");const u=new URL(q.url,"http://x");
  if(q.method==="POST"&&u.pathname==="/write"){let b="";q.on("data",c=>b+=c);q.on("end",()=>{for(const o of JSON.parse(b)){ver++;docs.set(o.p,o.del?{del:true,v:ver}:{data:o.data,v:ver})}r.end("{}")});return}
  if(u.pathname==="/list"){const col=u.searchParams.get("col"),since=+u.searchParams.get("since");const out=[];
    for(const [p,d] of docs)if(p.split("/").slice(0,-1).join("/")===col&&d.v>since)out.push({id:p.split("/").pop(),data:d.data,del:!!d.del});
    r.end(JSON.stringify({v:ver,docs:out}));return}
  r.statusCode=404;r.end()});
const live=c=>[...docs].filter(([p,d])=>p.split("/")[2]===c&&!d.del);
const CFG={apiKey:"demo-key",authDomain:"demo-atlas.firebaseapp.com",projectId:"demo-atlas"};
const ACC=JSON.stringify({sub:"gui-123",email:"gui@teste.com",email_verified:true,name:"Gui Teste"});
const W=(id,date,title,kg)=>({id,date,title,planId:null,done:true,notes:"",items:[{name:"Supino reto",ref:null,target:"8-12",notes:"",sets:[{r:"10",kg:String(kg)}]}]});
const P=(id,name)=>({id,name,days:[],items:[{name:"Supino reto",sets:3,reps:"8-12"}]});
async function device(b,th,seed){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
  await ctx.route("https://www.gstatic.com/firebasejs/13.1.0/**",r=>{const n=new URL(r.request().url()).pathname.split("/").pop();
    const f=n==="firebase-firestore.js"?path.join(__dirname,"lib","firestore-falso.js"):path.join(FD,n);fs.existsSync(f)?r.fulfill({path:f,contentType:"application/javascript"}):r.abort()});
  const p=await ctx.newPage();p.setDefaultTimeout(30000);
  await p.addInitScript(([cfg,seed])=>{try{if(!localStorage.getItem("atlas-intro")){localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-fbtest",JSON.stringify(cfg));
    for(const k in seed)localStorage.setItem(k,JSON.stringify(seed[k]))}}catch(e){}},[CFG,seed]);
  p.on('pageerror',e=>errs.push(th+' '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts\.g|ERR_INTERNET_DISCONNECTED|Failed to fetch|ERR_FAILED/.test(m.text()))errs.push(th+' '+m.text())});
  await p.goto(BASE);await p.waitForTimeout(400);return {ctx,p}}
const errs=[];let bad=0;const ok=(c,m)=>{console.log((c?' ok  ':' ERRO')+' '+m);if(!c)bad++};
const until=async(p,fn,arg,ms=8000)=>{try{await p.waitForFunction(fn,arg,{timeout:ms,polling:150});return true}catch(e){return false}};
(async()=>{await new Promise(r=>srv.listen(8790,"127.0.0.1",r));
const b=await chromium.launch();
for(const th of ['dark','light']){docs.clear();
  // ---- device A: has 2 plans, 3 workouts, weight and name
  const A=await device(b,th,{"atlas-plans":[P("pa1","Peito A"),P("pa2","Costas A")],"atlas-workouts":[W("wa1","2026-11-10","T1",60),W("wa2","2026-11-12","T2",62),W("wa3","2026-11-14","T3",64)],
    "atlas-rank":{bw:80,man:[]},"atlas-conf":{fig:"2d",name:"Gui"}});
  await A.p.evaluate(()=>setTab("conf"));await A.p.waitForTimeout(600);
  ok(await A.p.$('[data-cact="login"]'),th+" botão Entrar com Google aparece");
  await A.p.evaluate(()=>document.querySelector('[data-cact="login"]').closest(".cf-row").scrollIntoView({block:"center"}));await A.p.screenshot({path:`${OUT}/conta-${th}-1-entrar.png`});
  await until(A.p,()=>!!SYNC);
  await A.p.evaluate(a=>SYNC.testLogin(a),ACC);
  ok(await until(A.p,()=>syncUser&&syncSt==="ok"),th+" A entrou e sincronizou");
  await A.p.waitForTimeout(800);
  ok(live("w").length===3&&live("p").length===2&&live("k").length===3,th+` A subiu tudo (nuvem: ${live("w").length} treinos, ${live("p").length} montados, ${live("k").length} ajustes)`);
  await A.p.evaluate(()=>document.querySelector('#syncSt').closest(".cf-row").scrollIntoView({block:"center"}));await A.p.screenshot({path:`${OUT}/conta-${th}-2-conectado.png`});
  // ---- device B: another phone with its own data, English language
  const B=await device(b,th,{"atlas-plans":[P("pb1","Pernas B")],"atlas-workouts":[W("wb1","2026-11-15","TB",100)],"atlas-conf":{fig:"2d",lang:"en"}});
  await B.p.evaluate(()=>setTab("conf"));await until(B.p,()=>!!SYNC);await B.p.evaluate(a=>SYNC.testLogin(a),ACC);
  ok(await until(B.p,()=>plans.length===3&&workouts.length===4),th+" B juntou: "+JSON.stringify(await B.p.evaluate(()=>[plans.length,workouts.length])));
  ok(await until(A.p,()=>plans.length===3&&workouts.length===4),th+" A recebeu o do B: "+JSON.stringify(await A.p.evaluate(()=>[plans.length,workouts.length])));
  let s=await B.p.evaluate(()=>({lang:CONF.lang,name:CONF.name,bw:rank.bw,order:plans.map(x=>x.id).join()}));
  ok(s.lang==="en"&&s.bw===80&&s.name==="Gui",th+" B: idioma ficou o dele, peso e nome vieram da conta "+JSON.stringify(s));
  ok(await until(A.p,()=>rank.bw===80&&CONF.name==="Gui"),th+" A não perdeu peso nem nome com a entrada do B");
  // ---- new workout on A appears on B; deleting a plan on B disappears on A
  await A.p.evaluate(()=>{workouts.push({id:"wa4",date:"2026-11-17",title:"Novo",planId:null,done:true,notes:"",items:[]});saveW()});
  ok(await until(B.p,()=>workouts.some(w=>w.id==="wa4")),th+" treino novo do A apareceu no B");
  await B.p.evaluate(()=>{plans=plans.filter(x=>x.id!=="pa2");savePlans()});
  ok(await until(A.p,()=>!plans.some(x=>x.id==="pa2")),th+" treino apagado no B sumiu no A");
  // ---- edit a set's load on B, A sees it
  await B.p.evaluate(()=>{const w=workouts.find(x=>x.id==="wa1");w.items[0].sets[0].kg="70";saveW()});
  ok(await until(A.p,()=>workouts.find(x=>x.id==="wa1").items[0].sets[0].kg==="70"),th+" carga mudada no B chegou no A");
  // ---- settings: name changed on A reaches B
  await A.p.evaluate(()=>{CONF.name="Guilherme";saveConf()});
  ok(await until(B.p,()=>CONF.name==="Guilherme"&&CONF.lang==="en"),th+" nome mudado no A chegou no B (idioma do B ficou)");
  // ---- B offline: keeps the change and sends when back
  await B.ctx.setOffline(true);await B.p.waitForTimeout(300);
  await B.p.evaluate(()=>{workouts.push({id:"wb2",date:"2026-11-18",title:"Offline",planId:null,done:true,notes:"",items:[]});saveW()});
  await B.p.waitForTimeout(1500);
  ok(!await A.p.evaluate(()=>workouts.some(w=>w.id==="wb2")),th+" sem internet não chegou (ainda)");
  const offTxt=await B.p.evaluate(()=>{setTab("conf");return syncSt});ok(offTxt==="offline",th+" B mostra sem internet: "+offTxt);
  await B.p.evaluate(()=>document.querySelector('#syncSt').closest(".cf-row").scrollIntoView({block:"center"}));await B.p.screenshot({path:`${OUT}/conta-${th}-3-offline.png`});
  await B.ctx.setOffline(false);
  ok(await until(A.p,()=>workouts.some(w=>w.id==="wb2"),null,12000),th+" internet voltou: chegou no A");
  // ---- reload B: still signed in, no duplicates
  await B.p.reload();await B.p.waitForTimeout(500);
  ok(await until(B.p,()=>syncUser&&syncSt==="ok"),th+" B recarregou e continua conectado");
  await B.p.waitForTimeout(1200);
  s=await B.p.evaluate(()=>({w:workouts.length,ids:new Set(workouts.map(w=>w.id)).size,p:plans.length}));ok(s.w===s.ids&&s.w===6&&s.p===2,th+" sem duplicar "+JSON.stringify(s));
  // ---- sign out on B: data stays on the device
  await B.p.evaluate(()=>setTab("conf"));await B.p.waitForTimeout(300);await B.p.click('[data-cact="logout"]');await B.p.waitForLoadState();await B.p.waitForTimeout(1200);
  s=await B.p.evaluate(()=>({u:syncUser,w:workouts.length,login:!!document.querySelector('[data-cact="login"]')}));
  ok(!s.u&&s.w===6,th+" Sair: dados ficam no aparelho "+JSON.stringify(s));
  // ---- delete account on A: the cloud is emptied, the device keeps its data
  await A.p.evaluate(()=>setTab("conf"));await A.p.waitForTimeout(300);await A.p.click('[data-cact="delAcct"]');await A.p.waitForTimeout(200);
  await A.p.evaluate(()=>document.querySelector('[data-cact="delAcct!"]').scrollIntoView({block:"center"}));await A.p.screenshot({path:`${OUT}/conta-${th}-4-apagar.png`});
  await A.p.click('[data-cact="delAcct!"]');await A.p.waitForTimeout(2500);
  ok(live("w").length===0&&live("p").length===0&&live("k").length===0,th+" Apagar minha conta limpou a nuvem");
  s=await A.p.evaluate(()=>({u:syncUser,w:workouts.length}));ok(!s.u&&s.w===6,th+" A continua com os dados no aparelho "+JSON.stringify(s));
  await A.ctx.close();await B.ctx.close()}
// ---- without the Firebase project the row stays "em breve" (only while FB_CFG is empty)
{const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();await p.addInitScript(()=>{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-conf",'{"fig":"2d"}')});
 await p.goto(BASE);await p.waitForTimeout(300);await p.evaluate(()=>setTab("conf"));await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({cfg:!!FB_CFG,login:!!document.querySelector('[data-cact="login"]')}));ok(r.cfg?r.login:!r.login,"sem projeto: "+JSON.stringify(r));await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();srv.close();process.exit(bad||errs.length?1:0)})();
