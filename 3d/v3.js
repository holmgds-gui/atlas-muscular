/* Muscle Atlas — 3D body (owner, nov/2026: "adicione o modelo 3D no app com um botão 3D").
   Loaded only when the 3D button is tapped (import("./3d/v3.js")). Three.js comes from jsDelivr through the import map
   in index.html; the models are 3d/corpo-13.glb (male; 0.71 more muscle volume) and 3d/corpo-f-8.glb (now 3d/corpo-f-11.glb; 0.70: mannequin head shaped on the skull; more feminine in 0.66; female, owner 0.15–0.17; mannequin head 0.54, plain 0.57, smooth egg 0.58, jaw 0.59–0.60), each with its joint
   marks (3d/juntas-4.json, 3d/juntas-f-5.json — on the skeleton's joint centres since 0.68) (BodyParts3D, © DBCLS, CC BY-SA 2.1 JP, simplified, grouped by the
   Atlas muscle keys, A-pose, Classic Physique upper body, proportional legs, skull, skin on hands/feet — built by tools/corpo3d/build.py, see docs/FONTES.md).
   The 2D figure stays the source of truth: the app tells this viewer which key is red (on), orange (syn) and what colour
   the 2D figure shows for the rest (groups, cardio), and a tap here is passed back to the same code as a tap in 2D.

   mount(box, api) → {sync(state), view(v), refit(), sex(s), dispose()}
     api.sex()          — "m" | "f": which body to load first (sex(s) swaps it later)
     api.tap(key|null)  — a tap on a muscle (or on nothing)
     api.covered()      — true when the figure is the small one in the corner (taps only enlarge it, no rotating)
     api.progress(0..1), api.ready(), api.fail()
     xray("off"|"raiox"|"esq") — 0.65: skeleton (3d/ossos-N.glb, loaded the first time): Raio-X = see-through muscles with
       the bones inside, Esqueleto = bones only; api.xrProg(0..1|null) shows its loading, api.xrFail() when it could not load */
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

/* the parsed bodies are kept here and shared by every viewer (Atlas, Progresso, Força, Stories): one download, one
   parse, the geometry is shared between copies (owner 0.18: 3D in the whole app) */
const SCN={};
/* head (owner 0.54): "cabeca" = mannequin (default), "osso" + "pele_n" = skull with the front of the neck; Settings picks */
let HEAD="mq";const HEADS=new Set();
export function setHead(h){HEAD=h==="skull"?"skull":"mq";HEADS.forEach(f=>f())}
function getScene(file,onProg){
  if(!SCN[file])SCN[file]=(async()=>{const r=await fetch(new URL(file,import.meta.url));if(!r.ok)throw 0;const tot=+r.headers.get("content-length")||4000000;let buf;
    if(r.body&&r.body.getReader){const rd=r.body.getReader(),ch=[];let got=0;
      for(;;){const {done,value}=await rd.read();if(done)break;ch.push(value);got+=value.length;onProg&&onProg(Math.min(1,got/tot))}
      buf=await new Blob(ch).arrayBuffer()}else buf=await r.arrayBuffer();
    return new Promise((ok,no)=>new GLTFLoader().parse(buf,"",g=>ok(g.scene),no))})().catch(e=>{delete SCN[file];throw e});
  return SCN[file]}
