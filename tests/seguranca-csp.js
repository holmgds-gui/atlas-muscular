/* Segurança (0.61): a política de conteúdo (CSP) não pode bloquear nada do próprio app.
   Abre todas as telas (2D e 3D), Stories, apresentação, login e o "Como fazer" e procura avisos de CSP no console. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const {chromium}=require("playwright");
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const v=[];
for(const mode of ["3d","2d"]){
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"pt-BR"});const p=await c.newPage();
p.on("console",m=>{if(/Content.Security.Policy|Refused to/i.test(m.text()))v.push(mode+": "+m.text().slice(0,200))});
await p.addInitScript(f=>{if(sessionStorage.getItem("s"))return;sessionStorage.setItem("s",1);localStorage.setItem("atlas-conf",JSON.stringify({fig:f}))},mode);
await p.goto(BASE+"?login");await p.waitForTimeout(1200);
await p.evaluate(()=>{try{lgDone&&lgDone()}catch(e){}const s=document.querySelector('[data-lg="skip"]');s&&s.click()});await p.waitForTimeout(600);
await p.evaluate(()=>{const s=document.getElementById("inSkip");s&&s.click()});await p.waitForTimeout(300);
if(mode==="3d")await p.waitForFunction(()=>window.V3&&document.getElementById("v3load").hidden,null,{timeout:120000}).catch(()=>v.push("3d não carregou"));
await p.evaluate(()=>{selectMuscle("peito_medial");render()});await p.waitForTimeout(400);await p.evaluate(()=>{selectExercise(0)});await p.waitForTimeout(300);
await p.evaluate(()=>{const d=document.querySelector("details.how");if(d){d.open=true;d.dispatchEvent(new Event("toggle"))}});await p.waitForTimeout(800);
for(const f of [()=>{fView="mine";setTab("ficha")},()=>{fView="prontos";setTab("ficha")},()=>{hView="reg";setTab("treino")},()=>{hView="live";setTab("treino")},()=>{pView="mus";setTab("prog")},()=>{pView="kg";setTab("prog")},()=>setTab("ach"),()=>setTab("conf")]){await p.evaluate(f);await p.waitForTimeout(700)}
await p.waitForTimeout(1500);
for(const k of ["week","ach"]){await p.evaluate(k=>{try{return makeCard(k)}catch(e){}},k).catch(()=>{});await p.waitForTimeout(1200)}
const sw=await p.evaluate(()=>navigator.serviceWorker&&navigator.serviceWorker.ready.then(()=>true).catch(()=>false));
console.log(mode,"service worker",sw);await c.close()}
console.log(v.length?v.slice(0,12):"sem bloqueios de CSP");await b.close();process.exit(v.length?1:0)})();
