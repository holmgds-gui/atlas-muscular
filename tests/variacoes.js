/* Sinergistas de cada exercício e variação nos modelos Detalhado e Básico; toda combinação tem alvo; nomes antigos resolvem. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
const p=await b.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE);await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const out={checks:0,problems:[]};setView('both');
 for(const model of ['det','bas']){setModel(model);const ids=model==='det'?Object.keys(M):Object.keys(BASIC);
  for(const id of ids){cur=id;curEx=null;eq='all';paint();render();
   const list=filtered();
   list.forEach((x,i)=>{const save={...x.sel};
     const variants=[{...x.pre}];x.f.ax.forEach(([k,,,opts])=>opts.forEach(o=>{if(o.k!==x.pre[k])variants.push({...x.pre,[k]:o.k})}));
     for(const v of variants){Object.assign(x.sel,v);fillEntry(x);curEx=i;paint();out.checks++;
       const expect=new Set();x[4].forEach(s=>{if(model==='bas'){const g=TOB[s];if(g!==cur)BASIC[g].m.forEach(m=>expect.add(m))}else if(s!==cur)expect.add(s)});
       const got=new Set([...document.querySelectorAll('.syn[data-m]')].map(e=>e.dataset.m));
       for(const m of expect)if(!got.has(m))out.problems.push(`${model}:${id} ${x[0]} falta ${m}`);
       if(!x[0]||!x[2])out.problems.push('sem nome/eq '+x[6]);
       if(x.p.length===0)out.problems.push('sem alvo '+x[6]);}
     Object.assign(x.sel,save);fillEntry(x);});
  }}
 // every combination resolves to at least one target and has a unique-ish name
 let combos=0,noT=0;for(const f of FAMS){const rec=(i,sel)=>{if(i===f.ax.length){combos++;if(!resolveV(f,sel).p.length)noT++;return}for(const o of f.ax[i][3])rec(i+1,{...sel,[f.ax[i][0]]:o.k})};rec(0,{})}
 out.combos=combos;out.noTarget=noT;
 // legacy names resolve
 out.legacyMissing=Object.keys(LEGACY).filter(n=>!exInfo(n)).length;
 return out});
console.log('verificações',r.checks,'combinações',r.combos,'sem alvo',r.noTarget,'nomes antigos sem músculos',r.legacyMissing,'problemas',r.problems.length,r.problems.slice(0,10));
console.log('erros',errs);await b.close()})();
