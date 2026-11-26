/* Etapas 1 e 2 da animação (0.76): músculos presos aos ossos (pele = SkinnedMesh) e "pés no chão, mãos na barra"
   (IK + pelve que anda/deita). Para ♂ e ♀: o corpo vira SkinnedMesh; dobrar o cotovelo mexe os músculos do antebraço
   junto (caixa do bíceps/antebraço muda); nas três poses de teste (agachamento, terra, supino) as mãos chegam a ≤ 2,5 cm
   da barra, os pés ficam no lugar e retos no chão, os joelhos não cruzam nem dobram para trás. A barra é um cilindro
   provisório (V3.marca) — os aparelhos são a etapa 3. Prints em tests/out/pose-<sexo>-<exercício>-<vista>.png. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[],fail=[];
for(const sx of (process.argv[2]?[process.argv[2]]:['m','f'])){
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,locale:'pt-BR'})).newPage();
p.on('pageerror',e=>errs.push(sx+' '+e.message));
await p.addInitScript(s=>{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-sex",s);localStorage.setItem("atlas-conf",JSON.stringify({fig:"3d"}))},sx);
await p.goto(BASE);await p.waitForFunction(()=>window.V3&&V3.keys().length>10&&V3.rigReady(),null,{timeout:90000});await p.waitForTimeout(600);
const ok=(c,m)=>{console.log((c?'ok   ':'FALHA ')+sx+' '+m);if(!c)fail.push(sx+' '+m)};
// 1) pele
const sk=await p.evaluate(()=>{const b0=V3.partBoxes();V3.pose({cotovelo_d:{flex:120},cotovelo_e:{flex:120}});const b1=V3.partBoxes();V3.pose({});
  const d=(a,b)=>Math.hypot(...a.min.map((x,i)=>x-b.min[i]))+Math.hypot(...a.max.map((x,i)=>x-b.max[i]));let moved=0;for(const id in b0)if(b1[id]&&d(b0[id],b1[id])>0.03)moved++;return {skinned:V3.skinned(),moved}});
ok(sk.skinned[0]===sk.skinned[1]&&sk.skinned[0]>30,`corpo preso aos ossos (${sk.skinned[0]} de ${sk.skinned[1]} partes com pele)`);ok(sk.moved>=6,`dobrar os cotovelos mexe os músculos (${sk.moved} partes)`);
// 2) poses
const R=await p.evaluate(()=>({ad:V3.jointPos('tornozelo_d'),ae:V3.jointPos('tornozelo_e')}));
const G={pegada_d:1,pegada_e:1};
const poses={
 agachamento:{...G,pelve:{pos:[0,-0.40,-0.13],flex:38},coluna:{flex:-4},cervical:{flex:-10},quadril_d:{abd:18,rot:-15},quadril_e:{abd:18,rot:-15},joelho_d:{flex:100},joelho_e:{flex:100},
   ombro_d:{abd:80,flex:10,rot:-70},ombro_e:{abd:80,flex:10,rot:-70},cotovelo_d:{flex:110},cotovelo_e:{flex:110},ik:{pe_d:{alvo:[R.ad[0]-0.07,R.ad[1],R.ad[2]],giro:20},pe_e:{alvo:[R.ae[0]+0.07,R.ae[1],R.ae[2]],giro:20}},bar:'costas'},
 terra:{...G,pelve:{pos:[0,-0.24,-0.22],flex:68},coluna:{flex:0},cervical:{flex:-22},quadril_d:{abd:8,rot:-8},quadril_e:{abd:8,rot:-8},joelho_d:{flex:40},joelho_e:{flex:40},
   ombro_d:{flex:20,abd:5},ombro_e:{flex:20,abd:5},cotovelo_d:{flex:0},cotovelo_e:{flex:0},ik:{pe_d:R.ad,pe_e:R.ae},bar:'chao'},
 supino:{...G,pelve:{pos:[0,-0.42,-0.05],flex:-90},coluna:{flex:-6},quadril_d:{flex:20,abd:20},quadril_e:{flex:20,abd:20},joelho_d:{flex:80},joelho_e:{flex:80},
   ombro_d:{abd:65,flex:10,rot:20},ombro_e:{abd:65,flex:10,rot:20},cotovelo_d:{flex:95},cotovelo_e:{flex:95},bar:'peito'},
};
for(const [n,P] of Object.entries(poses)){const bar=P.bar;delete P.bar;
  await p.evaluate(P=>V3.pose(P),P);
  const T=await p.evaluate(()=>{const g=id=>V3.jointPos(id);return {t1:g('T1'),t6:g('T6'),ad:g('tornozelo_d'),ae:g('tornozelo_e'),pv:g('pelve')}});
  let hd,he,barra;
  if(bar==='costas'){const up=[T.t1[0]-T.t6[0],T.t1[1]-T.t6[1],T.t1[2]-T.t6[2]],L=Math.hypot(...up),u=up.map(x=>x/L),bk=[0,u[2],-u[1]];
    barra=[0,T.t1[1]+bk[1]*0.085-u[1]*0.015,T.t1[2]+bk[2]*0.085-u[2]*0.015];hd=[-0.34,barra[1]-0.03,barra[2]+0.02];he=[0.34,barra[1]-0.03,barra[2]+0.02]}
  if(bar==='chao'){const z=(T.ad[2]+T.ae[2])/2+0.06;hd=[-0.24,0.275,z];he=[0.24,0.275,z];barra=[0,0.24,z]}
  if(bar==='peito'){const y=T.t6[1]+0.16,z=T.t6[2]+0.03;hd=[-0.30,y,z];he=[0.30,y,z];barra=[0,y+0.02,z]}
  P.ik={...(P.ik||{}),mao_d:hd,mao_e:he};
  if(n==='supino'){P.ik.pe_d=[-0.30,0.07,T.pv[2]+0.40];P.ik.pe_e=[0.30,0.07,T.pv[2]+0.40]}
  const r=await p.evaluate(P=>{V3.pose(P);const g=id=>V3.jointPos(id),d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
    const md=d(g('punho_d'),P.ik.mao_d),me=d(g('punho_e'),P.ik.mao_e),pd=P.ik.pe_d?d(g('tornozelo_d'),P.ik.pe_d.alvo||P.ik.pe_d):0;
    /* pé reto: o dedão fica na altura do calcanhar (±2 cm) */const toe=g('mtf1_d'),an=g('tornozelo_d');
    /* joelho à frente do plano quadril–tornozelo (não dobra para trás) e afastados (não cruzam) */
    const kd=g('joelho_d'),ke=g('joelho_e');return {md,me,pd,toe:toe[1]-an[1],kx:kd[0]-ke[0]}},P);
  ok(Math.max(r.md,r.me)<0.025,`${n}: mãos na barra (${(Math.max(r.md,r.me)*100).toFixed(1)} cm)`);
  ok(r.pd<0.01,`${n}: pé no alvo (${(r.pd*100).toFixed(1)} cm)`);
  ok(r.kx<-0.1,`${n}: joelhos afastados, sem cruzar (${(r.kx*100).toFixed(0)} cm)`);
  await p.evaluate(c=>V3.marca('barra',[-0.75,c[1],c[2]],[0.75,c[1],c[2]]),barra);
  for(const [v,deg,zo] of (n==='supino'?[['lado',90,-0.3],['3-4',35,-0.3]]:[['lado',90,0],['3-4',35,0]])){
    await p.evaluate(([deg,zo,s])=>V3.look(deg,s?2.6:2.4,s?0.28:0.32,0,zo),[deg,zo,n==='supino']);await p.waitForTimeout(900);
    await p.screenshot({path:`${OUT}/pose-${sx}-${n}-${v}.png`,clip:{x:0,y:170,width:390,height:460}})}
  await p.evaluate(()=>{V3.marca('barra',null);V3.pose({})});
}
await p.close()}
await b.close();
if(errs.length)console.log('ERROS',errs);console.log(fail.length||errs.length?`\n${fail.length} falha(s)`:'\ntudo ok');process.exit(fail.length||errs.length?1:0)})();
