/* Exercícios novos da 0.24 (pedido do dono): Pulldown (braços estendidos), Remada alta para trapézio, Supino sentado,
   Rosca 45, Dead bug, Canoinha (hollow), Escalador, Encolhimento Kelso e Seal row.
   Confere: a busca acha cada um pelo nome da academia; o nome certo aparece; os músculos (alvo e sinergistas) batem com
   os estudos; cada um aparece nas listas dos músculos certos; "Como fazer" abre com texto; inglês e espanhol traduzidos. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
// [search words, expected name, family, selection, targets that must be there, muscle lists where it must appear]
const CASES=[
  ["pulldown","Pulldown (braços estendidos)","pulldown",{},["dorsal_superior","dorsal_inferior","redondo_maior"],["dorsal_superior","dorsal_inferior","redondo_maior"]],
  ["remada alta para trapezio","Remada alta para trapézio","remalta",{w:"tr"},["trapezio_superior","ombro_lateral"],["trapezio_superior","trapezio_medio"]],
  ["supino sentado","Supino sentado","supino",{e:"ms"},["peito_medial"],[]],
  ["rosca 45","Rosca 45 (banco inclinado)","rinclinada",{},["biceps_longa"],["biceps_longa"]],
  ["dead bug","Dead bug","deadbug",{},["abdomen_supra","abdomen_infra","obliquos"],["abdomen_supra","abdomen_infra","obliquos"]],
  ["canoinha","Canoinha (hollow)","hollow",{},["abdomen_supra","abdomen_infra"],["abdomen_supra","abdomen_infra"]],
  ["escalador","Escalador (mountain climber)","escalador",{},["abdomen_supra"],["abdomen_supra"]],
  ["kelso","Encolhimento Kelso","kelso",{},["trapezio_medio","romboides"],["trapezio_medio","romboides"]],
  ["seal row","Seal row","remapoiada",{e:"sb"},["trapezio_medio","dorsal_superior"],[]],
  // 0.56 (owner: "pesquise mais exercícios que não tem")
  ["svend","Svend press","svend",{},["peito_medial"],["peito_medial"]],
  ["floor press","Supino no chão","supino",{b:"ch"},["peito_medial"],["peito_medial"]],
  ["z press","Desenvolvimento Z","desenv",{p:"zp"},["ombro_frontal"],[]],
  ["bananeira","Flexão plantando bananeira","hspu",{},["ombro_frontal"],["ombro_frontal"]],
  ["tate","Tate press","tate",{},["triceps_lateral"],["triceps_lateral"]],
  ["pendlay","Remada Pendlay","pendlay",{},["dorsal_superior"],["dorsal_superior"]],
  ["renegade","Remada em prancha (renegade row)","renegade",{},["obliquos"],["obliquos"]],
  ["muscle up","Muscle-up","muscleup",{},["dorsal_superior"],["dorsal_superior"]],
  ["l sit","L-sit","lsit",{},["abdomen_infra"],["abdomen_infra"]],
  ["pull through","Pull-through na polia","pullthrough",{},["gluteo_maximo"],["gluteo_maximo"]],
  ["hiperextensao reversa","Hiperextensão reversa","revhyper",{},["gluteo_maximo"],["gluteo_maximo"]],
  ["afundo cruzado","Afundo cruzado","afundo",{dir:"cz"},["gluteo_maximo"],["gluteo_medio"]],
  ["zercher","Agachamento Zercher","agach",{e:"ze"},["quad_vasto_lateral"],[]],
  ["toes to bar","Pés até a barra","elevpernas",{j:"tb"},["abdomen_infra"],[]],
  ["frog pump","Frog pump","hipthrust",{ap:"fp",e:"co"},["gluteo_maximo"],["gluteo_maximo"]]];
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;const ok=(c,m)=>{console.log((c?' ok  ':' ERRO')+' '+m);if(!c)bad++};
for(const [loc,th] of [["pt-BR","dark"],["en-US","light"],["es-ES","light"]]){
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,colorScheme:th,locale:loc});
  const p=await ctx.newPage();await p.addInitScript(()=>{try{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-conf",'{"fig":"2d"}')}catch(e){}});
  p.on('pageerror',e=>errs.push(loc+' '+e.message));
  await p.goto(BASE);await p.waitForTimeout(500);await p.evaluate(()=>loadHow());
  for(const [q,name,fid,sel,tg,lists] of CASES){
    const r=await p.evaluate(([q,fid,sel,tg,lists])=>{const f=FAMBY[fid];const s={...f.d,...sel};const v=resolveV(f,s);
      const hits=famSearch(q).slice(0,3).map(h=>h.f.id);
      const inLists=lists.filter(m=>M[m].x.some(e=>e.f.id===fid));
      return {name:vName(f,s),top:hits,targets:tg.filter(m=>v.p.includes(m)),syn:v.s,inLists,}},[q,fid,sel,tg,lists]);
    if(loc==="pt-BR"){
      ok(r.name.startsWith(name),`nome "${r.name}"`);
      ok(r.top.includes(fid),`busca "${q}" acha ${fid} (${r.top.join(",")})`);
      ok(r.targets.length===tg.length,`${fid}: alvos ${tg.join(",")} → ${r.targets.join(",")} · sinergistas ${r.syn.join(",")}`);
      ok(r.inLists.length===lists.length,`${fid}: nas listas ${lists.join(",")||"(card já existente)"}`);
    }else ok(r.name!==name||["Dead bug","Seal row","Tate press","Muscle-up","L-sit","Svend press","Frog pump"].includes(name),`${loc} traduzido: ${r.name}`);
  }
  // open Dead bug in the Atlas list of lower abs, with its Como fazer
  await p.evaluate(()=>{setTab("atlas");selectMuscle("abdomen_infra")});await p.waitForTimeout(400);
  const idx=await p.evaluate(()=>M.abdomen_infra.x.findIndex(e=>e.f.id==="deadbug"));
  await p.evaluate(i=>selectExercise(i),idx);await p.waitForTimeout(400);
  await p.evaluate(()=>{const d=document.querySelector("details.how");if(d){d.open=true;d.dispatchEvent(new Event("toggle"))}});await p.waitForTimeout(1200);
  const how=await p.evaluate(()=>{const d=document.querySelector("details.how");return d?d.innerText.length:0});ok(how>200,loc+" Como fazer do Dead bug abre ("+how+" letras)");
  await p.evaluate(()=>document.querySelector("details.how").scrollIntoView({block:"start"}));await p.screenshot({path:`${OUT}/exercicios-novos-${loc}-deadbug.png`});
  // Pulldown card in the lats list
  await p.evaluate(()=>{selectMuscle("dorsal_superior");const i=M.dorsal_superior.x.findIndex(e=>e.f.id==="pulldown");selectExercise(i)});await p.waitForTimeout(500);
  await p.evaluate(()=>{const c=document.querySelector(".ex.open,.ex.on,.excard.open")||document.querySelector("details.how");if(c)c.scrollIntoView({block:"center"})});
  await p.screenshot({path:`${OUT}/exercicios-novos-${loc}-pulldown.png`});
  await ctx.close()}
console.log('errs',errs);console.log(bad?'FALHOU '+bad:'OK');await b.close();process.exit(bad||errs.length?1:0)})();
