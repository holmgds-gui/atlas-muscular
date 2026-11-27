/* Página "Como fazer" (0.77): botão no cartão do exercício ("▶ Ver movimento" nos 3 com movimento, "Ver no boneco" nos
   outros) abre a página; boneco 3D em cima — agachamento livre, terra e supino reto com barra se mexem (com barra,
   anilhas, banco/suporte), repetindo; ❚❚ pausa, 0,5× muda a velocidade; "Reduzir animações" abre pausado; nos outros, boneco
   parado com o alvo vermelho e "Movimento em breve"; folha com o guia arrasta para cima; Voltar e Esc fecham; pt/en/es;
   ♀ também; 0.78: modo Exercícios do Atlas e ossos escondidos fora de Articulações/Raio-X. Prints em tests/out/como-fazer-*.png (390 px, claro e escuro). */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});const errs=[],fail=[];
const ok=(c,m)=>{console.log((c?'ok   ':'FALHA ')+m);if(!c)fail.push(m)};
async function page(o){const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:o.loc||'pt-BR',colorScheme:o.theme||'light'})).newPage();
  p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(o=>{localStorage.setItem("atlas-intro","1");if(o.sex)localStorage.setItem("atlas-sex",o.sex);if(o.conf)localStorage.setItem("atlas-conf",JSON.stringify(o.conf))},o);
  await p.goto(BASE);await p.waitForTimeout(1200);return p}
const ready=p=>p.waitForFunction(()=>HP&&!HPbusy&&HP.rigReady(),null,{timeout:90000});
/* 1) cartão do Atlas → página com movimento */
{const p=await page({});
  await p.evaluate(()=>selectMuscle("quad_reto_femoral",false));await p.waitForTimeout(500);
  const i=await p.evaluate(()=>filtered().findIndex(x=>x.f&&x.f.id==="agach"));
  await p.evaluate(i=>{const x=filtered()[i];Object.assign(x.sel,{e:"ba",am:"pa",pe:"md"});howOpen=false;selectExercise(i)},i);await p.waitForTimeout(600);
  const lab=await p.evaluate(i=>{const b=document.querySelector(`.ex[data-i="${i}"] .how-pg`);return b&&b.textContent},i);
  ok(/Ver movimento/.test(lab||""),`botão no cartão: "${lab}"`);
  const closed=await p.evaluate(i=>!document.querySelector(`.ex[data-i="${i}"] details.how`).open,i);
  await p.click(`.ex[data-i="${i}"] .how-pg`);await ready(p);await p.waitForTimeout(1500);
  ok(closed&&await p.evaluate(i=>!document.querySelector(`.ex[data-i="${i}"] details.how`).open,i),'tocar no botão não abre a caixinha');
  const m1=await p.evaluate(()=>HP.motionInfo());ok(m1&&m1.key==="agach"&&m1.play,`página aberta, agachamento se mexendo (${JSON.stringify(m1&&{k:m1.key,t:+m1.t.toFixed(2)})})`);
  await p.waitForTimeout(800);const m2=await p.evaluate(()=>HP.motionInfo());ok(m2.t>m1.t+0.1,`o tempo anda (${m1.t.toFixed(2)} → ${m2.t.toFixed(2)})`);
  await p.click('#hpCtl [data-hp="pl"]');const t1=await p.evaluate(()=>HP.motionInfo().t);await p.waitForTimeout(600);
  ok(await p.evaluate(t=>!HP.motionInfo().play&&Math.abs(HP.motionInfo().t-t)<0.02,t1),'❚❚ pausa');
  await p.click('#hpCtl [data-hp="pl"]');await p.click('#hpCtl [data-hpspd="0.5"]');ok(await p.evaluate(()=>HP.motionInfo().play&&HP.motionInfo().speed===0.5),'▶ volta e 0,5× deixa mais devagar');
  for(const u of [0,1]){await p.evaluate(u=>HP.still(u),u);await p.waitForTimeout(700);await p.screenshot({path:`${OUT}/como-fazer-agach-${u}.png`})}
  /* folha do guia */
  const h0=await p.evaluate(()=>$("hpSh").getBoundingClientRect().height);
  const g=await p.locator('#hpGrab').boundingBox();await p.mouse.move(g.x+g.width/2,g.y+g.height/2);await p.mouse.down();await p.mouse.move(g.x+g.width/2,g.y-250,{steps:8});await p.mouse.up();await p.waitForTimeout(700);
  const h1=await p.evaluate(()=>$("hpSh").getBoundingClientRect().height);ok(h1>h0+150,`arrastar a alça sobe o guia (${Math.round(h0)} → ${Math.round(h1)} px)`);
  await p.screenshot({path:`${OUT}/como-fazer-guia.png`});
  /* 0.82 (dono: "dar para baixar a descrição para ficar em tela cheia"): arrastar para baixo esconde o guia (fica só a alça) */
  for(let k=0;k<2;k++){const g2=await p.locator('#hpGrab').boundingBox();await p.mouse.move(g2.x+g2.width/2,g2.y+g2.height/2);await p.mouse.down();await p.mouse.move(g2.x+g2.width/2,g2.y+g2.height/2+700,{steps:10});await p.mouse.up();await p.waitForTimeout(700)}
  const hid=await p.evaluate(()=>({h:$("hpSh").getBoundingClientRect().height,st:$("hpStage").getBoundingClientRect().height,cls:$("hpIn").classList.contains("hp-hid")}));
  ok(hid.cls&&hid.h<80&&hid.st>600,`arrastar para baixo deixa o boneco em tela cheia (guia ${Math.round(hid.h)} px, boneco ${Math.round(hid.st)} px)`);
  await p.screenshot({path:`${OUT}/como-fazer-tela-cheia.png`});
  await p.click('#hpGrab');await p.waitForTimeout(800);{const r=await p.evaluate(()=>({lv:hpLv,h:Math.round($("hpSh").getBoundingClientRect().height)}));ok(r.lv===1&&r.h>250,`tocar na alça traz o guia de volta (${JSON.stringify(r)})`)}
  await p.click('#hpBack');await p.waitForTimeout(400);ok(await p.evaluate(()=>$("howPg").hidden&&!HP.motionInfo()),'Voltar fecha e para o movimento');
  /* menu de segurar: item da página */
  await p.close()}
