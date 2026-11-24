/* Tela de login da 1ª vez e entrar com e-mail (pedido do dono, 0.47).
   - aparelho novo: a tela de login aparece antes do carrossel; "Continuar sem conta" abre o carrossel; não volta ao recarregar;
   - Configurações › Entrar com e-mail: cria a conta (com nome) num aparelho que já tem treinos, que sobem para a conta;
   - outro aparelho novo: senha errada mostra o aviso; senha certa entra, traz os treinos e PULA o carrossel;
   - conta nova sem treinos: depois do login vem o carrossel; "Esqueci a senha" manda o e-mail.
   Precisa do emulador de login (firebase emulators:start --only auth --project demo-atlas, porta 9099) e do pacote
   firebase@13.1.0 em FIREBASE_DIR, como o tests/conta.js. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");
const path=require("path"),fs=require("fs"),http=require("http");fs.mkdirSync(OUT,{recursive:true});
const FD=process.env.FIREBASE_DIR;if(!FD){console.log("defina FIREBASE_DIR (pasta do pacote firebase@13.1.0)");process.exit(2)}
const {chromium}=require("playwright");
const docs=new Map();let ver=0;
const srv=http.createServer((q,r)=>{r.setHeader("Access-Control-Allow-Origin","*");const u=new URL(q.url,"http://x");
  if(q.method==="POST"&&u.pathname==="/write"){let b="";q.on("data",c=>b+=c);q.on("end",()=>{for(const o of JSON.parse(b)){ver++;docs.set(o.p,o.del?{del:true,v:ver}:{data:o.data,v:ver})}r.end("{}")});return}
  if(u.pathname==="/list"){const col=u.searchParams.get("col"),since=+u.searchParams.get("since");const out=[];
    for(const [p,d] of docs)if(p.split("/").slice(0,-1).join("/")===col&&d.v>since)out.push({id:p.split("/").pop(),data:d.data,del:!!d.del});
    r.end(JSON.stringify({v:ver,docs:out}));return}
  r.statusCode=404;r.end()});
const CFG={apiKey:"demo-key",authDomain:"demo-atlas.firebaseapp.com",projectId:"demo-atlas"};
const W=(id,date,title)=>({id,date,title,planId:null,done:true,notes:"",items:[{name:"Supino reto",ref:null,target:"8-12",notes:"",sets:[{r:"10",kg:"60"}]}]});
const errs=[];let bad=0;const ok=(c,m)=>{console.log((c?" ok  ":" ERRO")+" "+m);if(!c)bad++};
const until=async(p,fn,arg,ms=10000)=>{try{await p.waitForFunction(fn,arg,{timeout:ms,polling:150});return true}catch(e){return false}};
async function device(b,th,seed){const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:"pt-BR",timezoneId:"America/Sao_Paulo"});
  await ctx.route("https://www.gstatic.com/firebasejs/13.1.0/**",r=>{const n=new URL(r.request().url()).pathname.split("/").pop();
    const f=n==="firebase-firestore.js"?path.join(__dirname,"lib","firestore-falso.js"):path.join(FD,n);fs.existsSync(f)?r.fulfill({path:f,contentType:"application/javascript"}):r.abort()});
  const p=await ctx.newPage();p.setDefaultTimeout(30000);
  await p.addInitScript(([cfg,seed])=>{try{if(!localStorage.getItem("atlas-fbtest")){localStorage.setItem("atlas-fbtest",JSON.stringify(cfg));
    for(const k in seed)localStorage.setItem(k,JSON.stringify(seed[k]))}}catch(e){}},[CFG,seed||{}]);
  p.on("pageerror",e=>errs.push(th+" "+e.message));
  await p.goto(BASE);await p.waitForTimeout(500);return {ctx,p}}
const vis=(p,id)=>p.evaluate(id=>!document.getElementById(id).hidden,id);
(async()=>{await new Promise(r=>srv.listen(8790,"127.0.0.1",r));
const b=await chromium.launch();
for(const th of ["dark","light"]){docs.clear();const mail=`gui.${th}.${Date.now()}@teste.com`;
  // 1) aparelho novo: login antes do carrossel; pular abre o carrossel
  const N=await device(b,th);
  ok(await vis(N.p,"login")&&!await vis(N.p,"intro"),th+": aparelho novo abre a tela de login (e não o carrossel)");
  await N.p.screenshot({path:path.join(OUT,`login-${th}.png`)});
  await N.p.click('[data-lg="skip"]');await N.p.waitForTimeout(300);
  ok(!await vis(N.p,"login")&&await vis(N.p,"intro"),th+": Continuar sem conta abre o carrossel");
  await N.p.click("#inSkip");await N.p.reload();await N.p.waitForTimeout(500);
  ok(!await vis(N.p,"login")&&!await vis(N.p,"intro"),th+": recarregar não mostra login nem carrossel de novo");
  await N.ctx.close();
  // 2) aparelho com treinos: Configurações › Entrar com e-mail › Criar conta
  const A=await device(b,th,{"atlas-intro":1,"atlas-workouts":[W("wa1","2026-11-10","T1"),W("wa2","2026-11-12","T2")]});
  ok(!await vis(A.p,"login"),th+": quem já usa o app não vê a tela de login");
  await A.p.evaluate(()=>setTab("conf"));await A.p.waitForTimeout(300);
  await A.p.click('[data-cact="emLogin"]');await until(A.p,()=>!!SYNC);
  await A.p.click('#gBody [data-em="mode"]');
  await A.p.fill('#gBody [name=nm]',"Gui");await A.p.fill('#gBody [name=em]',mail);await A.p.fill('#gBody [name=pw]',"123");await A.p.click("#gBody .em-go");
  ok(/6 caracteres/.test(await A.p.textContent("#gBody .em-msg")),th+": senha curta avisa");
  await A.p.fill('#gBody [name=pw]',"segredo1");await A.p.click("#gBody .em-go");
  ok(await until(A.p,()=>syncUser&&syncUser.email&&$("gSheet").hidden),th+": criar conta com e-mail entra e fecha a janela");
  ok(await until(A.p,()=>syncUser.name==="Gui"),th+": nome da conta nova = o que a pessoa escreveu");
  ok(await until(A.p,()=>1,null,100)&&await (async()=>{for(let i=0;i<60;i++){if([...docs.keys()].filter(k=>/\/w\//.test(k)).length>=2)return true;await A.p.waitForTimeout(200)}return false})(),th+": os treinos do aparelho subiram para a conta");
  await A.p.evaluate(()=>renderConf());await A.p.screenshot({path:path.join(OUT,`login-conta-${th}.png`)});
  // 3) outro aparelho novo: senha errada, depois certa → treinos chegam e o carrossel é pulado
  const B=await device(b,th);
  ok(await vis(B.p,"login"),th+": 2º aparelho novo mostra o login");
  await until(B.p,()=>!!SYNC);
  await B.p.fill("#lgBox [name=em]",mail);await B.p.fill("#lgBox [name=pw]","errada1");await B.p.click("#lgBox .em-go");
  ok(await until(B.p,()=>/errados/.test($("lgBox").querySelector(".em-msg").textContent)),th+": senha errada mostra \"E-mail ou senha errados\"");
  await B.p.fill("#lgBox [name=pw]","segredo1");await B.p.click("#lgBox .em-go");
  ok(await until(B.p,()=>$("login").hidden,null,15000),th+": senha certa entra e fecha a tela de login");
  ok(await B.p.evaluate(()=>workouts.length===2&&$("intro").hidden&&LS.get("atlas-intro",0)),th+": conta com treinos: os treinos chegam e o carrossel é pulado");
  // 4) conta nova sem treinos: depois do login vem o carrossel; esqueci a senha
  const C=await device(b,th);await until(C.p,()=>!!SYNC);
  await C.p.fill("#lgBox [name=em]",mail);await C.p.click('#lgBox [data-em="reset"]');
  ok(await until(C.p,()=>/mandamos um link/.test($("lgBox").querySelector(".em-msg").textContent)),th+": Esqueci a senha manda o e-mail");
  await C.p.click('#lgBox [data-em="mode"]');await C.p.fill("#lgBox [name=em]","novo."+mail);await C.p.fill("#lgBox [name=pw]","segredo2");await C.p.click("#lgBox .em-go");
  ok(await until(C.p,()=>$("login").hidden&&!$("intro").hidden,null,15000),th+": conta nova sem treinos: depois do login abre o carrossel");
  for(const d of [A,B,C])await d.ctx.close()}
console.log(errs.length?errs:"sem erros de página");await b.close();srv.close();process.exit(bad||errs.length?1:0)})();
