/* Exercise families. Codes are short muscle ids (see C in build.js).
   F: id, n (name), en, aka (gym names for search), p (target muscles), s (synergists),
   ax: [[axisKey, label, split?, [options]]], d: defaults.
   Option: {k, n (label), eq?, m (mods), t (note), nm (replaces name), suf (appended to name), q (quiet in name)}
   Mods: *x make target · ~x make synergist (front) · ^x move/add synergist to front · +x add synergist · -x remove */
const o=(k,n,x={})=>({k,n,...x});
const EQ_={ba:o("ba","barra",{eq:"B"}),bw:o("bw","barra W",{eq:"B"}),ha:o("ha","halteres",{eq:"H"}),h1:o("ha","halter",{eq:"H"}),po:o("po","polia",{eq:"P"}),
  ma:o("ma","máquina",{eq:"M"}),sm:o("sm","Smith",{eq:"M"}),co:o("co","peso do corpo",{eq:"C"}),el:o("el","elástico",{eq:"K"}),kb:o("kb","kettlebell",{eq:"K"}),
  hx:o("hx","barra hexagonal",{eq:"B"}),lm:o("lm","landmine",{eq:"B"}),an:o("an","anilha",{eq:"K"})};
const E=(...ks)=>ks.map(k=>EQ_[k]);
const SIDE=["l","Lado",false,[o("bi","dois lados",{q:1}),o("un","um lado só",{t:"Unilateral: corrige diferença entre os lados e exige mais estabilidade do tronco."})]];
const SIDEARM=["l","Braços",false,[o("bi","dois braços",{q:1}),o("al","alternado",{t:"Alternado: um braço de cada vez, mais foco em cada lado."}),o("un","um braço",{t:"Unilateral: mais foco e amplitude em cada lado."})]];
const SIDELEG=["l","Pernas",false,[o("bi","duas pernas",{q:1}),o("un","uma perna",{t:"Uma perna: corrige diferença entre os lados."})]];
const SIDEBAL=["l","Pernas",false,[o("bi","duas pernas",{q:1}),o("un","uma perna",{t:"Uma perna em pé ou apoiada: mais glúteo médio para equilibrar; corrige diferença entre os lados.",m:"+gmed"})]];
const BENCH=(def)=>["b","Banco",true,[o("re","reto",{suf:" reto"}),o("in","inclinado",{suf:" inclinado",m:"*ps ~pm ^of -pi",t:"Inclinado (~30°): mais peitoral superior e deltoide anterior (Rodríguez-Ridao 2020)."}),o("de","declinado",{suf:" declinado",m:"*pi -ps ^tlat",t:"Declinado: mais peitoral inferior e tríceps, menos ombro."})]];
const F=[
/* ======== PEITO ======== */
{id:"supino",n:"Supino",en:"Bench press",aka:["supino","bench","chest press","supino maquina","supino articulado","supino smith","supino reto","supino inclinado","supino declinado"],
 p:"pm",s:"ps pi of tlat tmed",ax:[BENCH(),
  ["e","Equipamento",false,[o("ba","barra",{eq:"B"}),o("ha","halteres",{eq:"H",t:"Halteres: mais amplitude embaixo e cada lado trabalha sozinho."}),o("sm","Smith",{eq:"M",t:"Smith: trilho fixo, mais estável."}),o("ma","máquina",{eq:"M",t:"Máquina: mais estável, fácil de levar perto da falha."})]],
  ["w","Largura",false,[o("md","média",{q:1}),o("ab","aberta",{m:"^of -tmed",t:"Pegada aberta: menos tríceps; mais carga no peito e no ombro."}),o("fe","fechada",{nm:"Supino fechado",m:"*tlat *tmed ^tl",t:"Pegada fechada: o tríceps vira músculo principal."})]],
  ["g","Pegada",false,[o("pr","pronada",{q:1}),o("ne","neutra (halteres)",{m:"^tlat ^of",t:"Neutra: cotovelos junto ao corpo, mais tríceps e mais confortável para o ombro."}),o("su","supinada (invertida)",{m:"*ps ^of",t:"Supinada (invertida): mais peitoral superior."})]]],
 d:{b:"re",e:"ba",w:"md",g:"pr"}},
{id:"crucifixo",n:"Crucifixo",en:"Chest fly",aka:["crucifixo","voador","pec deck","peck deck","fly","crossover","cross over","crucifixo maquina"],
 p:"pm",s:"ps pi of bc",ax:[["b","Banco / direção",true,[o("re","reto",{suf:" reto",t:"Na polia: cabos na altura do peito."}),o("in","inclinado",{suf:" inclinado",m:"*ps ~pm ^of -pi",t:"Inclinado ou polia de baixo para cima: mais peitoral superior."}),o("de","declinado",{suf:" declinado",m:"*pi -ps",t:"Declinado, polia de cima para baixo ou tronco inclinado à frente: mais peitoral inferior."})]],
  ["e","Equipamento",false,[o("ha","halteres",{eq:"H",t:"Halteres: mais tensão com o peito alongado, embaixo."}),o("po","polia (crossover)",{eq:"P",t:"Polia: tensão no movimento todo."}),o("ma","máquina (voador)",{eq:"M",t:"Máquina: estável, fácil de ir perto da falha."})]],SIDEARM],
 d:{b:"re",e:"ma",l:"bi"}},
{id:"landmine",n:"Supino no landmine",en:"Landmine press",aka:["landmine"],p:"ps of",s:"sa tlat tmed pm",ax:[["e","Equipamento",false,E("lm")],SIDEARM],d:{e:"lm",l:"bi"}},
{id:"flexao",n:"Flexão de braço",en:"Push-up",aka:["flexao","flexão","push up","apoio"],p:"pm",s:"ps of tlat tmed sa",
 ax:[["b","Inclinação",true,[o("ch","no chão",{q:1}),o("pe","pés elevados",{nm:"Flexão declinada",m:"*ps ~pm ^of",t:"Pés elevados: mais peitoral superior e ombro."}),o("ma","mãos elevadas",{nm:"Flexão inclinada",m:"*pi -ps",t:"Mãos elevadas: mais fácil e mais peitoral inferior."})]],
  ["w","Mãos",true,[o("md","largura dos ombros",{q:1}),o("ab","abertas",{m:"-tmed",t:"Mãos abertas: mais peito, menos tríceps."}),o("fe","juntas (diamante)",{nm:"Flexão diamante",m:"*tlat *tl *tmed ~pm",t:"Mãos juntas: tríceps vira o principal."})]],
  ["e","Apoio",false,[o("co","chão",{eq:"C",q:1}),o("bo","bola suíça",{eq:"C",m:"+as",t:"Instável: mais abdômen."}),o("tr","suspensa (TRX)",{eq:"K",m:"+as",t:"Suspensa: mais estabilidade de ombro e abdômen."})]]],
 d:{b:"ch",w:"md",e:"co"}},
{id:"mergulho",n:"Mergulho",en:"Dips",aka:["mergulho","paralelas","dips","triceps banco","mergulho no banco"],p:"tlat tl tmed",s:"pm pi of",
 ax:[["p","Tronco",true,[o("er","tronco reto",{q:1,t:"Tronco reto: mais tríceps."}),o("fr","tronco à frente",{m:"*pi *pm ~tmed ~tl ~tlat ^of",t:"Tronco à frente: mais peito (inferior)."})]],
  ["e","Equipamento",true,[o("co","paralelas",{eq:"C",q:1}),o("ma","máquina / assistido",{eq:"M"}),o("bc","banco (atrás do corpo)",{eq:"C",nm:"Mergulho no banco",m:"-pm ^of",t:"No banco: mais tríceps e ombro; desça só até onde o ombro não incomoda."})]]],
 d:{p:"er",e:"co"}},
/* ======== OMBROS ======== */
{id:"desenv",n:"Desenvolvimento",en:"Shoulder press",aka:["desenvolvimento","militar","overhead press","arnold","press de ombro"],p:"of ol",s:"tlat tl ts sa ps",
 ax:[["e","Equipamento",false,E("ha","ba","ma","sm")],["p","Posição",false,[o("se","sentado"),o("pe","em pé",{m:"+as",t:"Em pé: mais abdômen e estabilidade."})]],
  ["g","Pegada",false,[o("pr","pronada",{q:1}),o("ne","neutra",{m:"^tlat",t:"Neutra: mais confortável para o ombro, mais deltoide anterior."}),o("ar","Arnold (girando)",{nm:"Desenvolvimento Arnold",t:"Arnold: gira as palmas no caminho, mais amplitude para o deltoide anterior."})]],SIDEARM],
 d:{e:"ha",p:"se",g:"pr",l:"bi"}},
{id:"elevfront",n:"Elevação frontal",en:"Front raise",aka:["elevacao frontal","front raise"],p:"of",s:"ps ol sa ts bl",
 ax:[["e","Equipamento",false,[EQ_.ha,EQ_.po,EQ_.an,EQ_.ba]],["g","Pegada",false,[o("pr","pronada",{q:1}),o("ne","neutra"),o("su","supinada",{m:"^ps ^bl",t:"Supinada: um pouco mais peitoral superior e bíceps."})]],SIDEARM],d:{e:"ha",g:"pr",l:"bi"}},
{id:"pike",n:"Flexão pike",en:"Pike push-up",aka:["pike","flexao de ombro"],p:"of",s:"tlat tl ps ol sa ts",ax:[["b","Pés",false,[o("ch","pés no chão",{q:1}),o("pe","pés elevados",{m:"*ol",t:"Pés elevados: mais carga, mais perto de um desenvolvimento."})]]],d:{b:"ch"}},
{id:"elevlat",n:"Elevação lateral",en:"Lateral raise",aka:["elevacao lateral","lateral raise","abducao de ombro"],p:"ol",s:"ts of sa op",
 ax:[["e","Equipamento",false,[EQ_.ha,EQ_.po,EQ_.ma,EQ_.el]],
  ["p","Posição",false,[o("pe","em pé"),o("se","sentado",{t:"Sentado: menos impulso do corpo."}),o("la","inclinado para o lado",{t:"Inclinado para o lado (lean-away): mais tensão no começo do movimento."}),o("ld","deitado de lado",{t:"Deitado de lado: tensão maior embaixo."}),o("ct","cabo por trás do corpo",{t:"Cabo por trás do corpo: mais tensão com o deltoide alongado."})]],
  ["c","Cotovelo",false,[o("es","levemente dobrado",{q:1}),o("fl","dobrado a 90°",{t:"Cotovelo dobrado: alavanca menor, mais leve para o ombro."})]],SIDEARM],
 d:{e:"ha",p:"pe",c:"es",l:"bi"}},
{id:"yraise",n:"Elevação em Y",en:"Y raise",aka:["y raise","elevacao y"],p:"ti ol",s:"tmid sa op ie ts",
 ax:[["e","Equipamento",false,[o("po","polia (em pé)",{eq:"P",m:"^sa ^of"}),o("ha","halteres (deitado de bruços)",{eq:"H",m:"^tmid ^ie -sa",t:"De bruços: mais trapézio inferior e médio."})]]],d:{e:"po"}},
{id:"iyt",n:"Elevações I-Y-T de bruços",en:"Prone I-Y-T raises",aka:["iyt","i y t"],p:"tmid ti",s:"op rb ie ol",ax:[["e","Equipamento",false,[o("ha","halteres leves",{eq:"H"}),o("co","sem peso",{eq:"C"})]]],d:{e:"ha"}},
{id:"tbrucos",n:"Abdução horizontal deitado de bruços (T)",en:"Prone horizontal abduction",aka:["t raise"],p:"tmid",s:"op rb ie ol",ax:[["e","Equipamento",false,[o("ha","halteres leves",{eq:"H"}),o("co","sem peso",{eq:"C"})]]],d:{e:"ha"}},
{id:"remalta",n:"Remada alta",en:"Upright row",aka:["remada alta","upright row"],p:"ol ts",s:"of bl br tmid",
 ax:[["e","Equipamento",false,E("ba","bw","ha","po","sm")],["w","Largura",false,[o("md","média",{q:1}),o("ab","aberta",{m:"^op",t:"Aberta: mais deltoide lateral e mais seguro para o ombro."}),o("fe","fechada",{m:"*ts ~ol",t:"Fechada: mais trapézio superior; pode incomodar o ombro."})]]],d:{e:"ba",w:"md"}},
{id:"crucinv",n:"Crucifixo inverso",en:"Reverse fly",aka:["crucifixo inverso","voador inverso","peck deck inverso","rear delt","pull apart"],p:"op",s:"tmid rb ie ol",
 ax:[["e","Equipamento",false,[o("ma","máquina (voador inverso)",{eq:"M"}),EQ_.ha,o("po","polia",{eq:"P"}),EQ_.el]],
  ["p","Posição",false,[o("se","sentado"),o("in","peito apoiado no banco inclinado",{t:"Peito apoiado: sem ajuda da lombar."}),o("pe","em pé"),o("cr","polia cruzada",{t:"Polia cruzada: tensão o tempo todo no deltoide posterior."})]],SIDEARM],
 d:{e:"ma",p:"se",l:"bi"}},
{id:"facepull",n:"Face pull",en:"Face pull",aka:["face pull","puxada para o rosto"],p:"op ie",s:"tmid rb ti ol",ax:[["e","Equipamento",false,[o("po","polia com corda",{eq:"P"}),EQ_.el]],["p","Posição",false,[o("pe","em pé"),o("se","sentado")]]],d:{e:"po",p:"pe"}},
{id:"rotext",n:"Rotação externa",en:"External rotation",aka:["rotacao externa","manguito","external rotation"],p:"ie",s:"op",
 ax:[["e","Equipamento",false,[EQ_.po,EQ_.el,EQ_.h1]],["p","Posição",false,[o("pe","em pé, braço colado"),o("ld","deitado de lado"),o("90","braço a 90°",{m:"+ti",t:"Braço a 90°: posição de arremesso, mais trapézio inferior."})]]],d:{e:"po",p:"pe"}},
{id:"cuban",n:"Cuban press",en:"Cuban press",aka:["cuban"],p:"ie op",s:"ol ts tmid of",ax:[["e","Equipamento",false,[EQ_.ha,EQ_.bw]]],d:{e:"ha"}},
];
module.exports={F,o,EQ_,E,SIDE,SIDEARM,SIDELEG,SIDEBAL};