/* 2) os 3 movimentos com aparelhos, ♂ e ♀, claro/escuro */
for(const [sx,theme] of [["m","light"],["f","dark"]]){const p=await page({sex:sx,theme});
  for(const [f,sel] of [["agach",{}],["terra",{}],["supino",{}]]){
    await p.evaluate(([f,sel])=>openHowPage(FAMBY[f],sel),[f,sel]);await ready(p);await p.waitForTimeout(900);
    const r=await p.evaluate(()=>{const I=HP.motionInfo();HP.still(0.5);const g=id=>HP.jointPos(id),d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),bar=HP.motionInfo().bar;
      return {k:I&&I.key,hand:Math.max(Math.abs(g('punho_d')[1]-bar[1]),Math.abs(g('punho_e')[1]-bar[1])),sx:HP.sexNow()}});
    ok(r.k===f&&r.sx===sx,`${sx} ${f}: movimento com o corpo certo`);
    ok(r.hand<0.12,`${sx} ${f}: mãos na altura da barra (${(r.hand*100).toFixed(1)} cm)`);
    /* 0.81: a barra passa por dentro dos dedos fechados e, no terra, não atravessa as pernas em nenhum momento */
    const g=await p.evaluate(()=>{let gr=0,gap=9;for(let i=0;i<=10;i++){HP.still(i/10);const I=HP.motionInfo();gr=Math.max(gr,I.grip);if(I.legGap!=null)gap=Math.min(gap,I.legGap)}return {gr,gap}});
    ok(g.gr<0.012,`${sx} ${f}: barra dentro da mão fechada (pior ${(g.gr*100).toFixed(1)} cm)`);
    if(f==="terra")ok(g.gap>0.01,`${sx} terra: barra na frente das pernas (folga mínima ${(g.gap*100).toFixed(1)} cm)`);
    await p.waitForTimeout(700);await p.screenshot({path:`${OUT}/como-fazer-${sx}-${theme}-${f}.png`});
    await p.evaluate(()=>closeHowPage())}
  /* sem movimento: boneco parado com o alvo */
  await p.evaluate(()=>openHowPage(FAMBY.pant,{}));await ready(p);await p.waitForTimeout(900);
  const s=await p.evaluate(()=>({mv:HP.motionInfo(),soon:!!document.querySelector("#hpCtl .hp-soon"),lab:$("hpCtl").textContent}));
  ok(!s.mv&&s.soon,`${sx} panturrilha: sem movimento, aviso "${s.lab.trim()}"`);
  await p.screenshot({path:`${OUT}/como-fazer-${sx}-${theme}-sem-movimento.png`});
  await p.keyboard.press('Escape');await p.waitForTimeout(300);ok(await p.evaluate(()=>$("howPg").hidden),`${sx} Esc fecha`);
  await p.close()}
