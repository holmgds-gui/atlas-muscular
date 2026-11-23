/* páginas simples: mostra a língua de ?lang=, senão a do app (atlas-conf), senão a do aparelho */
(()=>{let L=new URLSearchParams(location.search).get("lang");
  if(!["pt","en","es"].includes(L)){try{const c=JSON.parse(localStorage.getItem("atlas-conf")||"null");if(c&&["pt","en","es"].includes(c.lang))L=c.lang}catch(e){}}
  if(!["pt","en","es"].includes(L)){const n=navigator.language||"pt";L=/^pt/i.test(n)?"pt":/^es/i.test(n)?"es":"en"}
  document.documentElement.lang={pt:"pt-BR",en:"en",es:"es"}[L];
  document.querySelectorAll("section[data-l]").forEach(s=>s.hidden=s.dataset.l!==L);
  document.querySelectorAll(".lang a").forEach(a=>a.classList.toggle("on",a.dataset.l===L));
  const h=document.querySelector(`section[data-l="${L}"] h1`);if(h)document.title="Muscle Atlas · "+h.textContent})();
