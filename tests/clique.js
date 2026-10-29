/* Toque em cada músculo e junta (≥85% dos pontos acertam o próprio músculo), ♂/♀, computador e celular. */
const BASE=process.env.BASE||"http://localhost:8765/index.html";const OUT=require("path").join(__dirname,"out");require("fs").mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const sx of ['m','f'])for(const vp of [{width:1440,height:900},{width:390,height:844}]){
 const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(BASE);await p.waitForTimeout(300);
 await p.evaluate(s=>{setTab('atlas');setModel('det');setSex(s);setView(innerWidth>900?'both':'front')},sx);await p.waitForTimeout(100);
 const r=await p.evaluate(()=>{const out=[];
  document.querySelectorAll('[data-m] > path.m').forEach(path=>{const g=path.parentNode;if(g.closest('svg > g').style.display==='none')return;const svg=path.ownerSVGElement;const bb=path.getBBox();let t=0,o=0,st={};
   for(let x=bb.x;x<=bb.x+bb.width;x+=1.5)for(let y=bb.y;y<=bb.y+bb.height;y+=1.5){const pt=svg.createSVGPoint();pt.x=x;pt.y=y;if(!path.isPointInFill(pt))continue;
    const sp=pt.matrixTransform(path.getScreenCTM());t++;const el=document.elementFromPoint(sp.x,sp.y);const og=el&&el.closest('[data-m]');if(og===g)o++;else{const k=og?og.dataset.m:(el?el.tagName+'.'+el.getAttribute('class'):'none');st[k]=(st[k]||0)+1}}
   const side=g.parentNode.getAttribute('transform')?'R':'L';const view=g.closest('svg > g').querySelector('text').textContent;
   if(side==='L')out.push([view+':'+g.dataset.m,t,Math.round(o/t*100),st])});return out});
 const low=r.filter(x=>x[2]<85);
 await p.evaluate(()=>setModel('art'));
 const jt=await p.evaluate(()=>[...document.querySelectorAll('.jt')].filter(j=>j.closest('svg > g').style.display!=='none').map(j=>{const c=j.querySelector('.jd').getBoundingClientRect();const el=document.elementFromPoint(c.x+c.width/2,c.y+c.height/2);return el&&el.closest('.jt')===j}));
 console.log(sx,vp.width,'músculos',r.length,'abaixo de 85%:',low.map(([k,t,pc,st])=>k+' '+pc+'% '+JSON.stringify(st)).join(' | ')||'nenhum','| juntas ok',jt.filter(Boolean).length+'/'+jt.length);
 await p.close()}
console.log('erros',errs);await b.close()})();
