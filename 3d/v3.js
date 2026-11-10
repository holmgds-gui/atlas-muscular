/* Muscle Atlas — 3D body (owner, nov/2026: "adicione o modelo 3D no app com um botão 3D").
   Loaded only when the 3D button is tapped (import("./3d/v3.js")). Three.js comes from jsDelivr through the import map
   in index.html; the model is 3d/corpo-2.glb (BodyParts3D, © DBCLS, CC BY-SA 2.1 JP, simplified, grouped by the
   Atlas muscle keys, A-pose, Classic Physique build, skin on head/hands/feet — built by tools/corpo3d/build.py, see docs/FONTES.md).
   The 2D figure stays the source of truth: the app tells this viewer which key is red (on), orange (syn) and what colour
   the 2D figure shows for the rest (groups, cardio), and a tap here is passed back to the same code as a tap in 2D.

   mount(box, api) → {sync(state), view(v), refit(), dispose()}
     api.tap(key|null)  — a tap on a muscle (or on nothing)
     api.covered()      — true when the figure is the small one in the corner (taps only enlarge it, no rotating)
     api.progress(0..1), api.ready(), api.fail()                                                                     */
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

export function mount(box, api){
  const canvas=document.createElement("canvas");canvas.className="v3c";box.prepend(canvas);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,0.05,20);
  const controls=new OrbitControls(camera,canvas);
  /* zoom goes toward the finger, two fingers also move the body, the point it turns around stays inside the body */
  controls.enableDamping=true;controls.dampingFactor=0.1;controls.enablePan=true;controls.screenSpacePanning=true;controls.zoomToCursor=true;
  controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};controls.minDistance=0.35;controls.maxDistance=9;controls.rotateSpeed=0.85;
  controls.minPolarAngle=0.25;controls.maxPolarAngle=Math.PI-0.25;
  let ready=false,BB=new THREE.Box3(new THREE.Vector3(-.4,0,-.2),new THREE.Vector3(.4,1.7,.2)),CY=0.9,need=true,alive=true,curV="front";
  scene.add(new THREE.HemisphereLight(0xffffff,0x9aa0a8,1.25));
  const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(0.6,0.8,1);camera.add(key);
  const rim=new THREE.DirectionalLight(0xffffff,0.45);rim.position.set(-1,0.3,-0.6);camera.add(rim);scene.add(camera);

  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C={};const readColors=()=>{for(const [k,v] of [["m","--v3-m"],["mlo","--v3-mlo"],["bone","--v3-bone"],["sep","--v3-sep"],["fib","--v3-fib"],["base","--v3-base"],["hov","--v3-hov"],["target","--target"],["syn","--syn"]])C[k]=new THREE.Color(css(v)||"#888");
    C.sepA=parseFloat(css("--v3-sepa"))||.45};readColors();

  const parts={},pickables=[],meshes=[];let state={},hov=null;
  const ro=new ResizeObserver(()=>{resize();need=true});ro.observe(box);
  let lastSz=null;
  function resize(){const r=box.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();need=true;
    /* the box changed shape (small figure in the corner, sheet up/down): fit the whole body again, keeping the side it is seen from */
    if(lastSz&&ready&&(Math.abs(r.width/lastSz[0]-1)>.15||Math.abs(r.height/lastSz[1]-1)>.15)){const dir=camera.position.clone().sub(controls.target).normalize();
      controls.target.set(0,CY,0);camera.position.copy(controls.target).add(dir.multiplyScalar(fitD()))}
    lastSz=[r.width,r.height]}
  const reduce=()=>document.documentElement.classList.contains("noanim")||matchMedia("(prefers-reduced-motion: reduce)").matches;
  let BW=1.2,BH=1.7;
  /* the whole body fits the box with a small margin, whatever its shape */
  const fitD=()=>{const t=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));return Math.max(BH*1.06/(2*t),BW*1.08/(2*t*camera.aspect))};
  function view(v,anim=true){curV=v;const d=fitD(),a=v==="back"?Math.PI:0;
    const to=new THREE.Vector3(Math.sin(a)*d,CY+0.03,Math.cos(a)*d),tt=new THREE.Vector3(0,CY,0);
    if(!anim||reduce()){camera.position.copy(to);controls.target.copy(tt);need=true;return}
    const from=camera.position.clone(),t0=performance.now(),ft=controls.target.clone();
    /* turn around the body instead of cutting through it */
    const fa=Math.atan2(from.x,from.z),fd=Math.hypot(from.x,from.z);let da=a-fa;da=Math.atan2(Math.sin(da),Math.cos(da));
    (function step(){if(!alive)return;const k=Math.min(1,(performance.now()-t0)/550),e=1-Math.pow(1-k,3),ang=fa+da*e,dd=fd+(d-fd)*e;
      camera.position.set(Math.sin(ang)*dd,from.y+(to.y-from.y)*e,Math.cos(ang)*dd);controls.target.lerpVectors(ft,tt,e);need=true;if(k<1)requestAnimationFrame(step)})()}

  function paint(){for(const [k,o] of Object.entries(parts)){const s=state[k]||{};
    const c=s.on?C.target:s.syn?C.syn:k==="osso"?C.bone:k==="fundo"||k==="base"?C.base:k==="deco"||k==="tend"?C.mlo:k==="pele"?C.m:s.c?(s.dim?new THREE.Color(s.c).lerp(C.m,.75):new THREE.Color(s.c)):(k===hov?C.hov:C.m);
    if(o.userData.fu)o.userData.fu.value.copy(C.fib);baseU.value.copy(C.base);
    o.material.color.copy(c);o.material.emissive.copy(s.on?C.target:s.syn?C.syn:new THREE.Color(0));o.material.emissiveIntensity=s.on||s.syn?0.18:0}need=true}

  /* separation lines: every mesh is drawn once more with its own id into an off-screen buffer; a full-screen pass draws a
     thin dark line wherever neighbouring pixels have different ids (where muscles meet, at bones, around the outline) */
  const idT=new THREE.WebGLRenderTarget(2,2,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
  const idVS=`varying float vx;void main(){vec4 w=modelMatrix*vec4(position,1.0);vx=w.x;gl_Position=projectionMatrix*viewMatrix*w;}`;
  const idFS=`uniform float id;uniform float sd;varying float vx;void main(){gl_FragColor=gl_FrontFacing?vec4(id/255.0,sd>0.5?(vx>0.0?1.0:0.5):0.5,0.0,1.0):vec4(1.0,0.25,0.0,1.0);}`;
  /* inflated muscles overlap a little; the outer layer always wins the depth test */
  const LAYER={trapezio_superior:-3,trapezio_medio:-3,trapezio_inferior:-3,ombro_frontal:-3,ombro_lateral:-3,ombro_posterior:-3,peito_superior:-3,peito_medial:-3,peito_inferior:-3,
    dorsal_superior:-2,dorsal_inferior:-2,gluteo_maximo:-3,obliquos:-1,abdomen_supra:-2,abdomen_infra:-2,biceps_longa:-2,biceps_curta:-2,triceps_longa:-2,triceps_lateral:-2,
    antebraco_braquiorradial:-2,quad_reto_femoral:-2,isquio_biceps_femoral:-2,panturrilha_gastro:-2,abdutores:-1,
    infraespinhal:1,redondo_maior:1,serratil:1,gluteo_medio:1,braquial:1,adutores:1,panturrilha_soleo:1,triceps_medial:1,osso:3,fundo:3,tend:2};
  const lay=(m,k)=>{const l=LAYER[k]||0;if(l){m.polygonOffset=true;m.polygonOffsetFactor=l;m.polygonOffsetUnits=l*4}};
  const sepMat=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,
    uniforms:{t:{value:idT.texture},px:{value:new THREE.Vector2()},col:{value:new THREE.Color()},a:{value:0.9}},
    vertexShader:`varying vec2 u;void main(){u=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
    fragmentShader:`uniform sampler2D t;uniform vec2 px;uniform vec3 col;uniform float a;varying vec2 u;
      float df(vec2 c,vec2 o){return step(0.001,distance(c,texture2D(t,u+o).rg))*step(0.001,distance(c,texture2D(t,u+2.0*o).rg));}
      void main(){vec2 c=texture2D(t,u).rg;
        float L=df(c,vec2(-px.x,0.0)),R=df(c,vec2(px.x,0.0)),D=df(c,vec2(0.0,-px.y)),U=df(c,vec2(0.0,px.y));
        float e=max(max(L,R),max(U,D))*(1.0-L*R)*(1.0-U*D);
        gl_FragColor=vec4(col,a*e);}`});
  const sepScene=new THREE.Scene(),sepCam=new THREE.Camera();sepScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),sepMat));
  function draw(){
    const sz=renderer.getDrawingBufferSize(new THREE.Vector2());if(!sz.x||!sz.y)return;
    if(idT.width!==sz.x||idT.height!==sz.y){idT.setSize(sz.x,sz.y);const o=Math.max(1,Math.round(renderer.getPixelRatio()*0.75));sepMat.uniforms.px.value.set(o/sz.x,o/sz.y)}
    const dd=camera.position.distanceTo(controls.target);nearU.value=Math.min(1,Math.max(0,(2.5-dd)/1.1));
    sepMat.uniforms.col.value.copy(C.sep);sepMat.uniforms.a.value=C.sepA*Math.min(1,Math.max(0.3,1.5/dd));
    renderer.autoClear=true;renderer.render(scene,camera);if(!meshes.length)return;
    for(const o of meshes){o.userData.mat=o.material;o.material=o.userData.idm}
    renderer.setRenderTarget(idT);renderer.setClearColor(0x000000,1);renderer.clear();renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.setClearColor(0x000000,0);
    for(const o of meshes)o.material=o.userData.mat;
    renderer.autoClear=false;renderer.render(sepScene,sepCam);renderer.autoClear=true}

  /* hand-drawn fibre strokes along each muscle (uv.x across the fibres, uv.y along them), fading out when far away;
     the inside of a muscle seen through a gap is painted a flat deep colour so the body reads as solid */
  const baseU={value:new THREE.Color()},nearU={value:1};
  function shade(o,fib){const g=o.geometry;if(fib)g.setAttribute("fib",g.attributes.uv);const fu={value:new THREE.Color()};o.userData.fu=fu;
    o.material.onBeforeCompile=sh=>{sh.uniforms.fibCol=fu;sh.uniforms.baseCol=baseU;sh.uniforms.fibNear=nearU;
      if(!fib){sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform vec3 baseCol;").replace("#include <color_fragment>","#include <color_fragment>\n if(!gl_FrontFacing)diffuseColor.rgb=baseCol;");return}
      sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nattribute vec2 fib;varying vec2 vFib;").replace("#include <begin_vertex>","#include <begin_vertex>\nvFib=fib;");
      sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
        varying vec2 vFib;uniform vec3 fibCol;uniform vec3 baseCol;uniform float fibNear;
        float h1(float n){return fract(sin(n*127.1)*43758.5453);}
        float fibre(vec2 f){float s=f.x/0.0058,v=f.y/0.0058;
          s+=0.22*sin(v*0.55+floor(s)*1.7)+0.07*sin(v*1.9+floor(s)*3.3);
          float id=floor(s),d=abs(fract(s)-0.5),fw=fwidth(s);
          float w=0.05+0.04*h1(id+3.1);float line=1.0-smoothstep(w,w+clamp(fw,0.02,0.06),d);
          float dash=smoothstep(-0.35,0.15,sin(v*(0.22+0.2*h1(id))+h1(id+7.0)*6.283));
          float st=0.45+0.55*h1(id+11.0);
          return line*dash*st*(1.0-smoothstep(0.045,0.12,fw));}`)
        .replace("#include <color_fragment>","#include <color_fragment>\n if(gl_FrontFacing)diffuseColor.rgb*=1.0-0.28*fibNear*fibre(vFib); else diffuseColor.rgb=baseCol;");
    };o.material.customProgramCacheKey=()=>fib?"fib":"solid"}

  /* tap vs drag; a double tap zooms on that spot */
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let down=null,lastHit=null,lastTap={t:0,x:0,y:0};
  function pick(x,y){const r=canvas.getBoundingClientRect();ndc.set(((x-r.left)/r.width)*2-1,-((y-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
    const hs=ray.intersectObjects(pickables,false),h=hs[0];lastHit=h?h.point:null;if(!h||!h.face)return null;
    const front=x=>x.face&&x.face.normal.clone().transformDirection(x.object.matrixWorld).dot(ray.ray.direction)<0;  /* the inside of a muscle seen through a gap is not a tap on it */
    const NM=k=>/^(osso|fundo|base|deco|tend|pele)$/.test(k);
    if(!front(h))return null;if(!NM(h.object.userData.k))return h.object.userData.k;
    /* the filler layer sits just under the muscles: a tap on a seam still picks the muscle right behind it */
    const m=hs.find(x=>x.distance-h.distance<0.02&&!NM(x.object.userData.k)&&front(x));return m?m.object.userData.k:h.object.userData.k}
  function focusAt(pt){if(!pt)return;const t0=performance.now(),ft=controls.target.clone(),fp=camera.position.clone(),dir=fp.clone().sub(ft).normalize();
    const nd=Math.max(controls.minDistance,Math.min(1.1,fp.distanceTo(ft)*0.5)),tp=pt.clone().add(dir.multiplyScalar(nd));
    (function step(){if(!alive)return;const k=Math.min(1,(performance.now()-t0)/420),e=1-Math.pow(1-k,3);controls.target.lerpVectors(ft,pt,e);camera.position.lerpVectors(fp,tp,e);need=true;if(k<1)requestAnimationFrame(step)})()}
  canvas.addEventListener("pointerdown",e=>{down={x:e.clientX,y:e.clientY,t:performance.now()}});
  /* a tap opens the list right where the finger is: without this the browser's late "click" would land on the list
     and open the exercise under the finger */
  canvas.addEventListener("touchend",e=>{if(e.cancelable)e.preventDefault()},{passive:false});
  canvas.addEventListener("pointerup",e=>{if(!down)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;down=null;
    if(moved>7||dt>500)return;
    if(api.covered()){api.tap(null);return}
    const k=pick(e.clientX,e.clientY),now=performance.now();
    if(now-lastTap.t<330&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<30){lastTap.t=0;focusAt(lastHit);return}
    lastTap={t:now,x:e.clientX,y:e.clientY};api.tap(k&&!/^(osso|fundo|base|deco|tend|pele)$/.test(k)?k:null)});
  const tip=document.createElement("div");tip.className="v3tip";tip.hidden=true;box.appendChild(tip);
  canvas.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse"||e.buttons)return;const k=pick(e.clientX,e.clientY),nm=k&&api.name(k);const nk=nm?k:null;
    if(nk!==hov){hov=nk;paint();canvas.style.cursor=nk?"pointer":"grab"}
    if(nm){const r=box.getBoundingClientRect();tip.hidden=false;tip.textContent=nm;tip.style.left=(e.clientX-r.left)+"px";tip.style.top=(e.clientY-r.top)+"px"}else tip.hidden=true});
  canvas.addEventListener("pointerleave",()=>{tip.hidden=true;if(hov){hov=null;paint()}});
  controls.addEventListener("change",()=>{need=true});

  const mo=new MutationObserver(()=>{readColors();paint()});mo.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","class"]});
  const mq=matchMedia("(prefers-color-scheme: dark)"),onMq=()=>{readColors();paint()};mq.addEventListener("change",onMq);

  (async()=>{
    let buf;
    try{const r=await fetch(new URL("./corpo-2.glb",import.meta.url));if(!r.ok)throw 0;const tot=+r.headers.get("content-length")||3600000;
      if(r.body&&r.body.getReader){const rd=r.body.getReader(),ch=[];let got=0;
        for(;;){const {done,value}=await rd.read();if(done)break;ch.push(value);got+=value.length;api.progress(Math.min(1,got/tot))}
        buf=await new Blob(ch).arrayBuffer()}else buf=await r.arrayBuffer()}
    catch(e){api.fail();return}
    if(!alive)return;
    new GLTFLoader().parse(buf,"",g=>{if(!alive)return;
      const ms=[];g.scene.traverse(o=>{if(o.isMesh)ms.push(o)});
      ms.forEach(o=>{const k=(o.name&&o.name!=="mesh"?o.name:(o.parent&&o.parent.name)||"deco").replace(/_\d+$/,"");
        o.material=new THREE.MeshStandardMaterial({color:0x999999,roughness:k==="osso"?0.75:0.55,metalness:0,side:THREE.DoubleSide});
        shade(o,!!o.geometry.attributes.uv&&k!=="osso"&&k!=="fundo");o.userData.k=k;parts[k]=o;pickables.push(o);
        o.userData.idm=new THREE.ShaderMaterial({uniforms:{id:{value:meshes.length+1},sd:{value:/^(osso|fundo|base|pele|tend)$/.test(k)?0:1}},vertexShader:idVS,fragmentShader:idFS,side:THREE.DoubleSide});
        lay(o.material,k);lay(o.userData.idm,k);meshes.push(o)});
      scene.add(g.scene);const b=new THREE.Box3().setFromObject(g.scene),H=b.max.y-b.min.y;CY=b.min.y+H*0.5;BB=b.clone().expandByScalar(0.05);BH=H;BW=b.max.x-b.min.x;
      ready=true;resize();view(curV,false);paint();api.ready()},()=>api.fail())})();

  renderer.setAnimationLoop(()=>{if(!box.offsetParent)return;   /* hidden (2D or another tab): no drawing */
    controls.enabled=!api.covered();
    if(controls.update())need=true;
    const t=controls.target,c=t.clone().clamp(BB.min,BB.max);if(!c.equals(t)){camera.position.add(c.clone().sub(t));t.copy(c);need=true}
    if(need){need=false;draw()}});

  return {
    sync(s){state=s||{};paint()},
    view(v){view(v==="back"?"back":"front")},
    refit(){resize();view(curV,true)},
    keys(){return Object.keys(parts)},
    /* for tests: where a muscle is on screen (middle of its front/back half), and its colour now */
    at(k){const o=parts[k];if(!o)return null;const bb=new THREE.Box3().setFromObject(o),c=bb.getCenter(new THREE.Vector3());c.z=curV==="back"?bb.min.z:bb.max.z;c.x=bb.min.x+(bb.max.x-bb.min.x)*0.3;
      c.project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(c.x+1)/2*r.width,y:r.top+(1-c.y)/2*r.height}},
    /* for screenshots: look from an angle (deg, 0 = front), distance (m) and height (0..1 of the body) */
    look(deg,dist,yf){const a=THREE.MathUtils.degToRad(deg),y=yf==null?CY:BB.min.y+(BB.max.y-BB.min.y)*yf,d=dist||fitD();
      controls.target.set(0,y,0);camera.position.set(Math.sin(a)*d,y+0.03,Math.cos(a)*d);need=true},
    color(k){const o=parts[k];return o?"#"+o.material.color.getHexString():null},
    dispose(){alive=false;renderer.setAnimationLoop(null);ro.disconnect();mo.disconnect();mq.removeEventListener("change",onMq);controls.dispose();renderer.dispose();canvas.remove();tip.remove()}
  };
}