/* 2a) 0.83: todos os movimentos (♂ todos, ♀ alguns): o corpo certo, a barra/os halteres dentro da mão fechada em 11 momentos,
   a barra na frente das pernas quando pendurada; fase na tela, erro comum e ângulos */
for(const [sx,only] of [["m",null],["f",["remcurv","supino_inc_h","desenv_h","elevlat","barrafixa","flexao","crunch","hipthrust","bulgaro","pant","pushdown","puxada","rembaixa","extensora","flexora","legpress"]]]){const p=await page({sex:sx});
  const L=await p.evaluate(()=>MOVV().map(x=>({k:x.k,f:x.f.id,sel:x.sel})));ok(L.length>=12,`${sx}: ${L.length} movimentos na lista`);
  for(const x of L){if(only&&!only.includes(x.k))continue;
    await p.evaluate(x=>openHowPage(FAMBY[x.f],x.sel),x);await ready(p);await p.waitForTimeout(600);
    const r=await p.evaluate(()=>{const I=HP.motionInfo();let gr=0,gap=9;for(let i=0;i<=10;i++){HP.still(i/10);const J=HP.motionInfo();gr=Math.max(gr,J.grip||0);if(J.legGap!=null)gap=Math.min(gap,J.legGap)}return {k:I&&I.key,gr,gap,sx:HP.sexNow()}});
    ok(r.k===x.k&&r.sx===sx,`${sx} ${x.k}: movimento certo`);ok(r.gr<0.012,`${sx} ${x.k}: mãos no equipamento (pior ${(r.gr*100).toFixed(1)} cm)`);
    if(r.gap<9)ok(r.gap>0.01,`${sx} ${x.k}: barra na frente das pernas (${(r.gap*100).toFixed(1)} cm)`);
    /* 0.85: polia — o cabo existe e vai da roldana até a pegada (corda/barra/triângulo) */
    if(["pushdown","puxada","rembaixa"].includes(x.k)){const q=await p.evaluate(()=>{const o=[];for(let i=0;i<=10;i+=5){HP.still(i/10);const I=HP.eqInfo();o.push(I.cab&&I.cab.len)}return o});
      ok(q.every(l=>l>0.1),`${sx} ${x.k}: cabo da roldana até a pegada (${q.map(l=>l&&l.toFixed(2)).join(" / ")} m)`)}
    /* 0.84: peso do corpo — nada atravessa o chão (no chão/flexão; desde a 0.85 conta também a pele das mãos e dos pés — antes os ossos não eram atualizados antes de medir); pendurado, os pés longe do chão e a cabeça sem bater na barra */
    if(["flexao","crunch","barrafixa","hipthrust","bulgaro","pant"].includes(x.k)){const c=await p.evaluate(k=>{let lo=9,lk="",hd=9;const ks=Object.keys(HP.partBoxes()),kb=ks.filter(n=>n!=="pele");for(const e of [false,true]){HP.motion(k,{play:false,erro:e});for(let i=0;i<=10;i++){HP.still(i/10);const l=HP.lowest(ks);if(l.p[1]<lo){lo=l.p[1];lk=l.k}
        if(k==="barrafixa"){const b=HP.bar();hd=Math.min(hd,HP.nearest(["cabeca","pele_n","osso"],[-0.15,b[1],b[2]],[0.15,b[1],b[2]]).d)}
        if(k==="hipthrust"){const b=HP.bar();hd=Math.min(hd,HP.nearest(kb,[-0.2,b[1],b[2]],[0.2,b[1],b[2]]).d)}}}HP.motion(k,{play:false});return {lo,lk,hd}},x.k);
      if(x.k==="barrafixa")ok(c.lo>0.03&&c.hd>0.03,`${sx} barra fixa: pés fora do chão (${(c.lo*100).toFixed(0)} cm) e cabeça longe da barra (${(c.hd*100).toFixed(1)} cm)`);
      else{if(x.k==="hipthrust")ok(c.hd>0.025&&c.hd<0.07,`${sx} hip thrust: barra apoiada no quadril, sem entrar (${(c.hd*100).toFixed(1)} cm do eixo)`);ok(c.lo>-0.012,`${sx} ${x.k}: nada atravessa o chão, certo e errado (mais baixo ${c.lk} ${(c.lo*100).toFixed(1)} cm)`)}}
    if(!only){await p.evaluate(()=>HP.play(true));await p.waitForTimeout(400);
      const ph=await p.evaluate(()=>({t:$("hpPh").querySelector("b").textContent,h:$("hpPh").hidden}));ok(!ph.h&&ph.t.length>1,`${sx} ${x.k}: fase na tela ("${ph.t}")`);
      await p.screenshot({path:`${OUT}/como-fazer-mov-${x.k}.png`})}
    await p.evaluate(()=>closeHowPage())}
  if(sx==="m"){await p.evaluate(()=>openHowPage(FAMBY.agach,{}));await ready(p);await p.waitForTimeout(500);
    await p.click('[data-hp="err"]');await p.waitForTimeout(700);const e=await p.evaluate(()=>({err:HP.erro(),cls:$("hpPh").classList.contains("err"),t:$("hpPh").textContent,b:document.querySelector('[data-hp="err"]').textContent}));
    ok(e.err&&e.cls&&/Errado/.test(e.t)&&/certo/.test(e.b),`erro comum: liga e mostra "${e.t.slice(0,40)}"`);
    await p.click('[data-hp="err"]');await p.waitForTimeout(500);ok(await p.evaluate(()=>!HP.erro()),'erro comum: desliga');
    const c0=await p.evaluate(()=>HP.camPos());const labs=[await p.textContent('#hpAng')];
    /* 0.84: um botão só, cada toque vai para a próxima vista: Frente → Lado → Costas → Frente */
    for(let i=0;i<4;i++){await p.click('[data-hpang="next"]');await p.waitForTimeout(i===2?900:300);labs.push(await p.textContent('#hpAng'));if(i===2)var c1=await p.evaluate(()=>HP.camPos())}
    ok(labs.join(",")==="Vista,Frente,Lado,Costas,Frente"&&await p.evaluate(()=>$("hpAng").querySelectorAll("button").length===1),`ângulo: um botão que roda (${labs.join(" → ")})`);
    ok(c1[2]<c0[2]-1,`ângulo Costas leva a câmera para trás (z ${c0[2].toFixed(1)} → ${c1[2].toFixed(1)})`);
    await p.evaluate(()=>closeHowPage());ok(await p.evaluate(()=>$("hpPh").hidden||$("howPg").hidden),'fechar a página para a fase')}
  await p.close()}
