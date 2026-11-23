/* Muscle Atlas — design novo "Arena" (só com html.d2). Detalhes que o CSS sozinho não faz:
   ponto "ao vivo" piscando, números que contam até o valor quando a página abre e o aviso de teste nas Configurações. */
(()=>{
  const de=document.documentElement;if(!de.classList.contains("d2"))return;
  const T=(pt,en,es)=>{const L=typeof LANG!=="undefined"?LANG:"pt";return L==="en"?en:L==="es"?es:pt};
  const calm=()=>de.classList.contains("noanim")||matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* números que contam: só nos números grandes de placar, uma vez por elemento */
  const COUNT=".ach-n,.pstat b,.lv-big";
  const countUp=el=>{if(el.dataset.d2c||calm()||!el.closest(".cin"))return;   // only when the page has just opened (cards rising in)
    const t=el.textContent.trim(),m=t.match(/^(\d+)(.*)$/);if(!m)return;
    el.dataset.d2c="1";const to=+m[1],rest=m[2];if(to<2)return;const t0=performance.now(),D=Math.min(900,300+to*12);
    const step=now=>{const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3);el.textContent=Math.round(to*e)+rest;if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)};

  /* aviso nas Configurações: você está no design de teste + voltar */
  const banner=()=>{const b=document.getElementById("confBody");if(!b||b.querySelector(".d2-test"))return;const h=b.querySelector(".page-h");if(!h)return;
    const d=document.createElement("div");d.className="d2-test";d.setAttribute("data-notr","");
    d.innerHTML=`<div><b>${T("Design novo · teste","New design · test","Diseño nuevo · prueba")}</b><small>${T("Você está vendo o design Arena. Ele fica só neste aparelho até ser aprovado.","You're seeing the Arena design. It stays on this device until it's approved.","Estás viendo el diseño Arena. Queda solo en este dispositivo hasta que se apruebe.")}</small></div><button class="btn" type="button">${T("Voltar ao clássico","Back to classic","Volver al clásico")}</button>`;
    d.querySelector("button").onclick=()=>{try{localStorage.removeItem("atlas-design")}catch(e){}location.href=location.pathname+"?design=classico"};
    h.after(d)};

  /* ponto vermelho piscando em "Ao vivo" */
  const live=()=>{document.querySelectorAll('[data-hv="live"]').forEach(btn=>{if(btn.querySelector(".d2-live")||!/^\s*●/.test(btn.textContent))return;
    const t=btn.textContent.replace(/^[●•\s]+/,"");btn.innerHTML=`<i class="d2-live" aria-hidden="true"></i>${t}`})};

  /* títulos gigantes: diminuem só o necessário para caber numa linha ("Configurações") */
  const fit=()=>document.querySelectorAll(".page-h h2").forEach(h=>{if(!h.offsetParent)return;const box=h.clientWidth;if(!box)return;
    h.style.removeProperty("--d2-h");let f=44;while(h.scrollWidth>box&&f>26){f-=2;h.style.setProperty("--d2-h",f+"px")}if(f<44)h.style.setProperty("--d2-h",Math.max(26,f-2)+"px")});
  addEventListener("resize",()=>requestAnimationFrame(fit));
  let raf=0;const run=()=>{raf=0;banner();live();fit();document.querySelectorAll(COUNT).forEach(countUp)};
  new MutationObserver(()=>{if(!raf)raf=requestAnimationFrame(run)}).observe(document.body,{childList:true,subtree:true});
  run();
})();
