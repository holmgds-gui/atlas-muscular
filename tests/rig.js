/* Articulações do esqueleto 3D (0.68, etapa 1 da animação): 3d/rig-N.json / rig-f-N.json carregam, os centros ficam
   simétricos e dentro do esqueleto, os ossos não mudam de comprimento ao dobrar, cada movimento vai para o lado certo
   (flexão do ombro leva o braço para a frente, do joelho leva a perna para trás, dorsiflexão sobe o pé…) e a
   amplitude (ROM) é respeitada. Prints em tests/out/rig-*.png. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[];
for(const sx of ['m','f']){
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:'pt-BR'})).newPage();
p.on('pageerror',e=>errs.push(sx+' '+e.message));
await p.addInitScript(s=>{localStorage.setItem("atlas-intro","1");localStorage.setItem("atlas-sex",s);localStorage.setItem("atlas-conf",JSON.stringify({fig:"3d"}))},sx);
await p.goto(BASE);await p.waitForFunction(()=>window.V3&&V3.keys().length>10,null,{timeout:60000});
await p.evaluate(()=>{setMode('art');setXr('esq')});await p.waitForFunction(()=>V3.rigReady(),null,{timeout:60000});await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const J=V3.rigJoints(),ids=Object.keys(J),pos=id=>V3.jointPos(id),d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  const out={n:ids.length,asym:[],len:[],dir:[],rom:null};
  for(const id of ids.filter(k=>k.endsWith('_d'))){const a=pos(id),e=pos(id.replace(/_d$/,'_e'));if(!e)continue;const m=Math.hypot(a[0]+e[0],a[1]-e[1],a[2]-e[2]);if(m>0.006)out.asym.push(id+' '+(m*1000).toFixed(1)+'mm')}
  const L=()=>[d(pos('ombro_d'),pos('cotovelo_d')),d(pos('cotovelo_d'),pos('punho_d')),d(pos('quadril_d'),pos('joelho_d')),d(pos('joelho_d'),pos('tornozelo_d')),d(pos('mcf3_d'),pos('ifp3_d'))];
  const L0=L();
  const test=(P,fn)=>{V3.pose(P);const r=fn();V3.pose({});return r};
  const sh=pos('ombro_d');
  out.dir.push(['ombro flex 90 → cotovelo à frente, na altura do ombro',test({ombro_d:{flex:90,abd:0}},()=>{const c=pos('cotovelo_d'),s2=pos('ombro_d');return c[2]-s2[2]>0.2&&Math.abs(c[1]-s2[1])<0.05})]);
  out.dir.push(['ombro abd 90 → cotovelo para o lado, na altura do ombro',test({ombro_d:{abd:90,flex:0}},()=>{const c=pos('cotovelo_d'),s2=pos('ombro_d');return s2[0]-c[0]>0.2&&Math.abs(c[1]-s2[1])<0.05})]);
  const kn=pos('joelho_d');
  out.dir.push(['joelho flex 90 → tornozelo atrás',test({joelho_d:{flex:90}},()=>{const a=pos('tornozelo_d');return kn[2]-a[2]>0.3})]);
  out.dir.push(['quadril flex 90 → joelho à frente',test({quadril_d:{flex:90}},()=>{const k=pos('joelho_d'),h=pos('quadril_d');return k[2]-h[2]>0.3})]);
    const t0=pos('mtf2_d');out.dir.push(['dorsiflexão 20 → dedos sobem',test({tornozelo_d:{flex:20}},()=>pos('mtf2_d')[1]-t0[1]>0.015)]);
  out.dir.push(['flexão plantar → dedos descem',test({tornozelo_d:{flex:-40}},()=>t0[1]-pos('mtf2_d')[1]>0.02)]);
  const hd=pos('cabeca');out.dir.push(['coluna flex 40 → cabeça vai para a frente',test({coluna:{flex:40}},()=>pos('cabeca')[2]-hd[2]>0.1)]);
  const el=pos('cotovelo_d'),wr=pos('punho_d');out.dir.push(['cotovelo flex 120 → punho perto do ombro',test({cotovelo_d:{flex:120}},()=>d(pos('punho_d'),sh)<d(wr,sh)*0.7)]);
  const n0=pos('cabeca');out.dir.push(['cabeça flex 10 → nuca acima, ponto de giro no lugar',test({cabeca:{flex:10}},()=>d(pos('cabeca'),n0)<1e-6)]);
  const L1=(V3.pose({ombro_d:{flex:120,abd:40,rot:30},cotovelo_d:{flex:110},quadril_d:{flex:100,abd:20,rot:20},joelho_d:{flex:120},mcf3_d:{flex:90},coluna:{flex:30,rot:20}}),L());V3.pose({});
  out.len=L0.map((x,i)=>Math.abs(x-L1[i])*1000).filter(x=>x>0.5).map(x=>x.toFixed(2)+'mm');
  out.rom=test({joelho_d:{flex:400}},()=>{const a=pos('tornozelo_d');return {z:a[2]}});
  out.rom2=test({joelho_d:{flex:140}},()=>{const a=pos('tornozelo_d');return {z:a[2]}});
  return out});
console.log(sx,'articulações',r.n,'assimetria',r.asym.slice(0,6),'comprimento mudou',r.len);r.dir.forEach(x=>console.log('  ',x[1]?'ok ':'FALHA',x[0]));
if(r.n<100)errs.push(sx+' poucas articulações');if(r.asym.length)errs.push(sx+' assimetria '+r.asym.join(', '));if(r.len.length)errs.push(sx+' osso mudou de tamanho');
r.dir.forEach(x=>{if(!x[1])errs.push(sx+' '+x[0])});if(Math.abs(r.rom.z-r.rom2.z)>1e-6)errs.push(sx+' ROM não limitou');
// prints: poses
for(const [n,P,deg] of [['bracos',{ombro_d:{flex:90,abd:0},cotovelo_d:{flex:90},ombro_e:{abd:170,flex:0}},70],['agachar',{quadril_d:{flex:100,abd:15},quadril_e:{flex:100,abd:15},joelho_d:{flex:115},joelho_e:{flex:115},tornozelo_d:{flex:20},tornozelo_e:{flex:20},lombar:{flex:10},ombro_d:{flex:90,abd:0},ombro_e:{flex:90,abd:0}},90]]){
  await p.evaluate(P=>V3.pose(P),P);await p.evaluate(d=>V3.look(d),deg);await p.waitForTimeout(900);await p.screenshot({path:`${OUT}/rig-${sx}-${n}.png`})}
await p.context().close()}
console.log('errs',errs);await b.close();process.exit(errs.length?1:0)})();