export function mount(box, api){
  const canvas=document.createElement("canvas");canvas.className="v3c";box.prepend(canvas);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.localClippingEnabled=true;
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,0.05,20);
  const controls=new OrbitControls(camera,canvas);
  /* zoom goes toward the finger, two fingers also move the body, the point it turns around stays inside the body */
  controls.enableDamping=true;controls.dampingFactor=0.1;controls.enablePan=true;controls.screenSpacePanning=true;controls.zoomToCursor=true;
  controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};controls.minDistance=0.3;controls.maxDistance=9;controls.rotateSpeed=0.85;
  /* owner: never straight from above or below (at most ~35° above and ~30° below the horizon) */
  controls.minPolarAngle=THREE.MathUtils.degToRad(72);controls.maxPolarAngle=THREE.MathUtils.degToRad(108);   /* owner 0.19: closer to level (was 55–120°) */
  /* owner 0.48 (Atlas, "muito mole, solto"): firm — stops the moment the finger lifts (no inertia), turns sideways and only
     a little up/down (±12°, owner 0.51), and the pinch zooms a bit faster than the fingers */
  if(api.firm){controls.enableDamping=false;controls.minPolarAngle=THREE.MathUtils.degToRad(78);controls.maxPolarAngle=THREE.MathUtils.degToRad(102);controls.zoomSpeed=1.35;controls.rotateSpeed=0.55}   /* 0.51: a little up/down (±12°) follows the mouse/finger again; 0.56: turns slower (owner: "muito rápido o girar", 0.85 → 0.55) */
  let XR="off",bones=null,bonesSex=null,boneN=0;
  let CLOUD=null,ready=false,BB=new THREE.Box3(new THREE.Vector3(-.4,0,-.2),new THREE.Vector3(.4,1.7,.2)),CY=0.9,need=true,alive=true,curV="front";
  scene.add(new THREE.HemisphereLight(0xffffff,0x9aa0a8,1.25));
  const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(0.6,0.8,1);camera.add(key);
  const rim=new THREE.DirectionalLight(0xffffff,0.45);rim.position.set(-1,0.3,-0.6);camera.add(rim);scene.add(camera);

  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C={};const readColors=()=>{for(const [k,v] of [["m","--v3-m"],["mlo","--v3-mlo"],["bone","--v3-bone"],["sep","--v3-sep"],["fib","--v3-fib"],["base","--v3-base"],["hov","--v3-hov"],["aura","--v3-aura"],["target","--target"],["syn","--syn"],["art","--fig-art"],["art2","--fig-art2"],["surf","--surface"],["thi","--target-hi"]])C[k]=new THREE.Color(css(v)||"#888");
    C.sepA=parseFloat(css("--v3-sepa"))||.45;/* skeleton: real bone ivory in both themes (the skull head keeps --v3-bone) */C.osso=new THREE.Color("#e6decd");C.cart=C.osso.clone().lerp(new THREE.Color("#9db3c9"),0.42)};readColors();

  const parts={},pickables=[],meshes=[];let state={},hov=null,hovJ=null,root=null,curSex=null;
  /* the female breasts are split by the pectoral part under them ("mama_peito_medial"…): same colour, a tap on them is a tap on that part */
  const BASEK=k=>k.startsWith("mama_")?k.slice(5):k;
  /* owner 0.17: the female breasts are a see-through "aura" (node "mama"): no tap, no outline, the pectoral shows through */
  const ghosts=[];
  /* aura: almost clear in the middle, stronger toward the outline (like a glow around the shape) */
  const ghostMat=()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,vertexColors:true,uniforms:{col:{value:new THREE.Color()},a0:{value:.14},a1:{value:.45}},
    vertexShader:`varying vec3 vN;varying vec3 vV;varying float vF;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vF=color.r;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform vec3 col;uniform float a0;uniform float a1;varying vec3 vN;varying vec3 vV;varying float vF;void main(){float r=1.0-abs(dot(normalize(vN),normalize(vV)));gl_FragColor=vec4(col,(a0+a1*pow(r,3.0))*vF);}`});   /* vF: fades out toward the edge */
  const jScene=new THREE.Scene(),jMarks=[],jFills=[];jScene.visible=false;
  const ringG=new THREE.RingGeometry(0.62,1,40),dotG=new THREE.CircleGeometry(0.64,40);
  function clearJoints(){for(const g of jMarks){jScene.remove(g);g.children.forEach(c=>c.material.dispose())}jMarks.length=0;jFills.length=0}
  function addJoints(JT){for(const [j,pts] of Object.entries(JT))for(const p of pts){const g=new THREE.Group();g.position.set(p[0],p[1],p[2]);
    const mk=(geo,o)=>{const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({depthTest:false,depthWrite:false,transparent:true}));m.renderOrder=o;g.add(m);return m};
    const fill=mk(dotG,10),ring=mk(ringG,11);fill.userData.j=j;g.userData={j,fill,ring,i:pts.indexOf(p)};jMarks.push(g);jFills.push(fill);jScene.add(g)}paint()}
  const ro=new ResizeObserver(()=>{resize();need=true});ro.observe(box);
  let lastSz=null;
  function resize(){const r=box.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();need=true;
    /* the box changed shape (small figure in the corner, sheet up/down): fit the whole body again, keeping the side it is seen from */
    if(lastSz&&ready&&(Math.abs(r.width/lastSz[0]-1)>.15||Math.abs(r.height/lastSz[1]-1)>.15)){const dir=camera.position.clone().sub(controls.target).normalize();
      controls.target.set(0,CY,0);camera.position.copy(controls.target).add(dir.multiplyScalar(fitD()))}
    lastSz=[r.width,r.height];if(ready)lims()}
  /* owner (0.14, tighter in 0.19): not far away (1.1× the framing, was 1.3×) and not too close (0.5×, was 0.3 m) */
  function lims(){const f=fitD();controls.maxDistance=f*1.1;controls.minDistance=f*0.5}
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

  function paint(){const art=!!state.__art;
    for(const [k0,o] of Object.entries(parts)){if(k0==="mama"){o.material.uniforms.col.value.copy(art?C.art:C.aura);continue}const k=BASEK(k0),s=art?{}:state[k]||{};
    const c=art?(/^(osso|fundo|base|pele|pele_n|cabeca|tend)$/.test(k)?C.art:C.art2):s.on?C.target:s.syn?C.syn:k==="osso"?C.bone:k==="fundo"||k==="base"?C.base:k==="deco"||k==="tend"?C.mlo:/^(pele|pele_n|cabeca)$/.test(k)?C.m:s.c?(s.dim?new THREE.Color(s.c).lerp(C.m,.75):new THREE.Color(s.c)):(k===hov?C.hov:C.m);
    if(o.userData.fu)o.userData.fu.value.copy(C.fib);baseU.value.copy(C.base);
    o.material.color.copy(c);o.material.emissive.copy(s.on?C.target:s.syn?C.syn:new THREE.Color(0));o.material.emissiveIntensity=s.on||s.syn?0.18:0;
    /* Raio-X: glassy muscles, the red/orange ones a bit stronger so they still read */
    if(xrOn()&&XR==="raiox"&&o.material.isMeshStandardMaterial){const dk=C.m.getHSL({}).l<0.42;o.material.opacity=s.on?0.55:s.syn?0.45:/^(pele|cabeca)$/.test(k)?(dk?0.16:0.1):(dk?0.26:0.16)}}
    if(bones)bones.traverse(o=>{if(o.isMesh&&o.userData.k)o.material.color.copy(isCart(o.userData.k)?C.cart:C.osso)});
    /* Articulações: the joint marks (ring + dot, like the 2D) show only in that mode; the chosen joint is red */
    jScene.visible=art;for(const j of jMarks){const on=state.__j===j.userData.j;j.userData.fill.material.color.copy(on?C.target:(j.userData.j===hovJ?C.syn:C.surf));j.userData.ring.material.color.copy(on?C.thi:C.syn)}
    need=true}

  /* separation lines: every mesh is drawn once more with its own id into an off-screen buffer; a full-screen pass draws a
     thin dark line wherever neighbouring pixels have different ids (where muscles meet, at bones, around the outline) */
  const idT=new THREE.WebGLRenderTarget(2,2,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
  const idVS=`varying float vx;varying float vy;void main(){vec4 w=modelMatrix*vec4(position,1.0);vx=w.x;vy=w.y;gl_Position=projectionMatrix*viewMatrix*w;}`;
  const idFS=`uniform float id;uniform float sd;uniform float clipY;uniform float cl;varying float vx;varying float vy;void main(){if(cl>0.5&&vy>clipY)discard;gl_FragColor=gl_FrontFacing?vec4(id/255.0,sd>0.5?(vx>0.0?1.0:0.5):0.5,0.0,1.0):vec4(1.0,0.25,0.0,1.0);}`;
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
    for(const o of meshes){o.userData.mat=o.material;o.material=o.userData.idm}for(const o of ghosts){o.userData.vis=o.visible;o.visible=false}
    const bv=bones&&bones.visible;if(bv){if(XR==="esq")bones.traverse(o=>{if(o.isMesh&&o.userData.idm){o.userData.mat=o.material;o.material=o.userData.idm}});else bones.visible=false}
    renderer.setRenderTarget(idT);renderer.setClearColor(0x000000,1);renderer.clear();renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.setClearColor(0x000000,0);
    for(const o of meshes)o.material=o.userData.mat;for(const o of ghosts)o.visible=o.userData.vis!==false;
    if(bv){if(XR==="esq")bones.traverse(o=>{if(o.isMesh&&o.userData.idm)o.material=o.userData.mat});bones.visible=true}
    if(xrOn()&&XR==="raiox")sepMat.uniforms.a.value*=0.3;
    renderer.autoClear=false;renderer.render(sepScene,sepCam);
    if(jScene.visible){const s=camera.position.distanceTo(controls.target)*0.0085+0.004;for(const g of jMarks){g.quaternion.copy(camera.quaternion);g.scale.setScalar(s)}renderer.render(jScene,camera)}
    renderer.autoClear=true}

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
  function pickJ(x,y){const r=canvas.getBoundingClientRect();ndc.set(((x-r.left)/r.width)*2-1,-((y-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
    for(const g of jMarks){g.updateMatrixWorld(true)}
    /* a finger is wide: a mark counts as tapped within ~1.6× its size */
    let best=null,bd=Infinity;for(const g of jMarks){const p=g.position.clone().project(camera),dx=(p.x-ndc.x)*r.width/2,dy=(p.y-ndc.y)*r.height/2,d=Math.hypot(dx,dy);
      const rad=Math.max(16,g.scale.x/ (camera.position.distanceTo(g.position)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*r.height/2*1.6);if(d<rad&&d<bd){bd=d;best=g.userData.j}}return best}
  function pick(x,y){const r=canvas.getBoundingClientRect();ndc.set(((x-r.left)/r.width)*2-1,-((y-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
    const hs=ray.intersectObjects(pickables.filter(o=>o.visible),false),h=hs[0];lastHit=h?h.point:null;if(!h||!h.face)return null;
    const front=x=>x.face&&x.face.normal.clone().transformDirection(x.object.matrixWorld).dot(ray.ray.direction)<0;  /* the inside of a muscle seen through a gap is not a tap on it */
    const NM=k=>/^(osso|fundo|base|deco|tend|pele|pele_n|cabeca)$/.test(k);
    if(!front(h))return null;if(!NM(h.object.userData.k))return BASEK(h.object.userData.k);
    /* the filler layer sits just under the muscles: a tap on a seam still picks the muscle right behind it */
    const m=hs.find(x=>x.distance-h.distance<0.02&&!NM(x.object.userData.k)&&front(x));return m?BASEK(m.object.userData.k):h.object.userData.k}
  function focusAt(pt){if(!pt)return;const t0=performance.now(),ft=controls.target.clone(),fp=camera.position.clone(),dir=fp.clone().sub(ft).normalize();
    const nd=Math.max(controls.minDistance,Math.min(1.1,fp.distanceTo(ft)*0.5)),tp=pt.clone().add(dir.multiplyScalar(nd));
    (function step(){if(!alive)return;const k=Math.min(1,(performance.now()-t0)/420),e=1-Math.pow(1-k,3);controls.target.lerpVectors(ft,pt,e);camera.position.lerpVectors(fp,tp,e);need=true;if(k<1)requestAnimationFrame(step)})()}
  canvas.addEventListener("pointerdown",e=>{if(e.button===2){down=null;return}down={x:e.clientX,y:e.clientY,t:performance.now()}});   // right button = the menu
  /* a tap opens the list right where the finger is: without this the browser's late "click" would land on the list
     and open the exercise under the finger */
  canvas.addEventListener("touchend",e=>{if(e.cancelable)e.preventDefault()},{passive:false});
  canvas.addEventListener("pointerup",e=>{if(!down)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;down=null;
    if(moved>7||dt>500)return;
    if(api.covered()){api.tap(null);return}
    if(state.__art){const j=pickJ(e.clientX,e.clientY);if(j){api.joint(j);return}}
    const k=state.__art?null:pick(e.clientX,e.clientY),now=performance.now();
    if(now-lastTap.t<330&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<30){lastTap.t=0;focusAt(lastHit);return}
    lastTap={t:now,x:e.clientX,y:e.clientY};api.tap(k&&!/^(osso|fundo|base|deco|tend|pele|pele_n|cabeca)$/.test(k)?k:null)});
  const tip=document.createElement("div");tip.className="v3tip";tip.hidden=true;box.appendChild(tip);
  canvas.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse"||e.buttons)return;
    if(state.__art){const j=pickJ(e.clientX,e.clientY);if(j!==hovJ){hovJ=j;paint();canvas.style.cursor=j?"pointer":"grab"}tip.hidden=!j;if(j){const r=box.getBoundingClientRect();tip.textContent=api.jname(j);tip.style.left=(e.clientX-r.left)+"px";tip.style.top=(e.clientY-r.top)+"px"}return}
    const k=pick(e.clientX,e.clientY),nm=k&&api.name(k);const nk=nm?k:null;
    if(nk!==hov){hov=nk;paint();canvas.style.cursor=nk?"pointer":"grab"}
    if(nm){const r=box.getBoundingClientRect();tip.hidden=false;tip.textContent=nm;tip.style.left=(e.clientX-r.left)+"px";tip.style.top=(e.clientY-r.top)+"px"}else tip.hidden=true});
  canvas.addEventListener("pointerleave",()=>{tip.hidden=true;if(hov){hov=null;paint()}});
  controls.addEventListener("change",()=>{need=true});

  const mo=new MutationObserver(()=>{readColors();paint()});mo.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","class","style"]});
  const mq=matchMedia("(prefers-color-scheme: dark)"),onMq=()=>{readColors();paint()};mq.addEventListener("change",onMq);

  const FILES={m:["./corpo-13.glb","./juntas-4.json"],f:["./corpo-f-11.glb","./juntas-f-5.json"]};let loadN=0;
  async function load(sx){sx=sx==="f"?"f":"m";if(sx===curSex)return;curSex=sx;const my=++loadN,live=()=>alive&&my===loadN;
    fetch(new URL(FILES[sx][1],import.meta.url)).then(r=>r.json()).then(j=>{if(live()){clearJoints();addJoints(j)}}).catch(()=>{});
    let base;try{base=await getScene(FILES[sx][0],api.progress)}catch(e){if(live())api.fail();return}
    if(!live())return;
    {const g={scene:base.clone(true)};
      /* swapping ♂/♀: the old body goes away only when the new one is ready */
      if(root){scene.remove(root);root.traverse(o=>{if(o.isMesh){o.material.dispose();o.userData.idm&&o.userData.idm.dispose()}})}   /* geometry is shared: kept */
      for(const k in parts)delete parts[k];pickables.length=0;meshes.length=0;ghosts.length=0;root=g.scene;
      const ms=[];g.scene.traverse(o=>{if(o.isMesh)ms.push(o)});
      ms.forEach(o=>{const k=(o.name&&o.name!=="mesh"?o.name:(o.parent&&o.parent.name)||"deco").replace(/_\d+$/,"");
        o.material=new THREE.MeshStandardMaterial({color:0x999999,roughness:k==="osso"?0.75:k==="cabeca"?0.62:0.55,metalness:0,side:THREE.DoubleSide,vertexColors:!!o.geometry.attributes.color});   /* skull: baked shadow in the orbits, nose and teeth */
        if(CLIPK.has(k))o.material.clippingPlanes=[CLIPP];
        shade(o,!!o.geometry.attributes.uv&&k!=="osso"&&k!=="fundo");o.userData.k=k;parts[k]=o;pickables.push(o);
        o.userData.idm=new THREE.ShaderMaterial({uniforms:{clipY:CLIPU,cl:{value:CLIPK.has(k)?1:0},id:{value:k.startsWith("mama_")?250:meshes.length+1},sd:{value:/^(osso|fundo|base|pele|pele_n|cabeca|tend|mama_.*)$/.test(k)?0:1}},vertexShader:idVS,fragmentShader:idFS,side:THREE.DoubleSide});
        if(k==="mama"){o.material=ghostMat();o.renderOrder=5;
          pickables.splice(pickables.indexOf(o),1);ghosts.push(o);return}
        lay(o.material,k);lay(o.userData.idm,k);meshes.push(o)});
      scene.add(g.scene);const b=new THREE.Box3().setFromObject(g.scene),H=b.max.y-b.min.y;CY=b.min.y+H*0.5;BB=b.clone().expandByScalar(0.05);BH=H;BW=b.max.x-b.min.x;
      /* a light cloud of points on the body: the camera is kept a little away from it, so zooming never goes inside */
      {const P=[];g.scene.updateMatrixWorld(true);const v=new THREE.Vector3();
        for(const o of ms){const a=o.geometry.attributes.position,st=Math.max(1,Math.floor(a.count/260));for(let i=0;i<a.count;i+=st){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);P.push(v.x,v.y,v.z)}}
        CLOUD=new Float32Array(P)}
      applyHead();if(XR!=="off")loadBones();const first=!ready;ready=true;if(first){resize();view(curV,false)}else{lims();need=true}paint();readyRes&&readyRes();api.ready()}}
  /* an old model without the mannequin keeps its skull */
  /* with the mannequin, the tops of the upper trapezius and of the deep neck tissue would poke through the back of
     its head (thin ragged bits with outlines): they are clipped a little above the nape (0.58) */
  const CLIPK=new Set(["trapezio_superior","deco","fundo"]),CLIPU={value:99},CLIPP=new THREE.Plane(new THREE.Vector3(0,-1,0),99);
  function applyHead(){const mq=HEAD!=="skull"&&!!parts.cabeca;if(parts.osso)parts.osso.visible=!mq;if(parts.pele_n)parts.pele_n.visible=!mq;if(parts.cabeca)parts.cabeca.visible=mq;applyXr();
    let y=99;if(mq){const b=new THREE.Box3().setFromObject(parts.cabeca);y=b.max.y-0.172*(b.max.y-b.min.y)/0.328}
    CLIPU.value=y;CLIPP.constant=y;need=true}
  HEADS.add(applyHead);
  /* ---- skeleton (owner 0.65): the real BodyParts3D bones, posed like the muscles (tools/corpo3d/build.py → ossos.glb):
     "esq" = bone (ivory, baked shadow), "cart" = costal cartilages and intervertebral discs (bluish). Downloaded only when
     Raio-X or Esqueleto is chosen. Raio-X: the muscles turn glassy (front faces only, no depth write) and the deep
     filler/skull/tendon nodes of the body hide (the skeleton replaces them). Esqueleto: only the bones, with an outline. */
  const SKF={m:"./ossos-3.glb",f:"./ossos-f-4.glb"},RIGF={m:"./rig-2.json",f:"./rig-f-2.json"};
  const xrOn=()=>XR!=="off"&&!!bones&&bonesSex===curSex&&bones.visible;
  const isCart=k=>k==="cart"||k.startsWith("c_");
  async function loadBones(){if(XR==="off"||!curSex)return;if(bones&&bonesSex===curSex){applyXr();return}
    const sx=curSex,my=++boneN;let base,R=null;api.xrProg&&api.xrProg(0);
    const rp=fetch(new URL(RIGF[sx],import.meta.url)).then(r=>r.ok?r.json():null).catch(()=>null);
    try{base=await getScene(SKF[sx],x=>api.xrProg&&api.xrProg(x))}catch(e){api.xrProg&&api.xrProg(null);if(alive&&my===boneN)api.xrFail&&api.xrFail();return}
    R=await rp;api.xrProg&&api.xrProg(null);if(!alive||my!==boneN||sx!==curSex)return;
    if(bones){scene.remove(bones);bones.traverse(o=>{if(o.isMesh){o.material.dispose();o.userData.idm.dispose()}})}
    bones=base.clone(true);bonesSex=sx;
    bones.traverse(o=>{if(!o.isMesh)return;const k=o.name&&o.name!=="mesh"?o.name:(o.parent&&o.parent.name)||"esq";o.userData.k=k;
      o.material=new THREE.MeshStandardMaterial({color:isCart(k)?C.cart:C.osso,roughness:isCart(k)?0.42:0.68,metalness:0,vertexColors:!!o.geometry.attributes.color});
      o.userData.idm=new THREE.ShaderMaterial({uniforms:{clipY:CLIPU,cl:{value:0},id:{value:isCart(k)?240:241},sd:{value:0}},vertexShader:idVS,fragmentShader:idFS,side:THREE.DoubleSide})});
    rig=R?buildRig(R,bones):null;
    scene.add(bones);applyXr()}
  /* ---- joints of the skeleton (0.68, stage 1 of the animations; tools/corpo3d/rig.py → 3d/rig-N.json): one group per
     joint at its centre of rotation, nested like the body (pelvis → spine → head; shoulder girdle → arm → hand → fingers;
     hip → knee → ankle → foot → toes); each bone piece ("o_<joint>", "c_<joint>") hangs from the joint that moves it.
     pose({joint:{movement:degrees}}) takes anatomical angles (0 = anatomical position) and turns each joint by
     (angle − the angle the A-pose already has), kept inside the joint's range; order: rotation about the bone, then
     the side-to-side movement, then flexion. "coluna" / "lombar" / "toracica" / "cervical" spread a movement over the
     levels in proportion to each level's range. Couplings: scapulohumeral rhythm, patella, knee screw-home. */
  let rig=null;
  function buildRig(R,root){const J=R.articulacoes,G={},C0={};
    const mk=id=>{if(G[id])return G[id];const j=J[id];const g=new THREE.Group();g.name="j_"+id;C0[id]=new THREE.Vector3().fromArray(j.centro);
      const par=j.pai&&J[j.pai]?mk(j.pai):root;g.position.copy(C0[id]);if(j.pai&&J[j.pai])g.position.sub(C0[j.pai]);par.add(g);G[id]=g;return g};
    Object.keys(J).forEach(mk);
    const ms=[];root.traverse(o=>{if(o.isMesh)ms.push(o)});
    for(const o of ms){const seg=o.userData.k.replace(/^[oc]_/,"");const id=G[seg]?seg:"pelve";const g=G[id];
      o.updateMatrixWorld(true);const w=o.matrixWorld.clone();o.parent.remove(o);g.add(o);
      /* the piece keeps its place: its new local matrix = (joint at rest)⁻¹ × old world */
      const inv=new THREE.Matrix4().makeTranslation(-C0[id].x,-C0[id].y,-C0[id].z);o.matrix.copy(inv.multiply(w));o.matrix.decompose(o.position,o.quaternion,o.scale)}
    return {J,G,C0,CP:R.acoplamentos||[],ang:{}}}
  const SPINE={lombar:/^L\d$/,toracica:/^T\d+$/,cervical:/^C[2-7]$/,coluna:/^([LT]\d+|C[2-7])$/};
  function rigPose(P){if(!rig)return;const A={};
    for(const [id,v] of Object.entries(P||{})){const re=SPINE[id];
      if(re){for(const [mv,deg] of Object.entries(v)){const lv=Object.keys(rig.J).filter(k=>re.test(k));
          const w=lv.map(k=>{const d=rig.J[k].mov.find(m=>m.id===mv);return d?(deg>=0?d.max:-d.min):0}),sw=w.reduce((a,b)=>a+b,0)||1;
          lv.forEach((k,i)=>{(A[k]||(A[k]={}))[mv]=((A[k]||{})[mv]||0)+deg*w[i]/sw})}}
      else A[id]={...(A[id]||{}),...v}}
    const get=(id,mv)=>{const d=rig.J[id]&&rig.J[id].mov.find(m=>m.id===mv);return d?(A[id]&&A[id][mv]!=null?A[id][mv]:d.repouso):0};
    for(const c of rig.CP){const [sid,smv]=c.de.split("."),sd=rig.J[sid]&&rig.J[sid].mov.find(m=>m.id===smv);if(!sd)continue;
      const f=x=>c.apos!=null?Math.max(0,x-c.apos):Math.max(0,c.ate-x),dv=f(get(sid,smv))-f(sd.repouso);if(!dv)continue;
      for(const [tg,k] of c.para){const [tid,tmv]=tg.split(".");const td=rig.J[tid]&&rig.J[tid].mov.find(m=>m.id===tmv);if(!td)continue;
        (A[tid]||(A[tid]={}))[tmv]=get(tid,tmv)+k*dv}}
    rig.ang=A;
    const q=new THREE.Quaternion(),t=new THREE.Quaternion(),ax=new THREE.Vector3();
    for(const [id,j] of Object.entries(rig.J)){const g=rig.G[id];q.identity();
      const ord=[...j.mov].sort((a,b)=>(a.id==="rot"||a.id==="pron"?0:a.id==="flex"||a.id==="elev"?2:1)-(b.id==="rot"||b.id==="pron"?0:b.id==="flex"||b.id==="elev"?2:1));
      for(const d of ord){const val=Math.min(d.max,Math.max(d.min,get(id,d.id)));const dl=THREE.MathUtils.degToRad(val-d.repouso);if(!dl)continue;
        t.setFromAxisAngle(ax.fromArray(d.eixo).normalize(),dl);q.premultiply(t)}
      g.quaternion.copy(q)}
    /* the arm angles asked for are against the trunk (as in an exam): the shoulder blade and collarbone move with the
       scapulohumeral rhythm, and the glenohumeral takes only what is left, so the arm ends exactly where it was asked */
    for(const s of ["d","e"]){const gh=rig.G["ombro_"+s],tr=rig.G.T4,sc=rig.G["esc_"+s];if(!gh||!tr||!sc)continue;
      tr.updateWorldMatrix(true,false);sc.updateWorldMatrix(true,false);
      const qt=new THREE.Quaternion(),qs=new THREE.Quaternion();tr.getWorldQuaternion(qt);sc.getWorldQuaternion(qs);
      const rel=qt.clone().invert().multiply(qs);gh.quaternion.premultiply(rel.invert())}
    /* the Articulações marks follow their joint */
    const MK={pescoco:["C4"],toracica:["T6"],lombar:["L3"]};for(const k of ["ombro","cotovelo","punho","quadril","joelho","tornozelo"])MK[k]=[k+"_d",k+"_e"];
    for(const g of jMarks){const id=(MK[g.userData.j]||[])[g.userData.i],G=id&&rig.G[id];if(!G)continue;G.updateWorldMatrix(true,false);G.getWorldPosition(g.position)}
    need=true}
  /* for screenshots and checks: dots at the joint centres and short lines along each axis (flexion red, side-to-side
     green, rotation blue) */
  let rigDbg=null;
  function rigDebug(on){if(rigDbg){for(const g of rigDbg){g.parent&&g.parent.remove(g);g.traverse(o=>{o.geometry&&o.geometry.dispose();o.material&&o.material.dispose()})}rigDbg=null}
    if(!on||!rig)return need=true;rigDbg=[];const sg=new THREE.SphereGeometry(0.0055,10,8);
    for(const [id,j] of Object.entries(rig.J)){const g=new THREE.Group();rig.G[id].add(g);
      const dot=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({color:0xff7a00,depthTest:false,transparent:true}));dot.renderOrder=20;g.add(dot);
      for(const d of j.mov){const c=d.id==="flex"||d.id==="elev"?0xe8202a:d.id==="rot"||d.id==="pron"?0x2a6cf0:0x22a05a,L=/^(mcf|ifp|ifd|if1|mtf|ifpp|ifdp|ifh)/.test(id)?0.014:0.035;
        const v=new THREE.Vector3().fromArray(d.eixo).normalize().multiplyScalar(L);
        const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([v.clone().negate(),v]),new THREE.LineBasicMaterial({color:c,depthTest:false,transparent:true}));ln.renderOrder=21;g.add(ln)}
      rigDbg.push(g)}
    need=true}
  function applyXr(){const on=XR!=="off"&&!!bones&&bonesSex===curSex;if(bones)bones.visible=on;
    for(const [k,o] of Object.entries(parts)){
      if(on&&(XR==="esq"||/^(fundo|tend|osso|pele_n)$/.test(k)))o.visible=false;
      else if(k==="osso"||k==="pele_n")o.visible=HEAD==="skull"||!parts.cabeca;
      else if(k==="cabeca")o.visible=HEAD!=="skull";
      else o.visible=true;
      const m=o.material;if(!m||!m.isMeshStandardMaterial)continue;const glass=on&&XR==="raiox";
      if(m.transparent!==glass){m.transparent=glass;m.depthWrite=!glass;m.side=glass?THREE.FrontSide:THREE.DoubleSide;if(!glass)m.opacity=1;m.needsUpdate=true}}
    paint()}
  let readyRes=null;const readyP=new Promise(r=>readyRes=r);
  load(api.sex?api.sex():"m");

  renderer.setAnimationLoop(()=>{if(!box.offsetParent)return;   /* hidden (2D or another tab): no drawing */
    controls.enabled=!api.covered();
    if(controls.update())need=true;
    /* the point it turns around stays near the middle of the body (owner 0.19: "mais centralizado") */
    const t=controls.target,c=t.clone().clamp(BB.min,BB.max);c.x=Math.max(-BW*0.2,Math.min(BW*0.2,c.x));c.z=Math.max(-0.08,Math.min(0.08,c.z));if(!c.equals(t)){camera.position.add(c.clone().sub(t));t.copy(c);need=true}
    if(need){keepOut();need=false;draw()}});
  /* owner: zoom must not go inside the body — if the camera gets closer than ~13 cm to the surface, it backs off */
  const camP=new THREE.Vector3(),awayV=new THREE.Vector3();
  function keepOut(){if(!CLOUD)return;const R=0.13,R2=R*R;
    for(let it=0;it<4;it++){const p=camera.position;let m=Infinity;
      for(let i=0;i<CLOUD.length;i+=3){const dx=CLOUD[i]-p.x,dy=CLOUD[i+1]-p.y,dz=CLOUD[i+2]-p.z,d=dx*dx+dy*dy+dz*dz;if(d<m)m=d}
      if(m>=R2)return;awayV.copy(p).sub(controls.target);const L=awayV.length()||1;awayV.multiplyScalar((R-Math.sqrt(m)+0.01)/L);p.add(awayV)}}

  return {
    sync(s){state=s||{};paint()},
    /* which muscle is under this screen point (menu do botão direito / segurar) */
    pickAt(x,y){const k=ready?pick(x,y):null;return k&&!/^(osso|fundo|base|deco|tend|pele|pele_n|cabeca)$/.test(k)?k:null},
    view(v){view(v==="back"?"back":"front")},
    sex(s){return load(s)},
    whenReady(){return readyP},
    /* a picture of the body (front and back side by side) with these colours, for the Stories cards */
    shot(st,w=560,h=980){const sv={st:state,cp:camera.position.clone(),ct:controls.target.clone(),pr:renderer.getPixelRatio(),asp:camera.aspect};
      state=st||{};paint();renderer.setPixelRatio(1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
      const out=document.createElement("canvas");out.width=w*2;out.height=h;const g2=out.getContext("2d");
      for(const [i,a] of [[0,0],[1,Math.PI]]){const d=fitD()*1.02;controls.target.set(0,CY,0);camera.position.set(Math.sin(a)*d,CY+0.03,Math.cos(a)*d);camera.lookAt(controls.target);camera.updateMatrixWorld();
        draw();g2.drawImage(canvas,i*w,0,w,h)}
      state=sv.st;renderer.setPixelRatio(sv.pr);camera.position.copy(sv.cp);controls.target.copy(sv.ct);lastSz=null;resize();paint();return out},
    xray(m){XR=m==="raiox"||m==="esq"?m:"off";if(XR==="off")applyXr();else loadBones()},
    xrNow(){return XR},
    /* 0.68: the skeleton's joints (Esqueleto/Raio-X loaded): pose({ombro_d:{flex:90},coluna:{flex:30}…}), rig info, debug marks */
    pose(P){rigPose(P)},rigReady(){return !!rig},rigJoints(){return rig?Object.fromEntries(Object.entries(rig.J).map(([k,j])=>[k,{nome:j.nome,pai:j.pai,mov:j.mov.map(m=>[m.id,m.min,m.max,m.repouso])}])):null},
    rigDebug(on){rigDebug(on)},
    jointPos(id){if(!rig||!rig.G[id])return null;const v=new THREE.Vector3();rig.G[id].getWorldPosition(v);return v.toArray()},
    /* for tests: is this part drawn now; bounding boxes of the skeleton and of the body */
    visible(k){return !!(parts[k]&&parts[k].visible)},
    boxes(){if(!bones||!root)return null;const bb=new THREE.Box3().setFromObject(bones),cv=root.visible;const v0=Object.values(parts).map(o=>o.visible);Object.values(parts).forEach(o=>o.visible=true);
      const cb=new THREE.Box3().setFromObject(root);Object.values(parts).forEach((o,i)=>o.visible=v0[i]);return {bones:{min:bb.min.toArray(),max:bb.max.toArray()},body:{min:cb.min.toArray(),max:cb.max.toArray()}}},
    bonesReady(){return !!bones&&bonesSex===curSex},
    sexNow(){return curSex},
    refit(){resize();view(curV,true)},
    keys(){return Object.keys(parts)},
    /* for tests: where a muscle is on screen (middle of its front/back half), and its colour now */
    at(k){const o=parts[k];if(!o)return null;const bb=new THREE.Box3().setFromObject(o),c=bb.getCenter(new THREE.Vector3());c.z=curV==="back"?bb.min.z:bb.max.z;c.x=bb.min.x+(bb.max.x-bb.min.x)*0.3;
      c.project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(c.x+1)/2*r.width,y:r.top+(1-c.y)/2*r.height}},
    /* for screenshots: look from an angle (deg, 0 = front), distance (m) and height (0..1 of the body) */
    look(deg,dist,yf,xo){const a=THREE.MathUtils.degToRad(deg),y=yf==null?CY:BB.min.y+(BB.max.y-BB.min.y)*yf,d=dist||fitD(),x=xo||0;
      controls.target.set(x,y,0);camera.position.set(x+Math.sin(a)*d,y+0.03,Math.cos(a)*d);need=true},
    /* for tests: put the camera somewhere (relative to the target) and read where it ended up */
    place(x,y,z){camera.position.set(controls.target.x+x,controls.target.y+y,controls.target.z+z);need=true},
    cam(){const o=camera.position.clone().sub(controls.target),p=camera.position;let m=Infinity;
      if(CLOUD)for(let i=0;i<CLOUD.length;i+=3)m=Math.min(m,Math.hypot(CLOUD[i]-p.x,CLOUD[i+1]-p.y,CLOUD[i+2]-p.z));
      return {dist:o.length(),polar:THREE.MathUtils.radToDeg(Math.acos(o.y/o.length())),surf:m,max:controls.maxDistance,min:controls.minDistance}},
    jointAt(j){const g=jMarks.find(x=>x.userData.j===j);if(!g)return null;const c=g.position.clone().project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(c.x+1)/2*r.width,y:r.top+(1-c.y)/2*r.height,c:"#"+g.userData.fill.material.color.getHexString()}},
    color(k){const o=parts[k];return o?"#"+o.material.color.getHexString():null},
    dispose(){alive=false;HEADS.delete(applyHead);renderer.setAnimationLoop(null);ro.disconnect();mo.disconnect();mq.removeEventListener("change",onMq);controls.dispose();renderer.dispose();canvas.remove();tip.remove()}
  };
}