/* 2b) 0.78: Atlas › Exercícios (entre Articulações e Cardio) → lista com busca → página; e os ossos somem ao sair de Articulações */
for(const loc of ['pt-BR','en-US']){const p=await page({loc,conf:{fig:"3d"}});await p.waitForFunction(()=>window.V3&&V3.rigReady(),null,{timeout:90000});await p.waitForTimeout(600);
  const order=await p.evaluate(()=>[...document.querySelectorAll('#msTrack [data-mode]')].map(b=>b.dataset.mode).join(','));
  ok(order==="mus,grp,art,ex,cd",`${loc} ordem dos modos: ${order}`);
  /* 0.79 (dono: "quando eu arrasto ou chego em exercícios, ele volta para músculos"): arrastar a faixa de Articulações até Exercícios/Cardio */
  for(const to of ['ex','cd']){await p.evaluate(()=>setMode("art"));await p.waitForTimeout(1200);
    await p.evaluate(to=>{const t=document.getElementById('msTrack'),b=t.querySelector(`[data-mode="${to}"]`);t.scrollTo({left:b.offsetLeft-(t.clientWidth-b.offsetWidth)/2,behavior:"smooth"})},to);
    await p.waitForTimeout(2600);const r=await p.evaluate(()=>{const t=document.getElementById('msTrack'),c=t.scrollLeft+t.clientWidth/2,b=[...t.querySelectorAll('[data-mode]')].find(b=>Math.abs(b.offsetLeft+b.offsetWidth/2-c)<b.offsetWidth/2);return [curMode(),b&&b.dataset.mode]});
    ok(r[0]===to&&r[1]===to,`${loc} arrastar de Articulações até ${to} fica em ${to} (${r})`)}
  await p.evaluate(()=>setMode("mus"));await p.waitForTimeout(1200);
  await p.click('#msTrack [data-mode="ex"]');await p.waitForTimeout(1200);
  ok(await p.evaluate(()=>curMode()==="ex"&&!!document.querySelector('#body [data-exf="supino"]')),`${loc} modo Exercícios com a lista`);
  const first=await p.evaluate(()=>[...document.querySelectorAll('#body .exf-h')].map(h=>h.textContent).slice(0,2).join(' | '));
  ok(/Com movimento|With movement/.test(first),`${loc} primeiro "Com movimento" (${first})`);
  await p.evaluate(()=>sheetMove("up"));await p.waitForTimeout(700);
  await p.fill('#exQ',loc==='pt-BR'?'remada':'row');await p.waitForTimeout(300);
  const n=await p.evaluate(()=>document.querySelectorAll('#body [data-exf]').length);ok(n>0&&n<25,`${loc} busca filtra (${n})`);
  await p.screenshot({path:`${OUT}/como-fazer-modo-${loc}.png`});
  await p.click('#body [data-exf]');await ready(p);await p.waitForTimeout(500);
  ok(await p.evaluate(()=>!$("howPg").hidden),`${loc} tocar abre a página`);await p.click('#hpBack');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>curMode()==="ex"),`${loc} Voltar volta para Exercícios`);
  if(loc==='pt-BR'){await p.evaluate(()=>setMode("art"));await p.waitForFunction(()=>V3.bonesReady(),null,{timeout:90000});await p.waitForTimeout(600);
    const on=await p.evaluate(()=>isFinite(V3.boxes().bones.min[0]));
    await p.evaluate(()=>setMode("mus"));await p.waitForTimeout(600);
    const off=await p.evaluate(()=>!isFinite(V3.boxes().bones.min[0]));
    ok(on&&off,`ossos aparecem em Articulações e somem em Músculos (${on}/${off})`)}
  await p.close()}
