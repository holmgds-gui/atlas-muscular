const fs=require("fs");
const C={ps:'peito_superior',pm:'peito_medial',pi:'peito_inferior',of:'ombro_frontal',ol:'ombro_lateral',op:'ombro_posterior',
bl:'biceps_longa',bc:'biceps_curta',br:'braquial',tl:'triceps_longa',tlat:'triceps_lateral',tmed:'triceps_medial',
brr:'antebraco_braquiorradial',afl:'antebraco_flexores',aex:'antebraco_extensores',ts:'trapezio_superior',tmid:'trapezio_medio',ti:'trapezio_inferior',
rb:'romboides',ie:'infraespinhal',rm:'redondo_maior',ds:'dorsal_superior',di:'dorsal_inferior',le:'lombar_eretores',sa:'serratil',
as:'abdomen_supra',ai:'abdomen_infra',ob:'obliquos',gm:'gluteo_maximo',gmed:'gluteo_medio',tfl:'abdutores',ad:'adutores',
rf:'quad_reto_femoral',vl:'quad_vasto_lateral',vm:'quad_vasto_medial',bf:'isquio_biceps_femoral',st:'isquio_semitendineo',ga:'panturrilha_gastro',so:'panturrilha_soleo'};
const RC=Object.fromEntries(Object.entries(C).map(([k,v])=>[v,k]));
const F=[...require("./fam1.js").F,...require("./fam2.js").F,...require("./fam3.js").F];
const MAP=require("./map.js");
const errs=[];const FB={};
for(const f of F){
  if(FB[f.id])errs.push("id duplicado "+f.id);FB[f.id]=f;
  const chk=(str,where)=>str.split(/\s+/).filter(Boolean).forEach(t=>{const c=t.replace(/^[*~^+-]/,"");if(!C[c])errs.push(`${f.id} ${where}: código ${c}`)});
  chk(f.p,"p");chk(f.s,"s");
  const keys=new Set();
  for(const [k,lab,sp,opts] of f.ax){if(keys.has(k))errs.push(f.id+" eixo repetido "+k);keys.add(k);
    const ok=new Set();opts.forEach(op=>{if(ok.has(op.k))errs.push(`${f.id}.${k} opção repetida ${op.k}`);ok.add(op.k);if(op.m)chk(op.m,k+"."+op.k)});
    if(!(k in f.d))errs.push(`${f.id} sem padrão para ${k}`);else if(!ok.has(f.d[k]))errs.push(`${f.id} padrão inválido ${k}=${f.d[k]}`)}
  for(const k in f.d)if(!keys.has(k))errs.push(`${f.id} padrão de eixo inexistente ${k}`);
}
function resolve(f,sel){
  let p=f.p.split(/\s+/).filter(Boolean),s=f.s.split(/\s+/).filter(Boolean);
  const rm=(a,x)=>a.filter(y=>y!==x);
  for(const [k,,,opts] of f.ax){const op=opts.find(o=>o.k===sel[k]);if(!op||!op.m)continue;
    for(const t of op.m.split(/\s+/)){const c=t.slice(1),op_=t[0];
      if(op_==="*"){s=rm(s,c);if(!p.includes(c))p.push(c)}
      else if(op_==="~"){p=rm(p,c);s=rm(s,c);s.unshift(c)}
      else if(op_==="^"){if(!p.includes(c)){s=rm(s,c);s.unshift(c)}}
      else if(op_==="+"){if(!p.includes(c)&&!s.includes(c))s.push(c)}
      else if(op_==="-"){p=rm(p,c);s=rm(s,c)}}}
  return {p,s};
}
const splitKey=(f,sel)=>f.id+"|"+f.ax.filter(a=>a[2]).map(a=>a[0]+"="+sel[a[0]]).join(",");
const ref=(f,sel)=>f.id+"|"+f.ax.map(a=>a[0]+"="+sel[a[0]]).join(",");
// old data
const html=fs.readFileSync(process.argv[2],"utf8");
const a=html.indexOf("const M = {"),b=html.indexOf("const GROUPS");
const M=eval("("+html.slice(a+"const M = ".length,b).trim().replace(/;$/,"")+")");
const LEG={};const eq0={};let before=0,after=0;const out={};const usedFam=new Set();
for(const [id,m] of Object.entries(M)){
  const seen=new Set();const xs=[];
  for(const x of m.x){before++;
    const mp=MAP[x[1]];if(!mp){errs.push("sem mapa: "+x[1]);continue}
    const f=FB[mp[0]];if(!f){errs.push("família inexistente "+mp[0]);continue}
    for(const k in mp[1])if(!f.ax.find(a=>a[0]===k&&a[3].some(o=>o.k===mp[1][k])))errs.push(`${x[1]}: opção inválida ${k}=${mp[1][k]}`);
    const sel={...f.d,...mp[1]};const r=resolve(f,sel);
    if(!r.p.includes(RC[id])&&!r.s.includes(RC[id]))errs.push(`${id} / ${x[1]} -> ${ref(f,sel)}: músculo da lista não aparece (${r.p.join(" ")} | ${r.s.join(" ")})`);
    LEG[x[0]]=ref(f,sel);if(!eq0[f.id])eq0[f.id]=x[2];usedFam.add(f.id);
    const key=splitKey(f,sel);if(seen.has(key))continue;seen.add(key);
    xs.push(x[5]?[ref(f,sel),x[3],x[5]]:[ref(f,sel),x[3]]);after++;
  }
  out[id]={...m,x:xs};
}
// new families placed at the end of lists (biomechanics)
const NEW=[["abdomen_supra","vup"],["abdomen_infra","vup"],["lombar_eretores","rackpull"],["trapezio_superior","rackpull"]];
for(const [mid,fid] of NEW){const f=FB[fid];out[mid].x.push([ref(f,f.d),"B"]);after++;usedFam.add(fid)}
for(const f of F){if(!usedFam.has(f.id))errs.push("família sem lista: "+f.id);f.eq0=eq0[f.id]||(f.ax.find(a=>a[0]==="e")?null:"C")}
if(errs.length){console.log("ERROS:\n"+errs.join("\n"));process.exit(1)}
// combos count
let combos=0;for(const f of F)combos+=f.ax.reduce((a,x)=>a*x[3].length,1);
console.log("famílias",F.length,"entradas antes",before,"depois",after,"combinações",combos);
const famOut=F.map(f=>({id:f.id,n:f.n,en:f.en,aka:f.aka,p:f.p,s:f.s,d:f.d,eq0:f.eq0,ax:f.ax.map(([k,l,sp,opts])=>[k,l,sp?1:0,opts.map(o=>{const r={k:o.k,n:o.n};for(const z of ["eq","m","t","nm","suf","q"])if(o[z]!==undefined)r[z]=o[z];return r})])}));
const Mtxt="const M = {\n"+Object.entries(out).map(([id,m])=>`  ${id}:{n:${JSON.stringify(m.n)},l:${JSON.stringify(m.l)},c:${JSON.stringify(m.c)},s:${JSON.stringify(m.s)},x:[\n`+m.x.map(e=>"    "+JSON.stringify(e)).join(",\n")+"]}").join(",\n")+"\n};\n";
fs.writeFileSync("out_M.js",Mtxt);
fs.writeFileSync("out_FAMS.js","const MC="+JSON.stringify(C)+";\nconst FAMS="+JSON.stringify(famOut)+";\nconst LEGACY="+JSON.stringify(LEG)+";\n");
for(const [id,m] of Object.entries(out))console.log(id.padEnd(26),M[id].x.length,"->",m.x.length);
