/* copia o site (pasta de cima) para www/, que é o que vai dentro do app nativo. Só o que o app usa:
   nada de testes, ferramentas, documentos ou o app de Windows. */
const fs=require("fs"),path=require("path");
const SRC=path.join(__dirname,".."),OUT=path.join(__dirname,"www");
const KEEP=["index.html","sw.js","manifest.webmanifest","design2.css","design2.js","sync.js","privacidade.html","suporte.html","pagina.css","pagina.js",
  "icon-180.png","icon-192.png","icon-512.png","icon-mask-512.png","logo.png","logo-m.png","how","fonts","vendor","intro","3d"];
const SKIP3D=/\.(py|tsv|md)$/;   // o 3d/ só leva o visualizador, os modelos e as juntas
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const cp=(a,b)=>{const st=fs.statSync(a);if(st.isDirectory()){fs.mkdirSync(b,{recursive:true});for(const f of fs.readdirSync(a))cp(path.join(a,f),path.join(b,f))}
  else if(!SKIP3D.test(a))fs.copyFileSync(a,b)};
for(const k of KEEP){const a=path.join(SRC,k);if(fs.existsSync(a))cp(a,path.join(OUT,k));else console.warn("faltou",k)}
let n=0,sz=0;const walk=d=>{for(const f of fs.readdirSync(d)){const p=path.join(d,f),s=fs.statSync(p);if(s.isDirectory())walk(p);else{n++;sz+=s.size}}};walk(OUT);
console.log(`www/: ${n} arquivos, ${(sz/1048576).toFixed(1)} MB`);
