/* Cardio vale meio treino (pedido do dono): só cardio com 20 min+ (forte conta em dobro) = 0,5; menos = 0;
   no dia que já tem musculação não soma. Vale para o 🔥, a contagem da semana em Hoje e as conquistas de treinos. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require("playwright");
(async()=>{const b=await chromium.launch();const errs=[],bad=[];
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,timezoneId:"America/Sao_Paulo",locale:"pt-BR"});
const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1")}catch(e){}});p.on("pageerror",e=>errs.push(e.message));
await p.clock.setFixedTime(new Date("2026-11-07T10:00:00-03:00")); // sábado
await p.goto(BASE);await p.waitForTimeout(300);
await p.evaluate(()=>{localStorage.clear();localStorage.setItem("atlas-intro","1");
  const f=FAMBY.supino,sel={...f.d},str=d=>({id:"s"+d,date:d,title:"Peito",done:true,notes:"",items:[{name:vName(f,sel),ref:mkRef(f,sel),target:"8-12",notes:"",sets:[{r:"8",kg:"80"}]}]});
  const car=(d,k,min,int,id)=>({id:id||"c"+d+k,date:d,title:"Cardio",done:true,notes:"",items:[{name:k,ref:"cardio:"+k,target:"",notes:"",sets:[{min:String(min),km:"",int,ok:true}]}]});
  const W=[
    // semana passada (26/10–1/11): 2 musculação + 2 cardios de 30 min = 3 → semana vale
    str("2026-10-27"),str("2026-10-29"),car("2026-10-30","run",30,"m"),car("2026-10-31","bike",30,"m"),
    // esta semana (2–8/11): 2 musculação + cardio no mesmo dia (não soma) + cardio de 10 min forte (=20, vale) + caminhada de 15 min (não vale)
    str("2026-11-02"),car("2026-11-02","walk",40,"m","x1"),str("2026-11-04"),car("2026-11-05","hiit",10,"f"),car("2026-11-06","walk",15,"l")];
  localStorage.setItem("atlas-workouts",JSON.stringify(W))});
await p.reload();await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const u=wUnits(workouts);return {units:workouts.map(w=>[w.date,w.items[0].ref,u(w)]),streak:streakNow(),S:(()=>{const S=achStats();return {n:S.n,best:S.best,thisWeek:S.thisWeek}})()}});
console.log(JSON.stringify(r));
const v=Object.fromEntries(r.units.map(([d,ref,x])=>[d+" "+ref,x]));
const exp={"2026-10-30 cardio:run":.5,"2026-10-31 cardio:bike":.5,"2026-11-02 cardio:walk":0,"2026-11-05 cardio:hiit":.5,"2026-11-06 cardio:walk":0};
for(const k in exp)if(v[k]!==exp[k])bad.push(k+" = "+v[k]+" (esperado "+exp[k]+")");
if(r.S.n!==5.5)bad.push("total de treinos "+r.S.n);if(r.S.thisWeek!==2.5)bad.push("semana atual "+r.S.thisWeek);
if(r.streak!==1)bad.push("sequência "+r.streak);
await p.evaluate(()=>setTab("treino"));await p.waitForTimeout(200);
const head=await p.evaluate(()=>document.querySelector(".card .muted-s").textContent);console.log("Hoje:",head);if(!/2,5 treinos/.test(head))bad.push("Hoje não mostra 2,5: "+head);
await p.screenshot({path:`${OUT}/cardio-conta.png`});
console.log("problemas",bad);console.log("errs",errs);await b.close()})();
