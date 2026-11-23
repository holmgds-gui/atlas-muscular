/* Muscle Atlas — design novo "Arena" (só com html.d2). Detalhes que o CSS sozinho não faz:
   ponto "ao vivo" piscando, números que contam até o valor quando a página abre e o aviso de teste nas Configurações. */
(()=>{
  const de=document.documentElement;if(!de.classList.contains("d2"))return;
  const T=(pt,en,es)=>{const L=typeof LANG!=="undefined"?LANG:"pt";return L==="en"?en:L==="es"?es:pt};
  const calm=()=>de.classList.contains("noanim")||matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ---- transições do transitions.dev (gratuitas; licença: uso livre em produtos, sem redistribuir a biblioteca) ----
     transitions.dev — Spinning counter, Number subtle change, Text states swap, Success check, Toast, Texts reveal, Accordion.
     Valores (durações, curvas) iguais aos do site; adaptados para os elementos do app. */

  /* Spinning counter (transitions.dev): cada dígito é um tambor 0–9 que rola até o valor e pousa com uma mola.
     Usado nos números de placar quando a página abre (antes: números que contavam). */
  const REEL={stepDur:130,stagger:90,offset:.52,sideScale:.7,sideOpacity:.17,centerScale:.9,anticDur:100,anticScale:.94,anticLift:.125,landDur:740,landPeak:1.03};
  const STEP=50*Math.PI/180,ENTER_MS=120,FADE_END=1.8,LAND_AT=.6,ARRIVE_AT=.29,CLEAR_MS=200;
  const bez=([x1,y1,x2,y2])=>{const at=(a,b,t)=>3*a*t*(1-t)*(1-t)+3*b*t*t*(1-t)+t*t*t;return x=>{if(x<=0)return 0;if(x>=1)return 1;let lo=0,hi=1,t=x;for(let i=0;i<20;i++){if(at(x1,x2,t)<x)lo=t;else hi=t;t=(lo+hi)/2}return at(y1,y2,t)}};
  const rEase=bez([.35,-.02,.43,1]),smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
  const wave=s=>s>=1?0:Math.exp(-3*s)*Math.cos(3*Math.PI*s)*(1-s);
  const TROUGH=(()=>{let l=0;for(let i=1;i<400;i++)l=Math.min(l,wave(i/400));return -l})();
  const cols=(el,str)=>{el.replaceChildren();const out=[];for(const ch of str){if(ch<"0"||ch>"9"){const sp=document.createElement("span");sp.className="t-reel-sep";sp.textContent=ch;el.appendChild(sp);continue}
      const col=document.createElement("span");col.className="t-reel-col";const z=document.createElement("span");z.className="t-reel-sizer";z.textContent="0";col.appendChild(z);const cells=[];
      for(let d=0;d<10;d++){const c=document.createElement("span");c.className="t-reel-digit";c.setAttribute("aria-hidden","true");c.textContent=d;col.appendChild(c);cells.push(c)}el.appendChild(col);out.push({cells,digit:+ch})}return out};
  const rest=(c,dg)=>c.cells.forEach((x,d)=>{x.style.transform="none";x.style.filter="none";x.style.zIndex="";x.style.opacity=d===dg?"1":"0"});
  const look=(dist,mid,o)=>{const an=Math.min(dist*STEP,Math.PI/2),face=(Math.cos(an)-Math.cos(STEP))/(1-Math.cos(STEP));
    return {an,scale:o.sideScale+(mid-o.sideScale)*face,back:dist<=1?1+(o.sideOpacity-1)*dist:o.sideOpacity*(1-(dist-1)/(FADE_END-1))}};
  const place=(c,pos,spread,mid,o,land)=>{const rad=o.off/Math.sin(STEP);c.cells.forEach((x,d)=>{let p=(((d-pos)%10)+10)%10;if(p>5)p-=10;const dist=Math.abs(p);
    if(dist>=FADE_END){x.style.opacity="0";return}const l=look(dist,mid,o);let y=(p<0?1:-1)*rad*Math.sin(l.an);
    const bl=(o.cBlur+(o.sBlur-o.cBlur)*Math.min(dist,1))*spread,away=Math.max(0,Math.min(1,(dist-.3)/.5));let op=l.back*(1-(1-spread)*away),sc=l.scale,z=100-Math.round(dist*10);
    if(land&&d===c.digit){y=y*land.arrive+land.lift;sc=land.scale;op=land.opacity;z=200}
    x.style.transform=`translateY(${y.toFixed(2)}px) scale(${sc.toFixed(4)})`;x.style.filter=bl>.01?`blur(${bl.toFixed(2)}px)`:"none";x.style.opacity=op.toFixed(3);x.style.zIndex=String(z)})};
  const roll=(el,str,done)=>{const C=cols(el,str),fs=parseFloat(getComputedStyle(el).fontSize)||24;
    const o={...REEL,off:REEL.offset*fs,sBlur:Math.max(.067*fs,.171*fs-2.1),cBlur:.042*fs,lift:REEL.anticLift*fs};
    C.forEach(c=>{c.from=0;rest(c,0);if(!c.digit)c.done=true});const t0=performance.now();
    const tick=()=>{const t=performance.now()-t0;let run=false;
      C.forEach((c,i)=>{if(c.done)return;const lo=t-i*o.stagger;if(lo<=0){run=true;return}const tot=(c.digit-c.from+10)%10,pos=c.from+tot*rEase(lo/(tot*o.stepDur)),en=Math.min(1,lo/ENTER_MS);
        if(c.landAt===undefined&&c.from+tot-pos<LAND_AT)c.landAt=t;const since=c.landAt===undefined?-1:t-c.landAt;
        if(since>=o.anticDur+o.landDur){rest(c,c.digit);c.done=true;return}run=true;const mid=1+(o.centerScale-1)*en;let spread=en,land=null;
        if(since>=0){if(!c.lf)c.lf=look(c.from+tot-pos,mid,o);const arrive=1-smooth(since/(o.anticDur+o.landDur*ARRIVE_AT));
          if(since<o.anticDur){const a=smooth(since/o.anticDur);land={scale:c.lf.scale+(o.anticScale-c.lf.scale)*a,lift:-o.lift*a,opacity:c.lf.back+(1-c.lf.back)*a,arrive}}
          else{const sp=since-o.anticDur,sn=sp/o.landDur,w=wave(sn);land={scale:sn<1/6?1+(o.anticScale-1)*w:1-((o.landPeak-1)*w)/TROUGH,lift:-o.lift*w,opacity:1,arrive};spread=1-Math.min(1,sp/CLEAR_MS)}}
        place(c,pos,spread,mid,o,land)});
      if(run)requestAnimationFrame(tick);else done&&done()};tick()};
  const COUNT=".ach-n,.pstat b,.lv-stats b";
  const countUp=el=>{if(el.dataset.d2c||calm())return;const tb=el.closest("[id^='tab-']");if(!el.closest(".cin,.lv-sum")&&!(tb&&tb.querySelector(".card.cin")))return;   // só quando a página acabou de abrir / no resumo do treino
    const t=el.textContent.trim(),m=t.match(/^(\d[\d.,:]*)(.*)$/);el.dataset.d2c="1";if(!m||!/[1-9]/.test(m[1]))return;
    const r=document.createElement("span");r.className="t-reel";r.setAttribute("data-notr","");r.setAttribute("aria-label",m[1]);
    el.replaceChildren(r,document.createTextNode(m[2]));roll(r,m[1],()=>{el.textContent=t})};   // ao terminar volta a ser texto simples

  /* Number subtle change (transitions.dev): no relógio do treino e no descanso, só o dígito que mudou troca,
     subindo ou descendo com um desfoque leve. O dígito antigo vai num atributo (o texto do elemento continua limpo). */
  const SUBTLE="#lvClock,#restBig,#restPillT";
  const num=t=>+(t.replace(/\D/g,"")||0);
  const subtle=el=>{const t=el.textContent;if(el.dataset.d2v===t)return;const pv=el.dataset.d2v;el.dataset.d2v=t;if(pv==null||calm()||pv.length!==t.length)return;
    el.style.setProperty("--d2dir",num(t)>=num(pv)?"1":"-1");el.classList.remove("d2sn");el.replaceChildren();
    [...t].forEach((ch,i)=>{if(pv[i]===ch){el.append(ch);return}const s=document.createElement("span");s.className="d2s";s.dataset.o=pv[i];s.textContent=ch;el.append(s)});
    void el.offsetHeight;el.classList.add("d2sn")};

  /* Text states swap (transitions.dev): botões que trocam de texto (Frente/Costas, 2D/3D, Básico/Detalhado) */
  const SWAP="#vTgl,#sexTgl,#b3d,#detTgl";
  const swap=el=>{const t=el.textContent.trim();if(el.dataset.d2t===t)return;const pv=el.dataset.d2t;el.dataset.d2t=t;if(pv==null||calm())return;
    el.classList.remove("d2sw");void el.offsetWidth;el.classList.add("d2sw")};

  /* Success check (transitions.dev): série feita no Ao vivo ganha um visto que se desenha; o resumo do treino também */
  const CHK='<svg class="d2chk" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  const okSeen=new Set();
  const checks=()=>{const sets=document.querySelector(".lv-sets");
    if(sets){const cur=document.querySelector(".lv-list button.cur"),w=(typeof live!=="undefined"&&live&&live.wid)||"",i=w+":"+(cur?cur.dataset.i:"0");
      const oks=[...sets.querySelectorAll("button.ok[data-j]")];
      if(!okSeen.has(i)){okSeen.add(i);oks.forEach(b=>okSeen.add(i+"-"+b.dataset.j))}   // séries que já estavam feitas ao abrir: sem animação
      oks.forEach(b=>{const k=i+"-"+b.dataset.j;if(okSeen.has(k))return;okSeen.add(k);if(calm())return;b.insertAdjacentHTML("beforeend",CHK);b.classList.add("d2pop")})}
    document.querySelectorAll(".lv-trophy").forEach(t=>{if(t.dataset.d2||t.textContent.trim()!=="✓")return;t.dataset.d2="1";t.innerHTML=CHK.replace('class="d2chk"','class="d2chk big"')})};

  /* Toast (transitions.dev): sai com desfoque e encolhendo, em vez de sumir de uma vez */
  const tst=document.getElementById("toast"),HD=Object.getOwnPropertyDescriptor(HTMLElement.prototype,"hidden");
  if(tst&&HD){let tm=0;Object.defineProperty(tst,"hidden",{configurable:true,get(){return HD.get.call(this)},
    set(v){clearTimeout(tm);if(v&&!HD.get.call(this)&&!calm()){this.classList.add("d2out");tm=setTimeout(()=>{this.classList.remove("d2out");HD.set.call(this,true)},260)}else{this.classList.remove("d2out");HD.set.call(this,v)}}})}

  /* Texts reveal (transitions.dev): título e a linha de baixo sobem com desfoque, um depois do outro — só quando a página abre */
  const reveal=()=>document.querySelectorAll(".card.cin").forEach(c=>{const tb=c.closest("[id^='tab-']");const h=tb&&tb.querySelector(".page-h");if(!h||h.dataset.d2r)return;
    h.dataset.d2r="1";if(calm())return;h.classList.add("d2rv");setTimeout(()=>h.classList.remove("d2rv"),900)});

  /* aviso nas Configurações: você está no design de teste + voltar */
  const banner=()=>{const b=document.getElementById("confBody");if(!b||b.querySelector(".d2-test"))return;const h=b.querySelector(".page-h");if(!h)return;
    const d=document.createElement("div");d.className="d2-test";d.setAttribute("data-notr","");
    d.innerHTML=`<div><b>${T("Design novo · teste","New design · test","Diseño nuevo · prueba")}</b><small>${T("Você está vendo o design Arena. Ele fica só neste aparelho até ser aprovado.","You're seeing the Arena design. It stays on this device until it's approved.","Estás viendo el diseño Arena. Queda solo en este dispositivo hasta que se apruebe.")}</small></div><button class="btn" type="button">${T("Voltar ao clássico","Back to classic","Volver al clásico")}</button>`;
    d.querySelector("button").onclick=()=>{try{localStorage.removeItem("atlas-design")}catch(e){}location.href=location.pathname+"?design=classico"};
    h.after(d)};

  /* ponto vermelho piscando em "Ao vivo" */
  const live=()=>{document.querySelectorAll('[data-hv="live"]').forEach(btn=>{if(btn.querySelector(".d2-live")||!/^\s*●/.test(btn.textContent))return;
    const t=btn.textContent.replace(/^[●•\s]+/,"");btn.innerHTML=`<i class="d2-live" aria-hidden="true"></i>${t}`})};

  /* ícones Arena da barra de baixo: Phosphor Icons (MIT, phosphoricons.com) — traço grosso (bold) normal e
     cheio (fill) na aba ativa. Pedido do dono (0.35): o ícone desenhado à mão estava estranho. */
  const ICO={
    atlas:"<g class=\"o\"><path d=\"M235.4,86.85A23.55,23.55,0,0,0,212,68H150.59a36,36,0,1,0-45.18,0H44A24,24,0,0,0,34,113.79l.19.09,47.63,21L61.76,211a24,24,0,0,0,12.11,30.74A23.77,23.77,0,0,0,84,244a24,24,0,0,0,21.52-13.29L128,191.91l22.51,38.8A24,24,0,0,0,194.24,211l-20-76.15,47.63-21,.19-.09A23.55,23.55,0,0,0,235.4,86.85ZM128,28a12,12,0,1,1-12,12A12,12,0,0,1,128,28Zm27.16,89a12,12,0,0,0-6.77,14L171.26,218a11.87,11.87,0,0,0,.73,2c-.15-.32-.32-.64-.5-.95L138.38,162a12,12,0,0,0-20.76,0L84.51,219.05c-.18.31-.35.63-.5.95a11.87,11.87,0,0,0,.73-2l22.87-86.92a12,12,0,0,0-6.77-14L44,92H212Z\"/></g><g class=\"a\"><path d=\"M100,36a28,28,0,1,1,28,28A28,28,0,0,1,100,36ZM227.6,92.57A15.7,15.7,0,0,0,212,80H44a16,16,0,0,0-6.7,30.53l.06,0,53.89,23.73-21.92,83.3a16,16,0,0,0,7.9,20.91A15.83,15.83,0,0,0,84,240a16,16,0,0,0,14.44-9.06L128,180l29.58,51a16,16,0,0,0,29.07-13.35l-21.92-83.3,54-23.76A15.7,15.7,0,0,0,227.6,92.57Z\"/></g>",
    ficha:"<g class=\"o\"><path d=\"M172,164a12,12,0,0,1-12,12H96a12,12,0,0,1,0-24h64A12,12,0,0,1,172,164Zm-12-52H96a12,12,0,0,0,0,24h64a12,12,0,0,0,0-24Zm60-64V216a20,20,0,0,1-20,20H56a20,20,0,0,1-20-20V48A20,20,0,0,1,56,28H90.53a51.88,51.88,0,0,1,74.94,0H200A20,20,0,0,1,220,48ZM100.29,60h55.42a28,28,0,0,0-55.42,0ZM196,52H178.59A52.13,52.13,0,0,1,180,64v8a12,12,0,0,1-12,12H88A12,12,0,0,1,76,72V64a52.13,52.13,0,0,1,1.41-12H60V212H196Z\"/></g><g class=\"a\"><path d=\"M200,32H163.74a47.92,47.92,0,0,0-71.48,0H56A16,16,0,0,0,40,48V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm-72,0a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm32,128H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Zm0-32H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Z\"/></g>",
    treino:"<g class=\"o\"><path d=\"M244,116V88a20,20,0,0,0-20-20H208V64a20,20,0,0,0-20-20H164a20,20,0,0,0-20,20v52H112V64A20,20,0,0,0,92,44H68A20,20,0,0,0,48,64v4H32A20,20,0,0,0,12,88v28a12,12,0,0,0,0,24v28a20,20,0,0,0,20,20H48v4a20,20,0,0,0,20,20H92a20,20,0,0,0,20-20V140h32v52a20,20,0,0,0,20,20h24a20,20,0,0,0,20-20v-4h16a20,20,0,0,0,20-20V140a12,12,0,0,0,0-24ZM36,164V92H48v72Zm52,24H72V68H88Zm96,0H168V68h16Zm36-24H208V92h12Z\"/></g><g class=\"a\"><path d=\"M200,64V192a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V136H104v56a16,16,0,0,1-16,16H72a16,16,0,0,1-16-16V64A16,16,0,0,1,72,48H88a16,16,0,0,1,16,16v56h48V64a16,16,0,0,1,16-16h16A16,16,0,0,1,200,64ZM36,72H32A16,16,0,0,0,16,88v32H8.27A8.18,8.18,0,0,0,0,127.47,8,8,0,0,0,8,136h8v32a16,16,0,0,0,16,16h4a4,4,0,0,0,4-4V76A4,4,0,0,0,36,72Zm220,55.47a8.18,8.18,0,0,0-8.25-7.47H240V88a16,16,0,0,0-16-16h-4a4,4,0,0,0-4,4V180a4,4,0,0,0,4,4h4a16,16,0,0,0,16-16V136h8A8,8,0,0,0,256,127.47Z\"/></g>",
    prog:"<g class=\"o\"><path d=\"M224,196h-4V40a12,12,0,0,0-12-12H152a12,12,0,0,0-12,12V76H96A12,12,0,0,0,84,88v36H48a12,12,0,0,0-12,12v60H32a12,12,0,0,0,0,24H224a12,12,0,0,0,0-24ZM164,52h32V196H164Zm-56,48h32v96H108ZM60,148H84v48H60Z\"/></g><g class=\"a\"><path d=\"M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1,0-16h8V136a8,8,0,0,1,8-8H72a8,8,0,0,1,8,8v64H96V88a8,8,0,0,1,8-8h32a8,8,0,0,1,8,8V200h16V40a8,8,0,0,1,8-8h40a8,8,0,0,1,8,8V200h8A8,8,0,0,1,232,208Z\"/></g>"};
  const icons=()=>document.querySelectorAll(".btabs button[data-tab]").forEach(b=>{const s=b.querySelector("svg"),k=b.dataset.tab;
    if(!s||s.dataset.d2==="2"||!ICO[k])return;s.dataset.d2="2";s.classList.add("d2i");s.setAttribute("viewBox","0 0 256 256");s.innerHTML=ICO[k]});

  /* cartão para Stories no estilo Arena (1080 × 1920): holofote vermelho, título em itálico condensado com o "corte",
     boneco sobre a plataforma, placar com os números e linhas em faixas. O index.html calcula os dados e chama isto. */
  window.d2Card=async(g,o)=>{const {W,H}=o,RED="#FF2D3D",INK="#F4F5F7",MUT="#8C95A1",PAN="#111317",LINE="rgba(255,255,255,.09)";
    const C=(w,s)=>`italic ${w} ${s}px "Barlow Condensed","Arial Narrow",sans-serif`,B=(w,s)=>`${w} ${s}px Barlow,system-ui,sans-serif`;
    try{await Promise.all([document.fonts.load(C(900,100)),document.fonts.load(C(700,40)),document.fonts.load(B(600,40)),document.fonts.load(B(500,30))])}catch(e){}
    /* alguns navegadores desenham a fonte itálica reta no canvas: testa com um "I" e, se sair reto, inclina na mão */
    const slant=(()=>{try{const t=document.createElement("canvas");t.width=t.height=80;const q=t.getContext("2d");q.font=C(900,64);q.fillText("I",20,66);
      const d=q.getImageData(0,0,80,80).data,left=y=>{for(let x=0;x<80;x++)if(d[(y*80+x)*4+3]>128)return x;return -1};const a=left(24),b=left(62);return a>=0&&b>=0&&a-b<3}catch(e){return false}})();
    const sp=v=>{try{g.letterSpacing=v}catch(e){}};
    const txt=(t,x,y,f,c,al="left",ls="0px")=>{g.font=f;g.fillStyle=c;g.textAlign=al;sp(ls);if(slant&&f.startsWith("italic")){g.save();g.translate(x,y);g.transform(1,0,-.2,1,0,0);g.fillText(t,0,0);g.restore()}else g.fillText(t,x,y);sp("0px")};
    const fitF=(t,w,max,min,wt=900)=>{let s=max;g.font=C(wt,s);while(g.measureText(t).width>w&&s>min){s-=4;g.font=C(wt,s)}return s};
    const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
    const slash=(x,y,w,h,c,k=h*.36)=>{g.fillStyle=c;g.beginPath();g.moveTo(x+k,y);g.lineTo(x+w+k,y);g.lineTo(x+w,y+h);g.lineTo(x,y+h);g.closePath();g.fill()};
    const acc=o.AC||RED;
    /* fundo: preto, holofote e faixas inclinadas no canto */
    g.fillStyle="#07080A";g.fillRect(0,0,W,H);
    let r=g.createRadialGradient(W/2,-120,40,W/2,-120,1250);r.addColorStop(0,"rgba(255,45,61,.42)");r.addColorStop(.45,"rgba(255,45,61,.10)");r.addColorStop(1,"rgba(255,45,61,0)");g.fillStyle=r;g.fillRect(0,0,W,H);
    r=g.createRadialGradient(W/2,H+200,40,W/2,H+200,900);r.addColorStop(0,"rgba(255,45,61,.16)");r.addColorStop(1,"rgba(255,45,61,0)");g.fillStyle=r;g.fillRect(0,0,W,H);
    g.save();g.globalAlpha=.9;[0,1,2].forEach(i=>{g.globalAlpha=.55-i*.17;slash(W-250+i*62,0,34,150,acc)});g.restore();
    /* cabeçalho */
    await o.logo(64,58,104);
    g.font=C(900,62);const mw=g.measureText("MUSCLE ").width;txt("MUSCLE",182,132,C(900,62),INK);txt("ATLAS",182+mw,132,C(900,62),acc);
    /* olho + título */
    let y=300;const sub=o.hero||o.kind==="rank"?"":(o.sub||"").replace(/\s*🔥$/,"");
    if(sub){slash(64,y-24,44,8,acc);txt(sub.toUpperCase(),124,y-12,C(700,36),MUT,"left","5px");y+=24}
    const T=o.title.toUpperCase(),fs=fitF(T,W-64-130,150,84),sh=fs*.74,tx0=64+18+sh*.22+26;slash(64,y+fs*.14,18,sh,acc,sh*.22);txt(T,tx0,y+fs*.86,C(900,fs),INK);y+=fs+30;
    /* número herói (conquistas: semanas seguidas) */
    if(o.hero){g.save();g.shadowColor="rgba(255,45,61,.28)";g.shadowBlur=18;txt(String(o.hero[0]),W/2,y+330,C(900,380),INK,"center");g.restore();
      txt(o.hero[1].toUpperCase(),W/2,y+410,C(800,48),acc,"center","8px");y+=470}
    /* boneco sobre a plataforma */
    if(o.fig){/* espaço que sobra para o boneco: tira o placar, as linhas e o rodapé */
      const nl=o.kind==="rank"?Math.min(3,o.lines.length-1):Math.min(o.lines.length,o.kind==="workout"?3:6);
      const need=(o.stats.length?290:0)+nl*100+(o.kind==="rank"?280:0)+170;
      const maxW=o.kind==="rank"?900:1000,maxH=Math.max(520,Math.min(980,H-y-need-20));let fw=maxW,fh=fw*o.fig.ar;if(fh>maxH){fh=maxH;fw=fh/o.fig.ar}
      /* onde o boneco termina de verdade (a imagem tem margem embaixo): procura a última linha com pixel visível */
      let bot=1;try{const cv=document.createElement("canvas"),sw=120,shh=Math.max(1,Math.round(sw*o.fig.ar));cv.width=sw;cv.height=shh;const cg=cv.getContext("2d");cg.drawImage(o.fig.img,0,0,sw,shh);
        const d=cg.getImageData(0,0,sw,shh).data;let last=shh-1;outer:for(let yy=shh-1;yy>=0;yy--){for(let xx=0;xx<sw;xx++)if(d[(yy*sw+xx)*4+3]>40){last=yy;break outer}}bot=(last+1)/shh}catch(e){}
      const fy=y+10,base=fy+fh*bot-6;
      /* piso quadriculado em perspectiva (sem o círculo vermelho, como no Atlas) */
      g.save();g.beginPath();g.rect(0,base-120,W,240);g.clip();g.strokeStyle="rgba(255,255,255,.06)";g.lineWidth=2;
      for(let i=-12;i<=12;i++){g.beginPath();g.moveTo(W/2+i*40,base-110);g.lineTo(W/2+i*150,base+130);g.stroke()}
      for(let j=0;j<6;j++){const yy=base-110+Math.pow(j/5,1.6)*240;g.beginPath();g.moveTo(0,yy);g.lineTo(W,yy);g.stroke()}g.restore();
      g.drawImage(o.fig.img,(W-fw)/2,fy,fw,fh);y=Math.max(base+70,fy+fh*bot+60)}
    /* ranking: nome do nível grande, com brilho da cor do nível */
    let lines=o.lines.slice();
    if(o.kind==="rank"&&lines.length){const [t,col]=lines[0];lines=lines.slice(1);const s=fitF(t,W-160,210,110);g.save();g.shadowColor=col+"55";g.shadowBlur=14;txt(t,W/2,y+s*.8,C(900,s),col,"center");g.restore();
      txt(o.sub.toUpperCase(),W/2,y+s*.8+64,C(700,34),MUT,"center","4px");y+=s*.8+110}
    /* placar */
    if(o.stats.length){const px=64,pw=W-128,ph=250,n=o.stats.length,cw=pw/n;rr(px,y,pw,ph,30);g.fillStyle=PAN;g.fill();g.strokeStyle=LINE;g.lineWidth=2;g.stroke();
      slash(px+34,y-6,120,12,acc);
      for(let i=1;i<n;i++){g.fillStyle=LINE;g.fillRect(px+cw*i,y+40,2,ph-80)}
      o.stats.forEach(([v,l],i)=>{const cx=px+cw*i+cw/2,vs=String(v);const s=fitF(vs,cw-40,140,70);txt(vs,cx,y+150,C(900,s),INK,"center");txt(String(l).toUpperCase(),cx,y+205,C(700,32),MUT,"center","5px")});y+=ph+36}
    /* linhas (recordes, grupos do ranking, conquistas) em faixas */
    const room=H-170-y,rowH=88,max=Math.max(0,Math.min(lines.length,Math.floor(room/(rowH+12))));
    lines.slice(0,max).forEach(([t])=>{rr(64,y,W-128,rowH,22);g.fillStyle="rgba(255,255,255,.035)";g.fill();g.strokeStyle=LINE;g.lineWidth=2;g.stroke();slash(84,y+24,10,rowH-48,acc);
      let s=40;g.font=B(600,s);const tt=t.replace(/^•\s*/,"");while(g.measureText(tt).width>W-128-90&&s>26){s-=2;g.font=B(600,s)}txt(tt,118,y+rowH/2+s*.36,B(600,s),INK);y+=rowH+12});
    /* rodapé */
    slash(W/2-150,H-118,300,4,"rgba(255,45,61,.6)");
    txt("holmgds-gui.github.io/atlas-muscular",W/2,H-64,B(500,30),"#5E6672","center")};

  /* pílula do descanso: some enquanto o cartão grande do descanso está na tela (ficava por cima dele no Ao vivo) */
  let rbEl=null;const io=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(es=>es.forEach(e=>de.classList.toggle("d2-hidepill",e.isIntersecting&&!!e.target.offsetParent))):null;
  const pill=()=>{if(!io)return;const r=document.getElementById("restBig");if(r===rbEl)return;if(rbEl)io.unobserve(rbEl);rbEl=r;if(r)io.observe(r);else de.classList.remove("d2-hidepill")};

  /* títulos gigantes: diminuem só o necessário para caber numa linha ("Configurações") */
  const fit=()=>document.querySelectorAll(".page-h h2").forEach(h=>{if(!h.offsetParent)return;const box=h.clientWidth;if(!box)return;
    h.style.removeProperty("--d2-h");let f=44;while(h.scrollWidth>box&&f>26){f-=2;h.style.setProperty("--d2-h",f+"px")}if(f<44)h.style.setProperty("--d2-h",Math.max(26,f-2)+"px")});
  addEventListener("resize",()=>requestAnimationFrame(fit));
  let raf=0;const run=()=>{raf=0;banner();live();icons();fit();reveal();checks();pill();document.querySelectorAll(COUNT).forEach(countUp);document.querySelectorAll(SUBTLE).forEach(subtle);document.querySelectorAll(SWAP).forEach(swap)};
  new MutationObserver(()=>{if(!raf)raf=requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class"]});
  run();
})();
