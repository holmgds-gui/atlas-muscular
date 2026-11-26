/* Segurança (0.61): textos que a pessoa digita ou que chegam num backup/na conta não podem virar código na página.
   Põe "texto de ataque" em todos os campos (nome, treinos, títulos, notas, nomes de exercício, carga, cardio,
   conquistas) e abre todas as telas; nenhum script pode rodar e nenhum <img>/<svg> do ataque pode aparecer. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const {chromium}=require("playwright");
const X=`"><img src=x onerror="window.__xss=(window.__xss||0)+1"><svg onload="window.__xss=(window.__xss||0)+1">'\`<script>window.__xss=(window.__xss||0)+1</script>`;
(async()=>{const b=await chromium.launch();const bad=[];const errs=[];
for(const lang of ["pt","en"]){
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:lang==="pt"?"pt-BR":"en-US",timezoneId:"America/Sao_Paulo"});const p=await c.newPage();
p.on("pageerror",e=>errs.push(e.message));p.on("dialog",d=>{bad.push("dialog: "+d.message());d.dismiss()});
await p.addInitScript(([X,lang])=>{if(sessionStorage.getItem("s"))return;sessionStorage.setItem("s",1);
  const d=new Date(),iso=x=>new Date(d.getTime()-x*864e5).toISOString().slice(0,10);
  localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-login","1");
  localStorage.setItem("atlas-conf",JSON.stringify({fig:"2d",name:X,lang}));
  localStorage.setItem("atlas-plans",JSON.stringify([{id:"p"+X,name:X,days:[0,1,2,3,4,5,6],items:[{name:X,ref:X,sets:X,reps:X},{name:"Supino reto",sets:3,reps:"8-12"},{name:X,ref:"cardio:"+X,min:X,int:X}]}]));
  localStorage.setItem("atlas-workouts",JSON.stringify([{id:"w1",date:iso(0),title:X,planId:"p"+X,done:true,notes:X,dur:X,items:[{name:X,ref:X,target:X,notes:X,sets:[{r:X,kg:X,ok:true}]},{name:"Supino reto",target:"8-12",notes:X,sets:[{r:"10",kg:"60"},{r:"8",kg:X}]},{name:"Cardio",ref:"cardio:run",target:X,sets:[{min:X,km:X,int:X}]}]},{id:"w2"+X,date:X,title:X,done:true,items:[]}]));
  localStorage.setItem("atlas-rank",JSON.stringify({bw:X,sex:"m",age:X,man:[{id:X,ref:X,kg:X,r:X,date:X},{id:"m2",ref:"supino|b=re",kg:80,r:5,date:iso(1)}]}));
  localStorage.setItem("atlas-ach",JSON.stringify({seen:[X],lvMax:X,shared:X}));
  localStorage.setItem("atlas-live",JSON.stringify({wid:"w1",i:0,j:0}));
},[X,lang]);
await p.goto(BASE);await p.waitForTimeout(800);
const pages=[()=>setTab("atlas"),()=>{fView="mine";setTab("ficha")},()=>{fView="prontos";setTab("ficha")},()=>{hView="reg";setTab("treino")},()=>{hView="live";setTab("treino")},()=>{pView="mus";setTab("prog")},()=>{pView="kg";setTab("prog")},()=>setTab("ach"),()=>setTab("conf")];
const where=async n=>{const r=await p.evaluate(()=>{const o=[...document.querySelectorAll('img[src="x"],svg[onload],[onerror]')].map(e=>{let a=e.parentElement,path=[];for(let i=0;i<4&&a;i++){path.push(a.tagName.toLowerCase()+(a.id?"#"+a.id:"")+(a.className&&typeof a.className==="string"?"."+a.className.split(" ").join("."):""));a=a.parentElement}return path.join(" < ")});document.querySelectorAll('img[src="x"],svg[onload],[onerror]').forEach(e=>e.remove());return o});if(r.length&&process.env.WHERE)console.log("  ["+n+"]",r.slice(0,4).join("\n    "))};
let pi=0;for(const f of pages){await p.evaluate(f).catch(e=>errs.push("nav "+e.message));await p.waitForTimeout(350);
  await p.evaluate(()=>document.querySelectorAll("details").forEach(d=>d.open=true));await p.waitForTimeout(150);await where("page"+(pi++))}
// abrir treinos, picker, busca com o texto, menu de contexto, cartão para Stories
await p.evaluate(()=>{fView="mine";setTab("ficha")});await p.waitForTimeout(300);
for(const sel of ["[data-pid]",".plan summary",".plan"]){const e=await p.$(sel);if(e){await e.click().catch(()=>{});await p.waitForTimeout(250)}}
await p.evaluate(X=>{try{openSearch();const i=document.querySelector(".sfield input,#q,input[type=search]");if(i){i.value=X;i.dispatchEvent(new Event("input",{bubbles:true}))}}catch(e){}},X);await p.waitForTimeout(500);
await p.evaluate(()=>{try{closeSearch()}catch(e){}});
for(const k of ["week","rank","workout","ach"]){await p.evaluate(k=>{try{return makeCard(k)}catch(e){}},k).catch(()=>{});await p.waitForTimeout(300)}
const r=await p.evaluate(()=>({x:window.__xss||0,img:[...document.querySelectorAll('img[src="x"],svg[onload],[onerror]')].length}));
console.log(lang,JSON.stringify(r));if(r.x||r.img)bad.push(lang+" XSS "+JSON.stringify(r));await c.close()}
// backup com texto de ataque, importado pelas Configurações
{const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();p.on("dialog",d=>{bad.push("dialog");d.dismiss()});
 await p.addInitScript(()=>{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-login","1");localStorage.setItem("atlas-conf",JSON.stringify({fig:"2d"}))});
 await p.goto(BASE);await p.waitForTimeout(600);await p.evaluate(()=>setTab("conf"));await p.waitForTimeout(300);
 const bk={app:"atlas-muscular",version:2,plans:[{id:X,name:X,days:[1],items:[{name:X,sets:3,reps:X}]}],workouts:[{id:X,date:X,title:X,done:true,notes:X,items:[{name:X,notes:X,sets:[{r:X,kg:X}]}]},{bad:1},"x"],rank:{bw:X,man:[{id:X,ref:X,kg:X,r:X,date:X}]},conf:{name:X,accent:X,"__proto__":{polluted:1}}};
 await p.setInputFiles("#importFile",{name:"b.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(bk))});await p.waitForTimeout(500);
 await p.evaluate(()=>{const b=document.querySelector('[data-cact="doImport"]');b&&b.click()});await p.waitForTimeout(500);
 for(const f of [()=>{fView="mine";setTab("ficha")},()=>{hView="reg";setTab("treino")},()=>{pView="kg";setTab("prog")},()=>setTab("conf")]){await p.evaluate(f);await p.waitForTimeout(300);await p.evaluate(()=>document.querySelectorAll("details").forEach(d=>d.open=true))}
 const r=await p.evaluate(()=>({x:window.__xss||0,img:document.querySelectorAll('img[src="x"],svg[onload],[onerror]').length,pol:({}).polluted||0,n:workouts.length}));console.log("backup",JSON.stringify(r));if(r.x||r.img||r.pol)bad.push("backup "+JSON.stringify(r));await c.close()}
console.log(errs.length?errs.slice(0,8):"sem erros de página");console.log(bad.length?"FALHOU "+bad.join(" | "):"OK");await b.close();process.exit(bad.length?1:0)})();