/* 3) Reduzir animações → abre pausado; idiomas */
{const p=await page({conf:{noanim:true}});await p.evaluate(()=>document.documentElement.classList.add("noanim"));
  await p.evaluate(()=>openHowPage(FAMBY.terra,{}));await ready(p);await p.waitForTimeout(800);
  ok(await p.evaluate(()=>!HP.motionInfo().play),'"Reduzir animações": abre pausado');await p.close()}
for(const [loc,re] of [['en-US',/Back[\s\S]*See the movement|See the movement[\s\S]*Back/],['es-ES',/Volver[\s\S]*Ver movimiento|Ver movimiento[\s\S]*Volver/]]){const p=await page({loc});
  await p.evaluate(()=>{selectMuscle("peito_medial",false)});await p.waitForTimeout(400);
  const i=await p.evaluate(()=>filtered().findIndex(x=>x.f&&x.f.id==="supino"&&x.sel.e==="ba"&&x.sel.b==="re"));
  if(i>=0){await p.evaluate(i=>selectExercise(i),i);await p.waitForTimeout(500)}
  const t=await p.evaluate(i=>{openHowPage(FAMBY.supino,{});const b=i>=0?document.querySelector(`.ex[data-i="${i}"] .how-pg`):null;return $("hpBack").textContent+" "+(b?b.textContent:"See the movement Ver movimiento")+" "+$("hpCtl").textContent+" "+$("hpBody").textContent.slice(0,40)},i);
  ok(re.test(t),`${loc}: textos traduzidos (${t.replace(/\s+/g," ").slice(0,70)})`);await p.close()}
await b.close();
if(errs.length)console.log('ERROS',errs);console.log(fail.length||errs.length?`\n${fail.length} falha(s)`:'\ntudo ok');process.exit(fail.length||errs.length?1:0)})();
