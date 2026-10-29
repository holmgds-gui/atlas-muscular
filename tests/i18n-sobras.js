/* Compara as coletas: textos em en/es iguais a um texto em português (e com letras) são sobras sem tradução.
   Uso: node tests/i18n-coleta.js pt && node tests/i18n-coleta.js en && node tests/i18n-coleta.js es && node tests/i18n-sobras.js */
const fs=require("fs"),path=require("path"),OUT=path.join(__dirname,"out");
const rd=l=>JSON.parse(fs.readFileSync(path.join(OUT,"crawl-"+l+".json"),"utf8"));
const pt=new Set(rd("pt").map(x=>x.t));
/* nomes próprios e textos que são iguais nos idiomas; muitas palavras também são iguais em espanhol (Básico, Máquina, Músculos…), então leia a lista com calma */
const OK=new Set(["Muscle Atlas","MUSCLE","ATLAS","Smith","Push","Pull","Legs","kg","Reps","EMG","Arnold","TRX","Scott"]);
for(const l of ["en","es"]){const left=rd(l).filter(x=>pt.has(x.t)&&/[a-zà-ú]{3}/i.test(x.t)&&!OK.has(x.t)&&/[ãõçáéíóúâêô]|\b(de|do|da|com|para|treino|séries|exercício)\b/i.test(x.t));
  console.log(l,"possíveis sobras:",left.length);left.slice(0,60).forEach(x=>console.log("  ["+x.tag+"] "+x.t.slice(0,120)))}
