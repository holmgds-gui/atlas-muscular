/* Confere que how/pt.json, en.json e es.json têm os mesmos exercícios, o mesmo número de passos/dicas/erros
   e as mesmas dicas de variação; e que cada dica aponta para um eixo/opção que existe no app. Não precisa de navegador. */
const fs=require("fs"),path=require("path"),R=path.join(__dirname,"..");
const s=fs.readFileSync(path.join(R,"index.html"),"utf8");const a=s.indexOf("const FAMS=")+11;let d=0,i=a;for(;i<s.length;i++){if(s[i]=="[")d++;if(s[i]=="]"){d--;if(!d)break}}
const F=JSON.parse(s.slice(a,i+1));const H={};for(const l of ["pt","en","es"])H[l]=JSON.parse(fs.readFileSync(path.join(R,"how",l+".json"),"utf8"));
const bad=[];for(const f of F){const p=H.pt[f.id];if(!p){bad.push("falta "+f.id);continue}
  for(const vk of Object.keys(p.v||{})){const [ax,o]=vk.split(".");const A=f.ax.find(x=>x[0]===ax);if(!A||!A[3].some(x=>x.k===o))bad.push(f.id+" dica de variação inválida "+vk)}
  for(const l of ["en","es"]){const q=H[l][f.id];if(!q){bad.push(l+" falta "+f.id);continue}
    for(const k of ["s","d","e"])if(p[k].length!==q[k].length)bad.push(`${l} ${f.id}.${k} ${p[k].length}/${q[k].length}`);
    if(!!p.c!==!!q.c)bad.push(l+" "+f.id+".c");if(Object.keys(p.v||{}).sort().join()!==Object.keys(q.v||{}).sort().join())bad.push(l+" "+f.id+".v")}}
console.log("famílias",F.length,"problemas",bad.length?bad:"nenhum");process.exitCode=bad.length?1:0;
