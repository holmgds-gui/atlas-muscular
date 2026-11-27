/* Muscle Atlas — 3D body (owner, nov/2026: "adicione o modelo 3D no app com um botão 3D").
   Loaded only when the 3D button is tapped (import("./3d/v3.js")). Three.js comes from jsDelivr through the import map
   in index.html; the models are 3d/corpo-14.glb (male; 0.71 more muscle volume, 0.76 skin weights) and 3d/corpo-f-8.glb (now 3d/corpo-f-12.glb; 0.70: mannequin head shaped on the skull; more feminine in 0.66; female, owner 0.15–0.17; mannequin head 0.54, plain 0.57, smooth egg 0.58, jaw 0.59–0.60), each with its joint
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
/* 0.80 (owner: "no supino o braço fica muito fino … está esticando muito"): dual-quaternion skinning. With the usual
   linear blend a part that twists (the forearm turning ~140° to hold the bar) or bends a lot (elbow, knee) shrinks — the
   "candy wrapper". Here each bone's matrix is turned into a dual quaternion (skinBody(): skeleton.update writes them
   into the first 8 floats of each bone's slot in the bone texture) and the shader blends those, which keeps the volume.
   All the SkinnedMeshes of the app are this body, so the chunks are replaced for every material. */
THREE.ShaderChunk.skinning_pars_vertex=THREE.ShaderChunk.skinning_pars_vertex.replace("uniform mat4 bindMatrix;","uniform mat4 bindMatrix;\n\tattribute float skinDq;");
/* 0.83: each vertex mixes the two ways (skinDq, from skinBody → dqShare()): 1 = dual quaternion (forearm twist, elbow, knee
   keep their volume), 0 = linear (the "sheets" that stretch from the trunk to a limb — armpit, chest, back, hip — which
   with dual quaternions swing out on an arc and fold inside out when the arm goes overhead) */
THREE.ShaderChunk.skinbase_vertex=`#ifdef USE_SKINNING
	mat4 dqmX=getBoneMatrix(skinIndex.x),dqmY=getBoneMatrix(skinIndex.y),dqmZ=getBoneMatrix(skinIndex.z),dqmW=getBoneMatrix(skinIndex.w);
	vec4 dqR=dqmX[0]*skinWeight.x,dqD=dqmX[1]*skinWeight.x;
	float dqs=dot(dqmX[0],dqmY[0])<0.0?-1.0:1.0;dqR+=dqmY[0]*skinWeight.y*dqs;dqD+=dqmY[1]*skinWeight.y*dqs;
	dqs=dot(dqmX[0],dqmZ[0])<0.0?-1.0:1.0;dqR+=dqmZ[0]*skinWeight.z*dqs;dqD+=dqmZ[1]*skinWeight.z*dqs;
	dqs=dot(dqmX[0],dqmW[0])<0.0?-1.0:1.0;dqR+=dqmW[0]*skinWeight.w*dqs;dqD+=dqmW[1]*skinWeight.w*dqs;
	float dqL=max(length(dqR),1e-6);dqR/=dqL;dqD/=dqL;
#endif`;
THREE.ShaderChunk.skinning_pars_vertex+=`
#ifdef USE_SKINNING
	vec3 dqRot(vec4 r,vec3 p){return p+2.0*cross(r.xyz,cross(r.xyz,p)+r.w*p);}
	vec3 dqTr(vec4 r,vec4 d){return 2.0*(r.w*d.xyz-d.w*r.xyz+cross(r.xyz,d.xyz));}
	vec3 dqLin(mat4 a,mat4 b,mat4 c,mat4 e,vec4 w,vec3 p){
		return w.x*(dqRot(a[0],p)+dqTr(a[0],a[1]))+w.y*(dqRot(b[0],p)+dqTr(b[0],b[1]))+w.z*(dqRot(c[0],p)+dqTr(c[0],c[1]))+w.w*(dqRot(e[0],p)+dqTr(e[0],e[1]));}
	vec3 dqLinN(mat4 a,mat4 b,mat4 c,mat4 e,vec4 w,vec3 n){return w.x*dqRot(a[0],n)+w.y*dqRot(b[0],n)+w.z*dqRot(c[0],n)+w.w*dqRot(e[0],n);}
#endif`;
THREE.ShaderChunk.skinning_vertex=`#ifdef USE_SKINNING
	vec3 dqp=(bindMatrix*vec4(transformed,1.0)).xyz;
	vec3 dqA=dqRot(dqR,dqp)+dqTr(dqR,dqD),dqB=dqLin(dqmX,dqmY,dqmZ,dqmW,skinWeight,dqp);
	transformed=(bindMatrixInverse*vec4(mix(dqB,dqA,skinDq),1.0)).xyz;
#endif`;
THREE.ShaderChunk.skinnormal_vertex=`#ifdef USE_SKINNING
	vec3 dqn=mat3(bindMatrix)*objectNormal;dqn=normalize(mix(dqLinN(dqmX,dqmY,dqmZ,dqmW,skinWeight,dqn),dqRot(dqR,dqn),skinDq));objectNormal=mat3(bindMatrixInverse)*dqn;
	#ifdef USE_TANGENT
		vec3 dqt=mat3(bindMatrix)*objectTangent;dqt=mix(dqLinN(dqmX,dqmY,dqmZ,dqmW,skinWeight,dqt),dqRot(dqR,dqt),skinDq);objectTangent=mat3(bindMatrixInverse)*dqt;
	#endif
#endif`;
const _dqM=new THREE.Matrix4(),_dqQ=new THREE.Quaternion();
function dqSkeleton(sk){const up=sk.update.bind(sk);
  sk.update=function(){up();const a=this.boneMatrices;
    for(let i=0,n=this.bones.length;i<n;i++){const o=16*i;_dqM.fromArray(a,o);_dqQ.setFromRotationMatrix(_dqM);
      const x=_dqQ.x,y=_dqQ.y,z=_dqQ.z,w=_dqQ.w,tx=a[o+12],ty=a[o+13],tz=a[o+14];
      a[o]=x;a[o+1]=y;a[o+2]=z;a[o+3]=w;
      a[o+4]=0.5*(tx*w+ty*z-tz*y);a[o+5]=0.5*(-tx*z+ty*w+tz*x);a[o+6]=0.5*(tx*y-ty*x+tz*w);a[o+7]=-0.5*(tx*x+ty*y+tz*z)}}
  return sk}

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
  let XR="off",bones=null,bonesSex=null,boneN=0,boneMs=[],bonesVis=false;
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
    vertexShader:`#include <common>
#include <skinning_pars_vertex>
varying vec3 vN;varying vec3 vV;varying float vF;void main(){
#include <skinbase_vertex>
#include <begin_vertex>
#include <skinning_vertex>
vec4 mv=modelViewMatrix*vec4(transformed,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vF=color.r;gl_Position=projectionMatrix*mv;}`,
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
      if(MOT){controls.target.copy(MOT.tgt);camera.position.copy(MOT.tgt).add(dir.multiplyScalar(fitD()*MOT.dk))}
      else{controls.target.set(0,CY,0);camera.position.copy(controls.target).add(dir.multiplyScalar(fitD()))}}
    lastSz=[r.width,r.height];if(ready&&!MOT)lims()}
  /* owner (0.14, tighter in 0.19): not far away (1.1× the framing, was 1.3×) and not too close (0.5×, was 0.3 m) */
  function lims(){const f=fitD();controls.maxDistance=f*1.1;controls.minDistance=f*0.5}
  const reduce=()=>document.documentElement.classList.contains("noanim")||matchMedia("(prefers-reduced-motion: reduce)").matches;
  let BW=1.2,BH=1.7;
  /* the whole body fits the box with a small margin, whatever its shape */
  const fitD=()=>{const t=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));return Math.max(BH*1.06/(2*t),BW*1.08/(2*t*camera.aspect))};
  function view(v,anim=true){curV=v;if(MOT)return;const d=fitD(),a=v==="back"?Math.PI:0;
    const to=new THREE.Vector3(Math.sin(a)*d,CY+0.03,Math.cos(a)*d),tt=new THREE.Vector3(0,CY,0);
    if(!anim||reduce()){camera.position.copy(to);controls.target.copy(tt);need=true;return}
    const from=camera.position.clone(),t0=performance.now(),ft=controls.target.clone();
    /* turn around the body instead of cutting through it */
    const fa=Math.atan2(from.x,from.z),fd=Math.hypot(from.x,from.z);let da=a-fa;da=Math.atan2(Math.sin(da),Math.cos(da));
    (function step(){if(!alive||MOT)return;const k=Math.min(1,(performance.now()-t0)/550),e=1-Math.pow(1-k,3),ang=fa+da*e,dd=fd+(d-fd)*e;
      camera.position.set(Math.sin(ang)*dd,from.y+(to.y-from.y)*e,Math.cos(ang)*dd);controls.target.lerpVectors(ft,tt,e);need=true;if(k<1)requestAnimationFrame(step)})()}

  function paint(){const art=!!state.__art;
    for(const [k0,o] of Object.entries(parts)){if(k0==="mama"){o.material.uniforms.col.value.copy(art?C.art:C.aura);continue}const k=BASEK(k0),s=art?{}:state[k]||{};
    const c=art?(/^(osso|fundo|base|pele|pele_n|cabeca|tend)$/.test(k)?C.art:C.art2):s.on?C.target:s.syn?C.syn:k==="osso"?C.bone:k==="fundo"||k==="base"?C.base:k==="deco"||k==="tend"?C.mlo:/^(pele|pele_n|cabeca)$/.test(k)?C.m:s.c?(s.dim?new THREE.Color(s.c).lerp(C.m,.75):new THREE.Color(s.c)):(k===hov?C.hov:C.m);
    if(o.userData.fu)o.userData.fu.value.copy(C.fib);baseU.value.copy(C.base);
    o.material.color.copy(c);o.material.emissive.copy(s.on?C.target:s.syn?C.syn:new THREE.Color(0));o.material.emissiveIntensity=s.on||s.syn?0.18:0;
    /* Raio-X: glassy muscles, the red/orange ones a bit stronger so they still read */
    if(xrOn()&&XR==="raiox"&&o.material.isMeshStandardMaterial){const dk=C.m.getHSL({}).l<0.42;o.material.opacity=s.on?0.55:s.syn?0.45:/^(pele|cabeca)$/.test(k)?(dk?0.16:0.1):(dk?0.26:0.16)}}
    for(const o of boneMs)o.material.color.copy(isCart(o.userData.k)?C.cart:C.osso);
    /* Articulações: the joint marks (ring + dot, like the 2D) show only in that mode; the chosen joint is red */
    jScene.visible=art;for(const j of jMarks){const on=state.__j===j.userData.j;j.userData.fill.material.color.copy(on?C.target:(j.userData.j===hovJ?C.syn:C.surf));j.userData.ring.material.color.copy(on?C.thi:C.syn)}
    need=true}

  /* separation lines: every mesh is drawn once more with its own id into an off-screen buffer; a full-screen pass draws a
     thin dark line wherever neighbouring pixels have different ids (where muscles meet, at bones, around the outline) */
  const idT=new THREE.WebGLRenderTarget(2,2,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
  /* 0.76: skinning-aware (the body bends with the skeleton) */
  const idVS=`#include <common>
#include <skinning_pars_vertex>
varying float vx;varying float vy;void main(){
#include <skinbase_vertex>
#include <begin_vertex>
#include <skinning_vertex>
vec4 w=modelMatrix*vec4(transformed,1.0);vx=w.x;vy=(modelMatrix*vec4(position,1.0)).y;gl_Position=projectionMatrix*viewMatrix*w;}`;   /* vy: height at rest, so the nape clip follows the body when it bends */
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
    for(const o of meshes)o.userData.mat=o.material,o.material=o.userData.idm;for(const o of eqMeshes)o.userData.mat=o.material,o.material=o.userData.idm;for(const o of ghosts){o.userData.vis=o.visible;o.visible=false}
    const bv=bonesVis;if(bv){if(XR==="esq")for(const o of boneMs){o.userData.mat=o.material;o.material=o.userData.idm}else boneShow(false)}
    renderer.setRenderTarget(idT);renderer.setClearColor(0x000000,1);renderer.clear();renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.setClearColor(0x000000,0);
    for(const o of meshes)o.material=o.userData.mat;for(const o of eqMeshes)o.material=o.userData.mat;for(const o of ghosts)o.visible=o.userData.vis!==false;
    if(bv){if(XR==="esq")for(const o of boneMs)o.material=o.userData.mat;else boneShow(true)}
    if(xrOn()&&XR==="raiox")sepMat.uniforms.a.value*=0.3;
    renderer.autoClear=false;renderer.render(sepScene,sepCam);
    if(jScene.visible){const s=camera.position.distanceTo(controls.target)*0.0085+0.004;for(const g of jMarks){g.quaternion.copy(camera.quaternion);g.scale.setScalar(s)}renderer.render(jScene,camera)}
    renderer.autoClear=true}

  /* hand-drawn fibre strokes along each muscle (uv.x across the fibres, uv.y along them), fading out when far away;
     the inside of a muscle seen through a gap is painted a flat deep colour so the body reads as solid */
  const baseU={value:new THREE.Color()},nearU={value:1};
  function shade(o,fib){const g=o.geometry;if(fib)g.setAttribute("fib",g.attributes.uv);const fu={value:new THREE.Color()};o.userData.fu=fu;
    o.material.onBeforeCompile=sh=>{sh.uniforms.fibCol=fu;sh.uniforms.baseCol=baseU;sh.uniforms.fibNear=nearU;
      /* 0.76: the nape clip (trapezius top, deep neck tissue) is cut at the height they have at rest, so it rides along
         when the body bends instead of slicing through a raised shoulder */
      if(o.userData.clip){sh.uniforms.clipY=CLIPU;
        sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying float vRestY;").replace("#include <begin_vertex>","#include <begin_vertex>\nvRestY=(modelMatrix*vec4(position,1.0)).y;");
        sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying float vRestY;uniform float clipY;").replace("#include <clipping_planes_fragment>","#include <clipping_planes_fragment>\n if(vRestY>clipY)discard;")}
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
    };o.material.customProgramCacheKey=()=>(fib?"fib":"solid")+(o.userData.clip?"-clip":"")}   /* 0.76: the nape clip makes a different shader */

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

  const FILES={m:["./corpo-14.glb","./juntas-4.json"],f:["./corpo-f-12.glb","./juntas-f-5.json"]};let loadN=0;
  async function load(sx){sx=sx==="f"?"f":"m";if(sx===curSex)return;curSex=sx;const my=++loadN,live=()=>alive&&my===loadN;
    fetch(new URL(FILES[sx][1],import.meta.url)).then(r=>r.json()).then(j=>{if(live()){clearJoints();addJoints(j)}}).catch(()=>{});
    const rp=fetch(new URL(RIGF[sx],import.meta.url)).then(r=>r.ok?r.json():null).catch(()=>null);
    let base;try{base=await getScene(FILES[sx][0],api.progress)}catch(e){if(live())api.fail();return}
    if(!live())return;
    {const g={scene:base.clone(true)};
      /* swapping ♂/♀: the old body goes away only when the new one is ready */
      if(root){scene.remove(root);root.traverse(o=>{if(o.isMesh){o.material.dispose();o.userData.idm&&o.userData.idm.dispose()}})}   /* geometry is shared: kept */
      for(const k in parts)delete parts[k];pickables.length=0;meshes.length=0;ghosts.length=0;root=g.scene;
      let ms=[];g.scene.traverse(o=>{if(o.isMesh)ms.push(o)});
      /* 0.76: the joints come with the body, and the body is skinned to them */
      if(rigRoot){scene.remove(rigRoot);rigRoot=null}rig=null;dropBones();
      {const R=await rp;if(!live())return;if(R&&R.pele){rig=buildRig(R);rig.sex=sx;scene.add(rigRoot);ms=skinBody(ms)}}
      ms.forEach(o=>{const k=(o.name&&o.name!=="mesh"?o.name:(o.parent&&o.parent.name)||"deco").replace(/_\d+$/,"");
        o.material=new THREE.MeshStandardMaterial({color:0x999999,roughness:k==="osso"?0.75:k==="cabeca"?0.62:0.55,metalness:0,side:THREE.DoubleSide,vertexColors:!!o.geometry.attributes.color});   /* skull: baked shadow in the orbits, nose and teeth */
        o.userData.clip=CLIPK.has(k);
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
      applyHead();if(XR!=="off")loadBones();const first=!ready;ready=true;if(first){resize();view(curV,false)}else{lims();need=true}paint();if(MOT){const o=MOT;MOT=null;motionStart(o.key,{...o.opt,play:o.play,speed:o.speed})}readyRes&&readyRes();api.ready()}}
  /* an old model without the mannequin keeps its skull */
  /* with the mannequin, the tops of the upper trapezius and of the deep neck tissue would poke through the back of
     its head (thin ragged bits with outlines): they are clipped a little above the nape (0.58) */
  const CLIPK=new Set(["trapezio_superior","deco","fundo"]),CLIPU={value:99},CLIPP=new THREE.Plane(new THREE.Vector3(0,-1,0),99);
  /* 0.72 (owner: "parece uma gola"): the upper trapezius was cut flat at the nape and its rim stuck out ~2 cm around the
     mannequin's neck. With the mannequin, the vertices from just above the base of the neck up to the cut are drawn in
     toward the neck's own ellipse (measured on the head model), so the muscle tapers into the neck and the rim hides
     inside it. The geometry is cloned (the loaded one is shared); both versions are kept and swapped by applyHead. */
  function neckFit(){const o=parts.trapezio_superior,h=parts.cabeca;if(!o||!h||o.userData.nk)return;
    const m=o.matrixWorld,mh=h.matrixWorld;o.updateWorldMatrix(true,false);h.updateWorldMatrix(true,false);
    const hb=new THREE.Box3().setFromObject(h),y0=hb.min.y,y1=hb.max.y-0.172*(hb.max.y-hb.min.y)/0.328,v=new THREE.Vector3();
    const ha=h.geometry.attributes.position;let xn=1e9,xx=-1e9,zn=1e9,zx=-1e9;
    for(let i=0;i<ha.count;i++){v.fromBufferAttribute(ha,i).applyMatrix4(mh);if(v.y>y0+0.03&&v.y<y0+0.10){xn=Math.min(xn,v.x);xx=Math.max(xx,v.x);zn=Math.min(zn,v.z);zx=Math.max(zx,v.z)}}
    if(xx<xn)return;
    const cx=(xn+xx)/2,cz=(zn+zx)/2,rx=(xx-xn)/2*NK.fit,rz=(zx-zn)/2*NK.fit,a0=y0+NK.from,inv=m.clone().invert();
    const g=o.geometry.clone(),pa=g.attributes.position,buf=pa.isInterleavedBufferAttribute?pa.data:pa,orig=buf.array.slice();   /* the model's buffers are interleaved: positions, normals, … share one array */
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m);
      let t=(v.y-a0)/(y1-a0);t=Math.min(1,Math.max(0,t));t=t*t*(3-2*t);if(t<=0)continue;
      const dx=v.x-cx,dz=v.z-cz,n=Math.hypot(dx/rx,dz/rz),k=n>1?1/n:1,f=1+(k-1)*t;
      v.set(cx+dx*f,v.y,cz+dz*f).applyMatrix4(inv);pa.setXYZ(i,v.x,v.y,v.z)}
    if(g.attributes.normal)g.computeVertexNormals();
    o.geometry=g;o.userData.nk={buf,orig,fit:buf.array.slice()}}
  const NK={fit:0.92,from:0.045};
  function neckApply(on){const o=parts.trapezio_superior,n=o&&o.userData.nk;if(!n)return;
    n.buf.array.set(on?n.fit:n.orig);n.buf.needsUpdate=true;
    o.geometry.computeBoundingSphere();o.geometry.computeBoundingBox()}
  function applyHead(){const mq=HEAD!=="skull"&&!!parts.cabeca;if(mq)neckFit();neckApply(mq);if(parts.osso)parts.osso.visible=!mq;if(parts.pele_n)parts.pele_n.visible=!mq;if(parts.cabeca)parts.cabeca.visible=mq;applyXr();
    let y=99;if(mq){const b=new THREE.Box3().setFromObject(parts.cabeca);y=b.max.y-0.172*(b.max.y-b.min.y)/0.328}
    CLIPU.value=y;CLIPP.constant=y;need=true}
  HEADS.add(applyHead);
  /* ---- skeleton (owner 0.65): the real BodyParts3D bones, posed like the muscles (tools/corpo3d/build.py → ossos.glb):
     "esq" = bone (ivory, baked shadow), "cart" = costal cartilages and intervertebral discs (bluish). Downloaded only when
     Raio-X or Esqueleto is chosen. Raio-X: the muscles turn glassy (front faces only, no depth write) and the deep
     filler/skull/tendon nodes of the body hide (the skeleton replaces them). Esqueleto: only the bones, with an outline. */
  const SKF={m:"./ossos-3.glb",f:"./ossos-f-4.glb"},RIGF={m:"./rig-3.json",f:"./rig-f-3.json"};
  const xrOn=()=>XR!=="off"&&!!bones&&bonesSex===curSex&&bonesVis;
  /* 0.78: since 0.76 the bone meshes live on the joints (attachBones), not under "bones": they are shown/hidden one by one
     (the 0.76/0.77 bug — bones stayed visible through the muscles after leaving Esqueleto/Raio-X) */
  function boneShow(v){if(bones)bones.visible=v;for(const o of boneMs)o.visible=v}
  function dropBones(){if(!bones)return;for(const o of boneMs){o.parent&&o.parent.remove(o);o.material.dispose();o.userData.idm.dispose()}scene.remove(bones);bones=null;boneMs=[];bonesSex=null;bonesVis=false}
  const isCart=k=>k==="cart"||k.startsWith("c_");
  async function loadBones(){if(XR==="off"||!curSex)return;if(bones&&bonesSex===curSex){applyXr();return}
    const sx=curSex,my=++boneN;let base;api.xrProg&&api.xrProg(0);
    try{base=await getScene(SKF[sx],x=>api.xrProg&&api.xrProg(x))}catch(e){api.xrProg&&api.xrProg(null);if(alive&&my===boneN)api.xrFail&&api.xrFail();return}
    api.xrProg&&api.xrProg(null);if(!alive||my!==boneN||sx!==curSex)return;
    dropBones();
    bones=base.clone(true);bonesSex=sx;
    bones.traverse(o=>{if(!o.isMesh)return;const k=o.name&&o.name!=="mesh"?o.name:(o.parent&&o.parent.name)||"esq";o.userData.k=k;
      o.material=new THREE.MeshStandardMaterial({color:isCart(k)?C.cart:C.osso,roughness:isCart(k)?0.42:0.68,metalness:0,vertexColors:!!o.geometry.attributes.color});
      o.userData.idm=new THREE.ShaderMaterial({uniforms:{clipY:CLIPU,cl:{value:0},id:{value:isCart(k)?240:241},sd:{value:0}},vertexShader:idVS,fragmentShader:idFS,side:THREE.DoubleSide})});
    boneMs=[];bones.traverse(o=>{if(o.isMesh)boneMs.push(o)});scene.add(bones);if(rig&&rig.sex===sx)attachBones(bones);applyXr()}
  /* ---- joints of the skeleton (0.68, stage 1 of the animations; tools/corpo3d/rig.py → 3d/rig-N.json): one group per
     joint at its centre of rotation, nested like the body (pelvis → spine → head; shoulder girdle → arm → hand → fingers;
     hip → knee → ankle → foot → toes); each bone piece ("o_<joint>", "c_<joint>") hangs from the joint that moves it.
     pose({joint:{movement:degrees}}) takes anatomical angles (0 = anatomical position) and turns each joint by
     (angle − the angle the A-pose already has), kept inside the joint's range; order: rotation about the bone, then
     the side-to-side movement, then flexion. "coluna" / "lombar" / "toracica" / "cervical" spread a movement over the
     levels in proportion to each level's range. Couplings: scapulohumeral rhythm, patella, knee screw-home. */
  let rig=null,rigRoot=null;
  function buildRig(R){const J=R.articulacoes,G={},C0={};rigRoot=new THREE.Group();rigRoot.name="rig";
    const mk=id=>{if(G[id])return G[id];const j=J[id];const g=new THREE.Group();g.name="j_"+id;C0[id]=new THREE.Vector3().fromArray(j.centro);
      const par=j.pai&&J[j.pai]?mk(j.pai):rigRoot;g.position.copy(C0[id]);if(j.pai&&J[j.pai])g.position.sub(C0[j.pai]);par.add(g);G[id]=g;return g};
    Object.keys(J).forEach(mk);rigRoot.updateMatrixWorld(true);
    const P0={};for(const id in G)P0[id]=G[id].position.clone();
    return {J,G,C0,P0,R,CP:R.acoplamentos||[],ang:{}}}
  /* bone pieces ("o_<joint>", "c_<joint>") hang from the joint that moves them, keeping their place */
  function attachBones(root){const ms=[];root.traverse(o=>{if(o.isMesh&&o.userData.k)ms.push(o)});root.updateMatrixWorld(true);rigRoot.updateMatrixWorld(true);
    for(const o of ms){const seg=o.userData.k.replace(/^[oc]_/,"");const g=rig.G[seg]||rig.G.pelve;
      const w=o.matrixWorld.clone();o.parent.remove(o);g.add(o);
      /* placed against the joint at rest (the body may be posed right now) */
      const id=Object.keys(rig.G).find(k=>rig.G[k]===g),c=rig.C0[id];o.matrix.copy(new THREE.Matrix4().makeTranslation(-c.x,-c.y,-c.z).multiply(w));o.matrix.decompose(o.position,o.quaternion,o.scale)}}
  /* 0.76 (stage 2): each body mesh becomes a SkinnedMesh on the joints, with the weights baked by build.py ("_skinidx",
     "_skinw"); the loaded geometry is shared, the skin attributes are added to it once */
  function skinBody(ms){const sk=dqSkeleton(new THREE.Skeleton(rig.R.pele.map(id=>rig.G[id])));rigRoot.updateMatrixWorld(true);
    return ms.map(o=>{const g=o.geometry,si=g.attributes._skinidx,sw=g.attributes._skinw;if(!si||!sw)return o;
      if(!g.attributes.skinIndex){const n=si.count,I=new Uint16Array(n*4),W=new Float32Array(n*4);
        for(let i=0;i<n;i++){I[i*4]=si.getX(i);I[i*4+1]=si.getY(i);I[i*4+2]=si.getZ(i);I[i*4+3]=si.getW(i);
          const a=sw.getX(i),b=sw.getY(i),c=sw.getZ(i),d=sw.getW(i),t=(a+b+c+d)||1;W[i*4]=a/t;W[i*4+1]=b/t;W[i*4+2]=c/t;W[i*4+3]=d/t}
        for(const sd of ["d","e"])shoulderSpread(g,o,I,W,sd);
        for(const sd of ["d","e"]){hingeSpread(g,o,I,W,"quadril_"+sd,["joelho_"+sd],"joelho_"+sd,"tornozelo_"+sd,0.055);hingeSpread(g,o,I,W,"ombro_"+sd,["cotovelo_"+sd,"antebraco_"+sd],"cotovelo_"+sd,"punho_"+sd,0.045)}
        twistSpread(g,o,I,W);
        g.setAttribute("skinDq",new THREE.Float32BufferAttribute(dqShare(I,W),1));
        g.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(I,4));g.setAttribute("skinWeight",new THREE.Float32BufferAttribute(W,4))}
      const s=new THREE.SkinnedMesh(g,o.material);s.name=o.name;s.userData=o.userData;s.position.copy(o.position);s.quaternion.copy(o.quaternion);s.scale.copy(o.scale);
      s.frustumCulled=false;const par=o.parent;par.add(s);par.remove(o);s.updateMatrixWorld(true);s.bind(sk,s.matrixWorld);return s})}
  /* 0.80: the forearm's turn (pronation, joint "antebraco") is spread along its length, as in a real arm (the radius
     rolls over the ulna and the skin twists little by little): the share of "cotovelo" + "antebraco" in a vertex goes from
     all-elbow at the elbow to all-forearm at the wrist (before, the side near the radius turned and the side near the ulna
     did not, which tore and thinned the forearm) */
  /* 0.80: knee and elbow — the share between the bone above (thigh / upper arm) and the one below (shin / forearm) follows
     the line of the lower bone: all "above" a few cm before the joint, all "below" a few cm after (w), smooth in between.
     The weights by distance to the bones mixed over a wide band and the shin/forearm folded and thinned when bent. */
  /* 0.83: how much of each vertex is skinned by dual quaternions: the share of the limb joints that bend or twist
     (elbow, forearm, wrist, fingers, knee, ankle, toes), doubled — so the elbow and knee bands are fully DQ and the
     shoulder/hip/trunk blends are linear */
  const DQJ=/^(cotovelo|antebraco|punho|mcf|ifp|ifd|cmc1|mcf1|if1|joelho|patela|tornozelo|subtalar|mtf|ifh|ifpp|ifdp)/;
  function dqShare(I,W){const L=rig.R.pele,isD=L.map(k=>DQJ.test(k)),n=I.length/4,out=new Float32Array(n);
    for(let i=0;i<n;i++){let d=0;for(let k=0;k<4;k++)if(isD[I[i*4+k]])d+=W[i*4+k];out[i]=Math.min(1,d*2)}return out}
  /* 0.83: the shoulder. Within SH.R of the shoulder joint the share that follows the arm depends on the direction from
     the joint (along the arm's line at rest = arm, toward the trunk = trunk, smooth between), fading into the old weights
     toward SH.R; those vertices are skinned linearly (dqShare), so the armpit stretches like a web instead of folding */
  const SH={R:0.15,R0:0.07,a0:40,a1:105};
  function shoulderSpread(g,o,I,W,sd){const L=rig.R.pele,arm=["ombro_","cotovelo_","antebraco_"].map(k=>L.indexOf(k+sd)),io=arm[0];if(io<0)return;
    o.updateWorldMatrix(true,false);const G=rig.C0["ombro_"+sd],ax=rig.C0["cotovelo_"+sd].clone().sub(G).normalize(),pa=g.attributes.position,v=new THREE.Vector3();
    const c0=Math.cos(THREE.MathUtils.degToRad(SH.a0)),c1=Math.cos(THREE.MathUtils.degToRad(SH.a1)),ie=L.indexOf("esc_"+sd);
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld).sub(G);const r=v.length();if(r>SH.R||r<1e-4||(v.x+G.x)*G.x<0)continue;
      let a=0,ja=-1;for(let k=0;k<4;k++){const b=I[i*4+k];if(arm.includes(b)){a+=W[i*4+k];if(b===io)ja=k}}
      let cone=(v.dot(ax)/r-c1)/(c0-c1);cone=Math.min(1,Math.max(0,cone));cone=cone*cone*(3-2*cone);
      let lam=(SH.R-r)/(SH.R-SH.R0);lam=Math.min(1,Math.max(0,lam));lam=lam*lam*(3-2*lam);
      const a2=a+lam*(cone-a);if(Math.abs(a2-a)<1e-3)continue;
      const fa=a>1e-6?a2/a:0,ft=(1-a)>1e-6?(1-a2)/(1-a):0;
      for(let k=0;k<4;k++){const b=I[i*4+k];W[i*4+k]*=arm.includes(b)?fa:ft}
      if(a<=1e-6){if(ja<0){let m=-1,mw=9;for(let k=0;k<4;k++)if(W[i*4+k]<mw){mw=W[i*4+k];m=k}ja=m;I[i*4+ja]=io;W[i*4+ja]=0}W[i*4+ja]+=a2}
      if((1-a)<=1e-6&&ie>=0){let m=-1,mw=9;for(let k=0;k<4;k++)if(k!==ja&&W[i*4+k]<mw){mw=W[i*4+k];m=k}if(m>=0){I[i*4+m]=ie;W[i*4+m]=1-a2}}
      let s=0;for(let k=0;k<4;k++)s+=W[i*4+k];for(let k=0;k<4;k++)W[i*4+k]/=s||1}}
  function hingeSpread(g,o,I,W,par,kids,jid,eid,w){const L=rig.R.pele,ip=L.indexOf(par),ik=kids.map(k=>L.indexOf(k)),i0=ik[0];if(ip<0||i0<0)return;
    o.updateWorldMatrix(true,false);const J=rig.C0[jid],ax=rig.C0[eid].clone().sub(J).normalize(),pa=g.attributes.position,v=new THREE.Vector3();
    for(let i=0;i<pa.count;i++){let sp=0,sk=0,jp=-1,jk=-1;for(let k=0;k<4;k++){const b=I[i*4+k];if(b===ip){sp+=W[i*4+k];jp=k}else if(ik.includes(b)){sk+=W[i*4+k];if(b===i0)jk=k}}
      const tot=sp+sk;if(tot<0.02||(sp<0.002&&sk<0.002))continue;v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);
      let t=(v.sub(J).dot(ax)+w)/(2*w);t=Math.min(1,Math.max(0,t));t=t*t*(3-2*t);
      /* the kids keep their own split (elbow/forearm), scaled to the new total */
      const nk=tot*t,np=tot-nk,f=sk>1e-6?nk/sk:0;
      for(let k=0;k<4;k++){const b=I[i*4+k];if(ik.includes(b))W[i*4+k]*=f}
      if(sk<1e-6&&nk>0){if(jk<0){let m=-1,mw=9;for(let k=0;k<4;k++)if(k!==jp&&W[i*4+k]<mw){mw=W[i*4+k];m=k}jk=m;I[i*4+jk]=i0}W[i*4+jk]=nk}
      if(jp<0&&np>0){let m=-1,mw=9;for(let k=0;k<4;k++)if(k!==jk&&!ik.includes(I[i*4+k])&&W[i*4+k]<mw){mw=W[i*4+k];m=k}if(m>=0){jp=m;I[i*4+jp]=ip}}
      if(jp>=0)W[i*4+jp]=np;let s=0;for(let k=0;k<4;k++)s+=W[i*4+k];for(let k=0;k<4;k++)W[i*4+k]/=s||1}}
  function twistSpread(g,o,I,W){const L=rig.R.pele,ix=k=>L.indexOf(k),pa=g.attributes.position,v=new THREE.Vector3();o.updateWorldMatrix(true,false);
    for(const sd of ["d","e"]){const ce=ix("cotovelo_"+sd),an=ix("antebraco_"+sd);if(ce<0||an<0)continue;const E=rig.C0["cotovelo_"+sd],Wr=rig.C0["punho_"+sd],EW=Wr.clone().sub(E),l2=EW.lengthSq();
      for(let i=0;i<pa.count;i++){let sc=0,sa=0,jc=-1,ja=-1;for(let k=0;k<4;k++){const b=I[i*4+k];if(b===ce){sc+=W[i*4+k];jc=k}else if(b===an){sa+=W[i*4+k];ja=k}}
        const tot=sc+sa;if(tot<0.02)continue;v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);let t=v.sub(E).dot(EW)/l2;t=Math.min(1,Math.max(0,(t-0.08)/0.84));t=t*t*(3-2*t);
        const wa=tot*t,wc=tot-wa;
        if(jc<0){let m=-1,mw=9;for(let k=0;k<4;k++)if(k!==ja&&W[i*4+k]<mw){mw=W[i*4+k];m=k}jc=m;I[i*4+jc]=ce;W[i*4+jc]=0}
        if(ja<0){let m=-1,mw=9;for(let k=0;k<4;k++)if(k!==jc&&W[i*4+k]<mw){mw=W[i*4+k];m=k}ja=m;I[i*4+ja]=an;W[i*4+ja]=0}
        W[i*4+jc]=wc;W[i*4+ja]=wa;let s=0;for(let k=0;k<4;k++)s+=W[i*4+k];for(let k=0;k<4;k++)W[i*4+k]/=s||1}}}
  const wpos=g=>{g.updateWorldMatrix(true,false);return new THREE.Vector3().setFromMatrixPosition(g.matrixWorld)};
  const wq=g=>{g.updateWorldMatrix(true,false);return g.getWorldQuaternion(new THREE.Quaternion())};
  function setWorldQ(g,q){const pq=wq(g.parent);g.quaternion.copy(pq.invert().multiply(q));g.updateWorldMatrix(false,true)}
  /* two-bone IK (hip–knee–ankle, shoulder–elbow–wrist): law of cosines for the middle joint (bent about its own
     anatomical axis), then the shortest turn of the first joint that puts the end on the target */
  function ik2(A,B,E,T,midId,axWant){if(!A||!B||!E)return;
    const a=wpos(A),b=wpos(B),e=wpos(E),l1=a.distanceTo(b),l2=b.distanceTo(e);
    const d=Math.min(l1+l2-1e-4,Math.max(Math.abs(l1-l2)+1e-4,a.distanceTo(T)));
    const inner=()=>{const b2=wpos(B),e2=wpos(E),a2=wpos(A);return a2.sub(b2).angleTo(e2.sub(b2))};
    const want=Math.acos(Math.min(1,Math.max(-1,(l1*l1+l2*l2-d*d)/(2*l1*l2))));
    const fx=rig.J[midId].mov.find(m=>m.id==="flex"),ax=new THREE.Vector3().fromArray(fx.eixo).normalize().applyQuaternion(wq(B.parent));
    /* 0.77: the bend is found by bisection on the joint's own flexion (0 … max): the inner angle only shrinks as it flexes,
       so it never bends backwards and it is exact even when the axis is not square to the limb */
    const axL=new THREE.Vector3().fromArray(fx.eixo).normalize(),rep=fx.repouso;
    /* 0.80: the couplings of this flexion go along (knee → patella 70 %, "screw-home" twist), else the kneecap stayed behind
       when the IK bent the knee and made a beak in the squat */
    const r=THREE.MathUtils.degToRad,CPs=rig.CP.filter(c=>c.de===midId+".flex"),f=(c,x)=>c.apos!=null?Math.max(0,x-c.apos):Math.max(0,c.ate-x);
    const setF=deg=>{const q=new THREE.Quaternion(),own={};
      for(const c of CPs)for(const [tg,k] of c.para){const [tid,tmv]=tg.split("."),td=rig.J[tid]&&rig.J[tid].mov.find(m=>m.id===tmv);if(!td)continue;
        const val=Math.min(td.max,Math.max(td.min,td.repouso+k*(f(c,deg)-f(c,rep))));
        if(tid===midId)own[tmv]=val;else{rig.G[tid].quaternion.setFromAxisAngle(new THREE.Vector3().fromArray(td.eixo).normalize(),r(val-td.repouso));rig.G[tid].updateWorldMatrix(false,true)}}
      for(const [mv,val] of Object.entries(own)){const md=rig.J[midId].mov.find(m=>m.id===mv);q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().fromArray(md.eixo).normalize(),r(val-md.repouso)))}
      q.premultiply(new THREE.Quaternion().setFromAxisAngle(axL,r(deg-rep)));B.quaternion.copy(q);B.updateWorldMatrix(false,true)};
    let lo=Math.max(0,fx.min),hi=fx.max;for(let i=0;i<22;i++){const mid=(lo+hi)/2;setF(mid);if(inner()>want)lo=mid;else hi=mid}setF((lo+hi)/2);
    const e2=wpos(E),from=e2.sub(a).normalize(),to=T.clone().sub(a).normalize();
    setWorldQ(A,new THREE.Quaternion().setFromUnitVectors(from,to).multiply(wq(A)));
    /* pole: the shortest turn can twist the limb (knees crossing or bending backwards); spin it about hip/shoulder→target
       so the elbow hinge axis lies as the angles above left it; with the foot flat on the floor the knee follows the toes
       (hinge = its rest axis turned by the foot's giro), as coaches cue in the squat */
    const ax1=new THREE.Vector3().fromArray(fx.eixo).normalize().applyQuaternion(wq(B.parent)),pr=v=>v.sub(to.clone().multiplyScalar(v.dot(to)));
    const p0=pr((axWant||ax).clone()),p1=pr(ax1);
    if(p0.lengthSq()>1e-4&&p1.lengthSq()>1e-4){const ang=Math.atan2(to.dot(p1.clone().cross(p0)),p1.dot(p0));
      setWorldQ(A,new THREE.Quaternion().setFromAxisAngle(to,ang).multiply(wq(A)))}}
  const SPINE={lombar:/^L\d$/,toracica:/^T\d+$/,cervical:/^C[2-7]$/,coluna:/^([LT]\d+|C[2-7])$/};
  /* pegada_d / pegada_e (0–1): closes the fingers round a bar (1 = full grip) */
  const GRIP={mcf:70,ifp:85,ifd:50,cmc1:{abd:45,flex:10},mcf1:35,if1:40};
  function grip(P){const Q={...P};for(const sd of ["d","e"]){const k=P["pegada_"+sd];delete Q["pegada_"+sd];if(!k)continue;
      for(const f of [2,3,4,5])for(const j of ["mcf","ifp","ifd"])Q[j+f+"_"+sd]={flex:GRIP[j]*k,...(Q[j+f+"_"+sd]||{})};
      Q["cmc1_"+sd]={abd:GRIP.cmc1.abd*k,flex:GRIP.cmc1.flex*k,...(Q["cmc1_"+sd]||{})};
      for(const j of ["mcf1","if1"])Q[j+"_"+sd]={flex:GRIP[j]*k,...(Q[j+"_"+sd]||{})}}return Q}
  function rigPose(P){if(!rig)return;const A={};P=P&&grip(P);
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
    /* root (0.76): pelve:{pos:[x,y,z] metres added to its place, flex (tips forward, + ) / incl (to the left, +) / rot (turns
       left, +) in degrees} — moves and turns the whole body, e.g. lying on the bench (flex −90) */
    const G0=rig.G.pelve,pv=P&&P.pelve;G0.position.copy(rig.P0.pelve);G0.quaternion.identity();
    if(pv){if(pv.pos)G0.position.add(new THREE.Vector3().fromArray(pv.pos));
      const r=THREE.MathUtils.degToRad;G0.quaternion.setFromEuler(new THREE.Euler(r(pv.flex||0),r(pv.rot||0),-r(pv.incl||0),"YXZ"))}
    /* IK (0.76): ik:{pe_d:[x,y,z], mao_e:[x,y,z]…} — the ankle / wrist goes to that point (world metres), the knee / elbow
       bends just enough and the hip / shoulder turns toward it, keeping the bend's direction from the angles above; the
       foot stays flat on the floor (its rest orientation; {alvo:[…],giro:20} turns the toes out 20°) unless {alvo:[…],plano:false} */
    if(P&&P.ik)for(const [k,t] of Object.entries(P.ik)){const m=/^(pe|mao)_([de])$/.exec(k);if(!m||!t)continue;const sd=m[2],leg=m[1]==="pe";
      const T=new THREE.Vector3().fromArray(Array.isArray(t)?t:t.alvo);
      const flat=leg&&!(t&&t.plano===false),qf=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),THREE.MathUtils.degToRad((t&&t.giro||0)*(sd==="d"?-1:1)));
      const qk=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),THREE.MathUtils.degToRad(((t&&t.giro||0)-(t&&t.joelho||0))*(sd==="d"?-1:1)));
      const kw=flat?new THREE.Vector3().fromArray(rig.J["joelho_"+sd].mov.find(m=>m.id==="flex").eixo).normalize().applyQuaternion(qk):null;
      ik2(rig.G[(leg?"quadril_":"ombro_")+sd],rig.G[(leg?"joelho_":"cotovelo_")+sd],rig.G[(leg?"tornozelo_":"punho_")+sd],T,(leg?"joelho_":"cotovelo_")+sd,kw);
      if(flat)setWorldQ(rig.G["tornozelo_"+sd],qf)}
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
  function applyXr(){const on=XR!=="off"&&!!bones&&bonesSex===curSex;bonesVis=on;boneShow(on);
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

  /* ---- 0.77 (owner "3,4"): gym equipment (etapa 3) and the exercise movement (etapa 4).
     Equipment = real sizes: Olympic bar (2,2 m, grip 28 mm, sleeves 50 mm), 45 cm plates (2 each side), flat bench with the
     pad top at 44 cm and uprights, squat stands. Drawn in the outline pass with their own ids (251–254) so the lines of the
     body stop at the bar. The movement: two poses (start u=0, other end u=1) mixed along a timeline (hold, go, hold, come
     back: down slow ~2 s, up ~1,2 s), feet planted by IK, the bar placed from the body each frame (on the back, over the
     midfoot, over the chest) and both hands put on it by IK (palm centre ~7,5 cm past the wrist along the forearm). */
  const EQID={bar:251,plate:252,pad:253,frame:254},eqMeshes=[];let MOT=null,PLATE=null;
  const eqMat=(c,m,r)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});
  function eqMesh(geo,mat,idk,parent){const o=new THREE.Mesh(geo,mat);o.castShadow=false;
    o.userData.idm=new THREE.ShaderMaterial({uniforms:{clipY:CLIPU,cl:{value:0},id:{value:EQID[idk]},sd:{value:0}},vertexShader:idVS,fragmentShader:idFS,side:THREE.DoubleSide});
    parent.add(o);eqMeshes.push(o);return o}
  function plateGeo(){if(PLATE)return PLATE;const t=0.045,y0=-t/2,y1=t/2,rc=0.006,P=[[0.026,y0],[0.07,y0],[0.08,y0+rc],[0.198,y0+rc],[0.206,y0],[0.219,y0],[0.225,y0+0.007],[0.225,y1-0.007],[0.219,y1],[0.206,y1],[0.198,y1-rc],[0.08,y1-rc],[0.07,y1],[0.026,y1],[0.026,y0]];
    PLATE=new THREE.LatheGeometry(P.map(p=>new THREE.Vector2(p[0],p[1])),56);PLATE.rotateZ(Math.PI/2);PLATE.computeVertexNormals();return PLATE}
  function barbell(){const g=new THREE.Group(),st=eqMat(0xc9cdd3,.6,.3),dk=eqMat(0x9ea3aa,.6,.42),ru=eqMat(0x2a2d32,0,.72);
    const cyl=(r,len,x,mat,seg=24)=>{const geo=new THREE.CylinderGeometry(r,r,len,seg);geo.rotateZ(Math.PI/2);const o=eqMesh(geo,mat,"bar",g);o.position.x=x;return o};
    cyl(0.014,0.42,0,st);for(const s of [-1,1]){cyl(0.0142,0.445,s*0.4325,dk);   /* knurled grip parts a little darker */
      cyl(0.037,0.03,s*0.67,st,28);cyl(0.025,0.415,s*0.8925,st);
      for(const x of [0.7125,0.7575]){const p=eqMesh(plateGeo(),ru,"plate",g);p.position.x=s*x}
      cyl(0.033,0.022,s*0.791,dk,24)}
    return g}
  const ebox=(g,sx,sy,sz,x,y,z,mat,idk)=>{const o=eqMesh(new THREE.BoxGeometry(sx,sy,sz),mat,idk,g);o.position.set(x,y,z);return o};
  /* an upright with a flat foot and a J-hook facing +dir (z) at hookY */
  function upright(g,x,z,dir,hookY,fr,st){const H=hookY+0.16;ebox(g,0.055,H,0.055,x,H/2,z,fr,"frame");ebox(g,0.07,0.035,0.55,x,0.0175,z,fr,"frame");ebox(g,0.4,0.035,0.07,x,0.0175,z,fr,"frame");
    ebox(g,0.062,0.025,0.085,x,hookY-0.0125,z+dir*0.07,st,"frame");ebox(g,0.062,0.055,0.016,x,hookY+0.012,z+dir*0.112,st,"frame")}
  function flatBench(g,topY,z0,z1){const pad=eqMat(0x1e2125,0,.6),fr=eqMat(0x33373d,.45,.45),len=z1-z0,zc=(z0+z1)/2,w=0.13,h=0.03,r=0.018,bs=0.009;
    const sh=new THREE.Shape();sh.moveTo(-w+r,-h);sh.lineTo(w-r,-h);sh.quadraticCurveTo(w,-h,w,-h+r);sh.lineTo(w,h-r);sh.quadraticCurveTo(w,h,w-r,h);sh.lineTo(-w+r,h);sh.quadraticCurveTo(-w,h,-w,h-r);sh.lineTo(-w,-h+r);sh.quadraticCurveTo(-w,-h,-w+r,-h);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:len-2*bs,bevelEnabled:true,bevelThickness:bs,bevelSize:bs,bevelSegments:3,curveSegments:5});geo.translate(0,0,-(len-2*bs)/2);
    const p=eqMesh(geo,pad,"pad",g);p.position.set(0,topY-h-bs,zc);const pb=topY-2*(h+bs);
    ebox(g,0.2,0.02,len*0.86,0,pb-0.01,zc,fr,"frame");
    for(const zz of [z0+0.16,z1-0.16]){ebox(g,0.06,pb-0.02,0.06,0,(pb-0.02)/2,zz,fr,"frame");ebox(g,0.46,0.04,0.06,0,0.02,zz,fr,"frame")}
    ebox(g,0.05,0.05,z1-z0-0.32,0,0.09,zc,fr,"frame")}
  function clearEq(){if(!MOT||!MOT.g)return;scene.remove(MOT.g);MOT.g.traverse(o=>{if(o.isMesh){o.geometry!==PLATE&&o.geometry.dispose();o.material.dispose();o.userData.idm&&o.userData.idm.dispose()}});eqMeshes.length=0;MOT.g=null;need=true}

  const lerpP=(a,b,u)=>{if(typeof a==="number")return a+((b==null?a:b)-a)*u;if(Array.isArray(a))return a.map((x,i)=>x+(b[i]-x)*u);const o={};for(const k in a)o[k]=lerpP(a[k],b?b[k]:a[k],u);return o};
  const sm=x=>x*x*(3-2*x);
  const V=a=>new THREE.Vector3().fromArray(a);
  const jp=id=>{const v=new THREE.Vector3();rig.G[id].getWorldPosition(v);return v};
  /* ---- 0.83 engine (owner: "comece a fazer … faça minuciosamente"): each movement says how the body is placed
     (setup: "pe" standing, "deitado" on a flat bench, "inclinado" reclined on an adjustable bench at `inc`°, "sentado"
     upright on it, "barra_fixa" hanging), where the feet go, what the hands hold (bar: a barbell — hands on it by the
     finger hook; db: two dumbbells; fk: the hands follow the angles and the equipment follows the hands) and where it
     travels (place(m,u) after a first pass with the angles). a/b = the angles at u=0 / u=1 (same keys); t = timeline
     [seconds, u to reach]; cam = [degrees around, target height, distance × framing, target z]. */
  const ARMS_SQ={ombro_d:{abd:72,flex:8,rot:-50},ombro_e:{abd:72,flex:8,rot:-50},cotovelo_d:{flex:110},cotovelo_e:{flex:110},antebraco_d:{pron:-40},antebraco_e:{pron:-40}};
  const both=(j,v)=>({[j+"_d"]:v,[j+"_e"]:v});
  const SUP_LEGS={...both("quadril",{flex:20,abd:20}),...both("joelho",{flex:80})};
  const STAND=(o={})=>({pelve:{pos:[0,-0.012,0],flex:0},coluna:{flex:0},cervical:{flex:0},...both("quadril",{abd:6,rot:-6}),...o});
  const MOV={
    agach:{setup:"pe",feet:{wide:0.07,giro:20},hands:"bar",bar:"costas",gx:[0.34,0.31],eq:["stands"],
      a:{pelve:{pos:[0,-0.035,-0.01],flex:4},coluna:{flex:-3},cervical:{flex:0},quadril_d:{abd:12,rot:-12},quadril_e:{abd:12,rot:-12},...ARMS_SQ},
      b:{pelve:{pos:[0,-0.40,-0.13],flex:38},coluna:{flex:-4},cervical:{flex:-10},quadril_d:{abd:18,rot:-15},quadril_e:{abd:18,rot:-15},...ARMS_SQ},
      deep:{pelve:{pos:[0,-0.50,-0.10],flex:40},coluna:{flex:-2},cervical:{flex:-10},quadril_d:{abd:22,rot:-18},quadril_e:{abd:22,rot:-18},...ARMS_SQ},
      t:[[0.7,0],[2.0,1],[0.35,1],[1.25,0]],cam:[60,0.86,1.22,0],con:0,err:{joelho:26}},
    terra:{setup:"pe",feet:{giro:8},hands:"bar",bar:"pend",floor:true,legs:true,gx:[0.24,0.22],
      a:{pelve:{pos:[0,-0.232,-0.22],flex:70},coluna:{flex:0},cervical:{flex:-22},...both("quadril",{abd:8,rot:-8}),...both("ombro",{flex:64,abd:4}),...both("cotovelo",{flex:0}),...both("antebraco",{pron:70})},
      b:{pelve:{pos:[0,-0.012,0],flex:-2},coluna:{flex:-2},cervical:{flex:0},...both("quadril",{abd:8,rot:-8}),...both("ombro",{flex:4,abd:4}),...both("cotovelo",{flex:0}),...both("antebraco",{pron:70})},
      ease:{"pelve.pos":u=>[u,Math.pow(u,0.75),Math.pow(u,2.4)],"pelve.flex":u=>Math.pow(u,1.8),"coluna.flex":u=>Math.pow(u,1.8),"ombro_d.flex":u=>Math.pow(u,1.6),"ombro_e.flex":u=>Math.pow(u,1.6)},
      t:[[0.8,0],[1.4,1],[0.6,1],[1.8,0]],cam:[60,0.62,1.15,0],con:1,err:{a:{coluna:{flex:36},cervical:{flex:-4}}}},
    supino:{setup:"deitado",hands:"bar",bar:"peito",gx:[0.37,0.33],eq:["banco","suportes"],
      a:{pelve:{pos:[0,-0.42,-0.05],flex:-90},coluna:{flex:-6},cervical:{flex:4},...SUP_LEGS,...both("ombro",{flex:86,abd:14,rot:0}),...both("cotovelo",{flex:8}),...both("antebraco",{pron:60})},
      b:{pelve:{pos:[0,-0.42,-0.05],flex:-90},coluna:{flex:-6},cervical:{flex:4},...SUP_LEGS,...both("ombro",{flex:10,abd:65,rot:20}),...both("cotovelo",{flex:95}),...both("antebraco",{pron:60})},
      t:[[0.7,0],[2.0,1],[0.3,1],[1.15,0]],cam:[42,0.68,1.38,-0.3],con:0,err:{b:{...both("ombro",{flex:0,abd:88,rot:20})},low:-0.12}},
    /* 0.83: bent-over row with the bar — trunk ~45°, knees soft, bar from straight arms to the belly */
    remcurv:{setup:"pe",feet:{giro:8},hands:"bar",bar:"remo",legs:true,gx:[0.27,0.24],
      a:{pelve:{pos:[0,-0.09,-0.17],flex:64},coluna:{flex:4},cervical:{flex:-24},...both("quadril",{abd:6,rot:-6}),...both("ombro",{flex:66,abd:8}),...both("cotovelo",{flex:5}),...both("antebraco",{pron:70})},
      b:{pelve:{pos:[0,-0.09,-0.17],flex:64},coluna:{flex:2},cervical:{flex:-24},...both("quadril",{abd:6,rot:-6}),...both("ombro",{flex:-25,abd:28,rot:10}),...both("cotovelo",{flex:100}),...both("antebraco",{pron:70})},
      t:[[0.6,0],[1.0,1],[0.35,1],[1.7,0]],cam:[65,0.75,1.12,0],con:1,err:{b:{pelve:{pos:[0,-0.06,-0.12],flex:34},coluna:{flex:-4}}}},
    /* Romanian deadlift: from standing, hips go back with soft knees, the bar slides down the thighs to below the knees */
    stiff:{setup:"pe",feet:{giro:6},hands:"bar",bar:"pend",legs:true,gx:[0.24,0.22],
      a:{...STAND(),...both("ombro",{flex:4,abd:4}),...both("cotovelo",{flex:0}),...both("antebraco",{pron:70})},
      b:{pelve:{pos:[0,-0.06,-0.17],flex:78},coluna:{flex:2},cervical:{flex:-20},...both("quadril",{abd:6,rot:-6}),...both("ombro",{flex:72,abd:4}),...both("cotovelo",{flex:0}),...both("antebraco",{pron:70})},
      ease:{"pelve.pos":u=>[u,Math.pow(u,0.8),Math.pow(u,0.85)]},
      t:[[0.7,0],[2.2,1],[0.3,1],[1.3,0]],cam:[62,0.7,1.15,0],con:0,err:{b:{coluna:{flex:34},cervical:{flex:-30}}}},
    /* standing barbell press: from the front of the shoulders to straight arms overhead; the bar goes up in front of the face */
    desenv_ba:{setup:"pe",feet:{giro:6},hands:"bar",bar:"press",gx:[0.27,0.245],
      a:{...STAND(),cervical:{flex:-6},...both("ombro",{flex:55,abd:55,rot:-40}),...both("cotovelo",{flex:125}),...both("antebraco",{pron:40})},
      b:{...STAND(),cervical:{flex:4},...both("ombro",{flex:165,abd:18,rot:0}),...both("cotovelo",{flex:10}),...both("antebraco",{pron:40})},
      t:[[0.6,0],[1.1,1],[0.35,1],[1.8,0]],cam:[40,1.05,1.12,0],con:1,err:{b:{pelve:{pos:[0,-0.012,0.02],flex:-6},coluna:{flex:-16}}}},
    /* standing barbell curl: upper arms still at the sides, the bar follows the hands */
    rosca:{setup:"pe",feet:{giro:6},hands:"fk",holds:"bar",
      a:{...STAND(),...both("ombro",{flex:4,abd:8}),...both("cotovelo",{flex:12}),...both("antebraco",{pron:-72})},
      b:{...STAND(),...both("ombro",{flex:16,abd:8}),...both("cotovelo",{flex:138}),...both("antebraco",{pron:-72})},
      t:[[0.5,0],[1.0,1],[0.3,1],[2.0,0]],cam:[40,0.95,1.05,0],con:1,err:{b:{pelve:{pos:[0,-0.012,0],flex:-8},coluna:{flex:-14},...both("ombro",{flex:42,abd:8})}}},
    rosca_h:{setup:"pe",feet:{giro:6},hands:"fk",holds:"db",
      a:{...STAND(),...both("ombro",{flex:0,abd:20,rot:-8}),...both("cotovelo",{flex:12}),...both("antebraco",{pron:-75})},
      b:{...STAND(),...both("ombro",{flex:12,abd:16,rot:-8}),...both("cotovelo",{flex:138}),...both("antebraco",{pron:-75})},
      t:[[0.5,0],[1.0,1],[0.3,1],[2.0,0]],cam:[40,0.95,1.05,0],con:1,err:{b:{pelve:{pos:[0,-0.012,0],flex:-8},coluna:{flex:-14},...both("ombro",{flex:40,abd:16,rot:-8})}}},
    martelo:{setup:"pe",feet:{giro:6},hands:"fk",holds:"db",
      a:{...STAND(),...both("ombro",{flex:0,abd:16}),...both("cotovelo",{flex:12}),...both("antebraco",{pron:0})},
      b:{...STAND(),...both("ombro",{flex:12,abd:13}),...both("cotovelo",{flex:135}),...both("antebraco",{pron:0})},
      t:[[0.5,0],[1.0,1],[0.3,1],[2.0,0]],cam:[45,0.95,1.05,0],con:1,err:{b:{pelve:{pos:[0,-0.012,0],flex:-8},coluna:{flex:-14},...both("ombro",{flex:40,abd:13})}}},
    /* lateral raise: the arms go out to shoulder height, elbows a little bent */
    elevlat:{setup:"pe",feet:{giro:6},hands:"fk",holds:"db",
      a:{...STAND(),...both("ombro",{flex:8,abd:17,rot:10}),...both("cotovelo",{flex:16}),...both("antebraco",{pron:20})},
      b:{...STAND(),...both("ombro",{flex:14,abd:88,rot:10}),...both("cotovelo",{flex:20}),...both("antebraco",{pron:20})},
      t:[[0.5,0],[1.0,1],[0.25,1],[1.8,0]],cam:[20,1.0,1.05,0],con:1,err:{b:{...both("ombro",{flex:14,abd:118,rot:10}),...both("cotovelo",{flex:6})}}},
    /* incline dumbbell press, bench at 35° */
    supino_inc_h:{setup:"inclinado",inc:35,hands:"db",db:"press",gx:[0.07,0.065],eq:["banco_inc"],
      a:{pelve:{pos:[0,0,0],flex:-55},coluna:{flex:-4},cervical:{flex:8},...both("quadril",{flex:40,abd:16}),...both("joelho",{flex:85}),...both("ombro",{flex:88,abd:10}),...both("cotovelo",{flex:12}),...both("antebraco",{pron:60})},
      b:{pelve:{pos:[0,0,0],flex:-55},coluna:{flex:-4},cervical:{flex:8},...both("quadril",{flex:40,abd:16}),...both("joelho",{flex:85}),...both("ombro",{flex:15,abd:70,rot:15}),...both("cotovelo",{flex:100}),...both("antebraco",{pron:60})},
      t:[[0.6,0],[2.0,1],[0.3,1],[1.2,0]],cam:[55,0.85,1.3,-0.15],con:0,err:{b:{...both("ombro",{flex:0,abd:92,rot:15})},dbLat:0.1}},
    /* 0.84: pull-up — hanging from a bar, pronated, hands a little wider than the shoulders; the body is lifted until the
       chin passes the bar (solve() moves the whole body so the shoulders follow the path; the hands stay on the bar) */
    barrafixa:{setup:"pendurado",hands:"bar",bar:"fixa",gx:[0.31,0.28],eq:["barra_fixa"],
      a:{pelve:{pos:[0,0,0],flex:-4},coluna:{flex:0},cervical:{flex:0},...both("quadril",{flex:18,abd:4}),...both("joelho",{flex:55}),...both("tornozelo",{flex:-25}),...both("ombro",{flex:12,abd:162,rot:0}),...both("cotovelo",{flex:8}),...both("antebraco",{pron:60})},
      b:{pelve:{pos:[0,0,0],flex:-12},coluna:{flex:-10},cervical:{flex:-20},...both("quadril",{flex:24,abd:4}),...both("joelho",{flex:62}),...both("tornozelo",{flex:-25}),...both("ombro",{flex:24,abd:62,rot:-15}),...both("cotovelo",{flex:125}),...both("antebraco",{pron:60})},
      t:[[0.6,0],[1.1,1],[0.4,1],[1.8,0]],cam:[28,1.55,1.3,0],con:1,err:{half:0.5}},
    /* push-up — straight body from the toes, hands flat under the shoulders, chest close to the floor */
    flexao:{setup:"flexao",hands:"chao",gx:[0,0],
      a:{pelve:{pos:[0,0,0],flex:80},coluna:{flex:0},cervical:{flex:-6},...both("quadril",{flex:0,abd:4}),...both("joelho",{flex:0}),...both("tornozelo",{flex:-25}),...both("ombro",{flex:84,abd:24,rot:0}),...both("cotovelo",{flex:8}),...both("antebraco",{pron:30})},
      b:{pelve:{pos:[0,0,0],flex:80},coluna:{flex:0},cervical:{flex:-8},...both("quadril",{flex:0,abd:4}),...both("joelho",{flex:0}),...both("tornozelo",{flex:-25}),...both("ombro",{flex:40,abd:40,rot:20}),...both("cotovelo",{flex:95}),...both("antebraco",{pron:30})},
      t:[[0.5,0],[1.6,1],[0.25,1],[1.0,0]],cam:[62,0.36,1.2,0.22],con:0,err:{b:{lombar:{flex:-16},cervical:{flex:-20},...both("quadril",{flex:-7,abd:4})},a:{lombar:{flex:-15},...both("quadril",{flex:-7,abd:4})}}},
    /* crunch on the floor — knees bent, hands by the head; the upper back curls up, the lower back stays down */
    crunch:{setup:"chao",hands:"fk",pegada:0.2,
      a:{pelve:{pos:[0,0,0],flex:-90},lombar:{flex:0},toracica:{flex:0},cervical:{flex:6},...both("quadril",{flex:55,abd:10}),...both("joelho",{flex:95}),...both("ombro",{flex:60,abd:92,rot:40}),...both("cotovelo",{flex:148}),...both("antebraco",{pron:-20})},
      b:{pelve:{pos:[0,0,0],flex:-90},lombar:{flex:8},toracica:{flex:28},cervical:{flex:14},...both("quadril",{flex:55,abd:10}),...both("joelho",{flex:95}),...both("ombro",{flex:60,abd:92,rot:40}),...both("cotovelo",{flex:148}),...both("antebraco",{pron:-20})},
      t:[[0.5,0],[0.9,1],[0.5,1],[1.3,0]],cam:[70,0.3,1.0,0.0],con:1,err:{b:{cervical:{flex:42},lombar:{flex:4},toracica:{flex:14}}}},
    /* 0.84: hip thrust — the upper back on the edge of a bench (sideways), feet flat, a padded bar on the hips; the hips go
       from low to the top where trunk and thighs make a line (solve() keeps the back on the edge, the feet stay put) */
    hipthrust:{setup:"ponte",hands:"bar",bar:"quadril",gx:[0.3,0.27],eq:["banco_x"],
      a:{pelve:{pos:[0,0,0],flex:-56},coluna:{flex:6},cervical:{flex:18},...both("quadril",{flex:64,abd:10}),...both("joelho",{flex:80}),...both("ombro",{flex:30,abd:22}),...both("cotovelo",{flex:20}),...both("antebraco",{pron:60})},
      b:{pelve:{pos:[0,0,0],flex:-92},coluna:{flex:4},cervical:{flex:30},...both("quadril",{flex:2,abd:8}),...both("joelho",{flex:90}),...both("ombro",{flex:30,abd:22}),...both("cotovelo",{flex:20}),...both("antebraco",{pron:60})},
      t:[[0.5,0],[0.9,1],[0.7,1],[1.3,0]],cam:[32,0.42,1.3,0.2],con:1,err:{b:{lombar:{flex:-20},...both("quadril",{flex:16,abd:8})}}},
    /* Bulgarian split squat with dumbbells — the back foot on a bench behind, the front foot well ahead; straight down and up */
    bulgaro:{setup:"bulgaro",hands:"db",db:"hang",eq:["banco_tras"],
      a:{pelve:{pos:[0,-0.12,-0.06],flex:6},coluna:{flex:2},cervical:{flex:-4},...both("ombro",{flex:0,abd:8}),...both("cotovelo",{flex:6}),...both("antebraco",{pron:0}),tornozelo_e:{flex:-45}},
      b:{pelve:{pos:[0,-0.36,-0.08],flex:16},coluna:{flex:4},cervical:{flex:-8},...both("ombro",{flex:0,abd:8}),...both("cotovelo",{flex:6}),...both("antebraco",{pron:0}),tornozelo_e:{flex:-35}},
      t:[[0.5,0],[1.3,1],[0.25,1],[1.0,0]],cam:[70,0.62,1.15,0],con:0,err:{b:{pelve:{pos:[0,-0.36,-0.04],flex:40},coluna:{flex:12}}}},
    /* standing calf raise with dumbbells — straight legs, the heels go up and the body rises on the balls of the feet */
    pant:{setup:"ponta",hands:"db",db:"hang",
      a:{...STAND(),...both("ombro",{flex:0,abd:8}),...both("cotovelo",{flex:6}),...both("antebraco",{pron:0}),...both("tornozelo",{flex:-9})},
      b:{...STAND(),...both("ombro",{flex:0,abd:8}),...both("cotovelo",{flex:6}),...both("antebraco",{pron:0}),...both("tornozelo",{flex:-42})},
      t:[[0.5,0],[0.8,1],[0.7,1],[1.4,0]],cam:[60,0.45,1.1,0],con:1,err:{b:{...both("tornozelo",{flex:-20}),...both("joelho",{flex:16})},a:{...both("joelho",{flex:12})}}},
    /* 0.85: cable station — triceps pushdown with the rope: elbows stay at the sides, only the forearms move */
    pushdown:{setup:"pe",feet:{giro:6},hands:"fk",holds:"corda",eq:["polia_alta"],pegada:1,
      a:{...STAND({pelve:{pos:[0,-0.02,-0.02],flex:10}}),coluna:{flex:2},cervical:{flex:-6},...both("ombro",{flex:-4,abd:10,rot:8}),...both("cotovelo",{flex:108}),...both("antebraco",{pron:-5})},
      b:{...STAND({pelve:{pos:[0,-0.02,-0.02],flex:10}}),coluna:{flex:2},cervical:{flex:-6},...both("ombro",{flex:-8,abd:14,rot:8}),...both("cotovelo",{flex:6}),...both("antebraco",{pron:-5})},
      t:[[0.5,0],[0.8,1],[0.5,1],[1.4,0]],cam:[58,1.05,1.05,0.1],con:1,err:{a:{...both("ombro",{flex:42,abd:12,rot:8})},b:{...both("ombro",{flex:-2,abd:14,rot:8})}}},
    /* lat pulldown, pronated, a little wider than the shoulders: seated with the thighs under the pads, the bar comes from
       straight arms overhead to the top of the chest, the trunk leans back a little */
    puxada:{setup:"inclinado",seat:0.47,hands:"bar",bar:"puxada",gx:[0.34,0.31],eq:["polia_puxada"],
      a:{pelve:{pos:[0,0,0],flex:-2},coluna:{flex:0},cervical:{flex:-4},...both("quadril",{flex:86,abd:10}),...both("joelho",{flex:95}),...both("ombro",{flex:12,abd:160,rot:0}),...both("cotovelo",{flex:8}),...both("antebraco",{pron:60})},
      b:{pelve:{pos:[0,0,0],flex:-14},coluna:{flex:-6},cervical:{flex:-10},...both("quadril",{flex:100,abd:10}),...both("joelho",{flex:95}),...both("ombro",{flex:20,abd:60,rot:-10}),...both("cotovelo",{flex:120}),...both("antebraco",{pron:60})},
      t:[[0.6,0],[1.0,1],[0.4,1],[1.7,0]],cam:[40,1.15,1.3,0],con:1,err:{b:{pelve:{pos:[0,0,0],flex:-32},coluna:{flex:-10},...both("quadril",{flex:118,abd:10})}}},
    /* seated cable row with the V handle (neutral grip): feet on the plate, trunk upright, the handle comes to the belly */
    rembaixa:{setup:"remo",hands:"bar",bar:"vpega",gx:[0.045,0.042],eq:["polia_baixa"],
      a:{pelve:{pos:[0,0,0],flex:4},coluna:{flex:4},cervical:{flex:-4},...both("quadril",{flex:84,abd:5}),...both("joelho",{flex:32}),...both("tornozelo",{flex:18}),...both("ombro",{flex:70,abd:6}),...both("cotovelo",{flex:6}),...both("antebraco",{pron:0})},
      b:{pelve:{pos:[0,0,0],flex:-4},coluna:{flex:-4},cervical:{flex:-4},...both("quadril",{flex:76,abd:5}),...both("joelho",{flex:32}),...both("tornozelo",{flex:18}),...both("ombro",{flex:-30,abd:14}),...both("cotovelo",{flex:105}),...both("antebraco",{pron:0})},
      t:[[0.6,0],[1.0,1],[0.4,1],[1.7,0]],cam:[68,0.7,1.2,0.25],con:1,err:{a:{coluna:{flex:30},cervical:{flex:8}},b:{pelve:{pos:[0,0,0],flex:-20},coluna:{flex:-10},...both("quadril",{flex:60,abd:5})}}},
    /* seated dumbbell shoulder press, bench upright (~80°) */
    desenv_h:{setup:"inclinado",inc:80,hands:"db",db:"ohp",gx:[0.06,0.055],eq:["banco_inc"],
      a:{pelve:{pos:[0,0,0],flex:-10},coluna:{flex:-2},cervical:{flex:0},...both("quadril",{flex:82,abd:16}),...both("joelho",{flex:85}),...both("ombro",{flex:20,abd:80,rot:-60}),...both("cotovelo",{flex:100}),...both("antebraco",{pron:50})},
      b:{pelve:{pos:[0,0,0],flex:-10},coluna:{flex:-2},cervical:{flex:0},...both("quadril",{flex:82,abd:16}),...both("joelho",{flex:85}),...both("ombro",{flex:20,abd:165,rot:-10}),...both("cotovelo",{flex:12}),...both("antebraco",{pron:50})},
      t:[[0.6,0],[1.1,1],[0.3,1],[1.8,0]],cam:[35,1.0,1.2,-0.1],con:1,err:{b:{coluna:{flex:-16},cervical:{flex:-10}}}}};
  /* the dumbbell (≈ 20 kg, rubber hexagon heads) — the handle along x */
  function dumbbell(){const g=new THREE.Group(),st=eqMat(0xc9cdd3,.6,.3),dk=eqMat(0x9ea3aa,.6,.42),ru=eqMat(0x2a2d32,0,.72);
    const cyl=(r,len,x,mat,seg=20,idk="bar")=>{const geo=new THREE.CylinderGeometry(r,r,len,seg);geo.rotateZ(Math.PI/2);const o=eqMesh(geo,mat,idk,g);o.position.x=x;return o};
    cyl(0.016,0.13,0,dk);for(const s of [-1,1]){cyl(0.024,0.012,s*0.071,st);const h=cyl(0.075,0.09,s*0.122,ru,6,"plate");h.rotation.x=Math.PI/6;cyl(0.03,0.006,s*0.17,st,20)}
    return g}
  /* adjustable bench: seat (flat) + back pad at `ang`° from horizontal, built to touch the body (seat under the glutes,
     back pad along the back) */
  function adjBench(g,seatTop,seatZ0,seatZ1,pivot,ang,backLen){const pad=eqMat(0x1e2125,0,.6),fr=eqMat(0x33373d,.45,.45),w=0.13,h=0.03,r=0.018,bs=0.009;
    const padGeo=len=>{const sh=new THREE.Shape();sh.moveTo(-w+r,-h);sh.lineTo(w-r,-h);sh.quadraticCurveTo(w,-h,w,-h+r);sh.lineTo(w,h-r);sh.quadraticCurveTo(w,h,w-r,h);sh.lineTo(-w+r,h);sh.quadraticCurveTo(-w,h,-w,h-r);sh.lineTo(-w,-h+r);sh.quadraticCurveTo(-w,-h,-w+r,-h);
      const geo=new THREE.ExtrudeGeometry(sh,{depth:len-2*bs,bevelEnabled:true,bevelThickness:bs,bevelSize:bs,bevelSegments:3,curveSegments:5});geo.translate(0,0,-(len-2*bs)/2);return geo};
    const sl=seatZ1-seatZ0,seat=eqMesh(padGeo(sl),pad,"pad",g);seat.position.set(0,seatTop-h-bs,(seatZ0+seatZ1)/2);
    /* back pad: its top face passes through pivot (y,z) and goes back/up at ang */
    const a=THREE.MathUtils.degToRad(ang),dir=new THREE.Vector3(0,Math.sin(a),-Math.cos(a)),nrm=new THREE.Vector3(0,Math.cos(a),Math.sin(a));
    const back=eqMesh(padGeo(backLen),pad,"pad",g);back.rotation.x=a;back.position.set(0,pivot.y,pivot.z).addScaledVector(dir,backLen/2+0.02).addScaledVector(nrm,-(h+bs));
    /* frame: seat post, a rail on the floor, a strut under the back pad */
    const sb=seatTop-2*(h+bs),zc=(seatZ0+seatZ1)/2;ebox(g,0.06,sb-0.03,0.06,0,(sb-0.03)/2,zc,fr,"frame");
    const zb=pivot.z-Math.cos(a)*backLen*0.55,yb=pivot.y+Math.sin(a)*backLen*0.55-(h+bs)*2;
    ebox(g,0.06,0.04,Math.abs(zb-zc)+0.5,0,0.02,(zb+zc)/2,fr,"frame");ebox(g,0.46,0.04,0.06,0,0.02,zc+0.2,fr,"frame");ebox(g,0.46,0.04,0.06,0,0.02,zb-0.15,fr,"frame");
    const sh2=new THREE.Vector3(0,Math.max(0.1,yb),zb),bot=new THREE.Vector3(0,0.04,zb-0.05),mid=sh2.clone().add(bot).multiplyScalar(0.5),L=sh2.distanceTo(bot);
    const st=ebox(g,0.05,L,0.05,0,mid.y,mid.z,fr,"frame");st.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),sh2.clone().sub(bot).normalize())}
  /* 0.84: a pull-up bar (32 mm) between two posts, at height H, x ±0.62 */
  function pullBar(g,H){const fr=eqMat(0x33373d,.45,.45),st=eqMat(0xc9cdd3,.6,.3),geo=new THREE.CylinderGeometry(0.016,0.016,1.36,24);geo.rotateZ(Math.PI/2);const b=eqMesh(geo,st,"bar",g);b.position.set(0,H,0);
    for(const s of [-1,1]){ebox(g,0.06,H+0.1,0.06,s*0.68,(H+0.1)/2,0,fr,"frame");ebox(g,0.07,0.035,0.7,s*0.68,0.0175,0,fr,"frame")}ebox(g,1.42,0.06,0.06,0,H+0.12,0,fr,"frame")}
  /* 0.85: cable station pieces. setCyl puts a unit cylinder (along y) between two points */
  function setCyl(o,a,b){const v=b.clone().sub(a),L=v.length()||1e-4;o.position.copy(a).addScaledVector(v,0.5);o.quaternion.setFromUnitVectors(Y,v.multiplyScalar(1/L));o.scale.set(1,L,1)}
  function cableMesh(g){return eqMesh(new THREE.CylinderGeometry(0.0028,0.0028,1,8),eqMat(0x1b1d20,0.2,0.5),"bar",g)}
  /* a straight lat bar (1,2 m) with rubber grips, its ends bent a little down */
  function latBar(){const g=new THREE.Group(),st=eqMat(0xc9cdd3,.6,.3),ru=eqMat(0x2a2d32,0,.8);
    const c=(r,len,x,mat)=>{const geo=new THREE.CylinderGeometry(r,r,len,20);geo.rotateZ(Math.PI/2);const o=eqMesh(geo,mat,"bar",g);o.position.x=x;return o};
    c(0.0135,0.62,0,st);for(const s of [-1,1]){c(0.0165,0.24,s*0.43,ru);const e=c(0.0135,0.12,s*0.6,st);e.rotation.z=s*0.35;e.position.y=-0.02}
    const ring=eqMesh(new THREE.TorusGeometry(0.018,0.004,8,16),st,"bar",g);ring.position.y=0.02;return g}
  /* the V handle for rows: two short vertical grips at ±4,5 cm joined in front, where the cable hooks */
  function vHandle(){const g=new THREE.Group(),st=eqMat(0xc9cdd3,.6,.3),ru=eqMat(0x2a2d32,0,.8);
    for(const s of [-1,1]){const gr=eqMesh(new THREE.CylinderGeometry(0.016,0.016,0.12,18),ru,"bar",g);gr.position.x=s*0.045;
      const arm=eqMesh(new THREE.BoxGeometry(0.012,0.012,0.12),st,"bar",g);arm.position.set(s*0.024,0,0.05);arm.rotation.y=-s*0.37}
    const ring=eqMesh(new THREE.TorusGeometry(0.016,0.004,8,16),st,"bar",g);ring.position.set(0,0,0.11);ring.rotation.y=Math.PI/2;return g}
  /* the triceps rope: a knot (metal end) and two short ropes to the hands, with rubber ends */
  function rope(){const g=new THREE.Group(),rm=eqMat(0x2b2f36,0,.9),st=eqMat(0xc9cdd3,.6,.3),ru=eqMat(0x1e2023,0,.8);
    const k=eqMesh(new THREE.SphereGeometry(0.02,14,10),st,"bar",g),r1=eqMesh(new THREE.CylinderGeometry(0.012,0.012,1,12),rm,"bar",g),r2=eqMesh(new THREE.CylinderGeometry(0.012,0.012,1,12),rm,"bar",g);
    const e1=eqMesh(new THREE.SphereGeometry(0.022,12,10),ru,"bar",g),e2=eqMesh(new THREE.SphereGeometry(0.022,12,10),ru,"bar",g);
    g.userData.set=(kp,a,b)=>{k.position.copy(kp);const lo=v=>v.clone().add(new THREE.Vector3(0,-0.06,0));setCyl(r1,kp,lo(a));setCyl(r2,kp,lo(b));e1.position.copy(lo(a));e2.position.copy(lo(b))};return g}
  /* a cable tower: a column with the weight stack, the pulley at (x, y, z) facing -z or +z (dir), optional top arm reaching back */
  function cableTower(g,pul,colZ,armBack){const fr=eqMat(0x33373d,.45,.45),st=eqMat(0xc9cdd3,.6,.3),wt=eqMat(0x24272b,.3,.55),H=Math.max(2.15,pul.y+0.12);
    for(const s of [-1,1])ebox(g,0.06,H,0.06,s*0.22,H/2,colZ,fr,"frame");ebox(g,0.5,0.06,0.06,0,H,colZ,fr,"frame");ebox(g,0.6,0.04,0.55,0,0.02,colZ,fr,"frame");
    for(let i=0;i<12;i++)ebox(g,0.3,0.045,0.11,0,0.08+i*0.05,colZ,wt,"frame");ebox(g,0.012,0.9,0.012,0,0.5,colZ,st,"frame");
    if(armBack){const L=Math.abs(colZ-pul.z);ebox(g,0.08,0.08,L+0.06,0,pul.y+0.08,(colZ+pul.z)/2,fr,"frame")}
    else ebox(g,0.06,0.06,Math.abs(colZ-pul.z)+0.04,0,pul.y,(colZ+pul.z)/2,fr,"frame");
    const w=eqMesh(new THREE.CylinderGeometry(0.045,0.045,0.025,24),st,"bar",g);w.rotation.z=Math.PI/2;w.position.copy(pul);
    for(const s of [-1,1])ebox(g,0.006,0.1,0.1,s*0.02,pul.y,pul.z,fr,"frame")}
  /* points of the body's surface: the farthest along a direction (CPU skinning of a sample of the vertices) */
  /* 0.84: the skin point farthest along dir among the vertices within ±band of c along the axis ax (e.g. the front of the hips) */
  /* 0.85: the bones (rigRoot) hang from the scene, not from root — update both, or the skin is measured on an older pose */
  const updW=()=>{root.updateMatrixWorld(true);if(rigRoot)rigRoot.updateMatrixWorld(true)};
  function skinAt(keys,c,ax,dir,band,xw){xw=xw||0.12;let best=-9,bp=c.clone();const v=new THREE.Vector3();updW();
    for(const k of keys){const o=parts[k];if(!o)continue;const n=o.geometry.attributes.position.count;for(let i=0;i<n;i++){o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);
      const t=v.clone().sub(c);if(Math.abs(t.dot(ax))>band||Math.abs(t.x)>xw)continue;const d=t.dot(dir);if(d>best){best=d;bp=v.clone()}}}return bp}
  /* the height of the skin's lowest part: the 20th lowest vertex, so one stray vertex does not count */
  function lowY(keys){const L=[];const v=new THREE.Vector3();updW();for(const k of keys){const o=parts[k];if(!o)continue;const n=o.geometry.attributes.position.count;for(let i=0;i<n;i++){o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);if(v.y<0.15)L.push(v.y)}}L.sort((a,b)=>a-b);return L.length?L[Math.min(19,L.length-1)]:9}
  function farthest(keys,dir){let best=-9,bp=null;const v=new THREE.Vector3();updW();
    for(const k of keys){const o=parts[k];if(!o)continue;const n=o.geometry.attributes.position.count,st=Math.max(1,Math.floor(n/1500));
      for(let i=0;i<n;i+=st){o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);const d=v.dot(dir);if(d>best){best=d;bp=v.clone()}}}
    return {d:best,p:bp}}
  const BACKK=["dorsal_superior","dorsal_inferior","trapezio_medio","trapezio_inferior","eretores","infraespinhal","redondo_maior"],GLUTK=["gluteo_maximo","isquio_biceps_femoral","isquio_semi"];
  const merge=(a,b)=>{if(!b)return a;const o={...a};for(const k in b)o[k]=b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&a[k]?merge(a[k],b[k]):b[k];return o};
  const tlen=t=>t.reduce((s,x)=>s+x[0],0);
  function phaseAt(t,T){const L=tlen(T);t=((t%L)+L)%L;let u0=T[T.length-1][1];for(const [d,u] of T){if(t<d)return u0+(u-u0)*sm(t/d);t-=d;u0=u}return u0}
  /* which step of the timeline is playing (for the phase label): index into T and the fraction of it */
  function stepAt(t,T){const L=tlen(T);t=((t%L)+L)%L;for(let i=0;i<T.length;i++){if(t<T[i][0])return [i,t/T[i][0]];t-=T[i][0]}return [T.length-1,1]}
  /* 0.81 (owner: "a mão parece que está segurando o vento na frente da barra"): the grip is placed by the fingers. With the
     hand closed (pegada 1) the middle finger's knuckle, middle and end joints lie on a circle around the bar: its centre
     is where the bar must be, and the circle's axis is the bar's direction. Each pass: turn the forearm (pronation, the
     nearer of the two ways) so that axis lies along the bar/handle, then move the wrist target by what is still missing.
     0.83: any target point and handle direction per hand (barbell, dumbbells). */
  function hook(sd){const a=jp("mcf3_"+sd),b=jp("ifp3_"+sd),c=jp("ifd3_"+sd),ab=b.clone().sub(a),ac=c.clone().sub(a),n=ab.clone().cross(ac),n2=n.lengthSq();
    const ctr=a.clone().add(n.clone().cross(ab).multiplyScalar(ac.lengthSq()).add(ac.clone().cross(n).multiplyScalar(ab.lengthSq())).multiplyScalar(1/(2*n2)));
    return {c:ctr,ax:n.normalize()}}
  const X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
  function gripTo(P,T){P.ik=P.ik||{};
    for(const [sd,pt] of T){const w=jp("punho_"+sd),f=w.clone().sub(jp("cotovelo_"+sd)).normalize();P.ik["mao_"+sd]=pt.clone().sub(f.multiplyScalar(0.075)).toArray()}
    rigPose(P);
    for(let it=0;it<4;it++){
      for(const [sd,,dir] of T){const id="antebraco_"+sd,J=rig.J[id],pm=J&&J.mov.find(m=>m.id==="pron");
        if(pm){const fa=jp("punho_"+sd).sub(jp(id)).normalize(),h=hook(sd),pr=v=>v.clone().sub(fa.clone().multiplyScalar(v.dot(fa))).normalize();
          const a=pr(h.ax),b=pr(dir);let ang=Math.atan2(fa.dot(a.clone().cross(b)),a.dot(b));if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;
          const ew=new THREE.Vector3().fromArray(pm.eixo).normalize().applyQuaternion(wq(rig.G[id].parent)),sg=Math.sign(ew.dot(fa))||1;
          const cur=(P[id]&&P[id].pron!=null)?P[id].pron:pm.repouso;P[id]={...(P[id]||{}),pron:Math.min(pm.max,Math.max(pm.min,cur+sg*THREE.MathUtils.radToDeg(ang)))}}}
      rigPose(P);
      let worst=0;for(const [sd,pt] of T){const dv=pt.clone().sub(hook(sd).c);worst=Math.max(worst,dv.length());P.ik["mao_"+sd]=new THREE.Vector3().fromArray(P.ik["mao_"+sd]).add(dv).toArray()}
      rigPose(P);if(worst<0.002)break}
    MOT.grip=Math.max(...T.map(([sd,pt])=>hook(sd).c.distanceTo(pt)))}
  /* 0.81: the front of the legs, measured once on the body at rest (the most forward point of the shin and of the thigh
     at each tenth of their length), follows the pose; a hanging bar stays in front of it */
  function legFront(){const out={};const pts=[];for(const [k,o] of Object.entries(parts)){if(/^(osso|fundo|base|pele|pele_n|cabeca|mama.*|deco)$/.test(k))continue;
      const a=o.geometry.attributes.position,v=new THREE.Vector3();o.updateWorldMatrix(true,false);const st=Math.max(1,Math.floor(a.count/6000));
      for(let i=0;i<a.count;i+=st){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(v.y<1.0)pts.push(v.x,v.y,v.z)}}
    for(const sd of ["d","e"])for(const [seg,A,B] of [["coxa","quadril_"+sd,"joelho_"+sd],["perna","joelho_"+sd,"tornozelo_"+sd]]){
      const a=rig.C0[A],b=rig.C0[B],ab=b.clone().sub(a),L2=ab.lengthSq(),f=new Array(11).fill(0),p=new THREE.Vector3();
      for(let i=0;i<pts.length;i+=3){p.set(pts[i],pts[i+1],pts[i+2]);const t=p.clone().sub(a).dot(ab)/L2;if(t<0||t>1)continue;const q=a.clone().addScaledVector(ab,t),d=p.clone().sub(q);
        if(Math.abs(d.x)>0.09||d.length()>0.16)continue;const bin=Math.round(t*10);f[bin]=Math.max(f[bin],d.z)}
      out[seg+"_"+sd]={A,B,f}}
    return out}
  function barClear(m,y){let z=-9;for(const L of Object.values(m.legs)){const g=rig.G[L.A],a=jp(L.A),b=jp(L.B),fr=new THREE.Vector3(0,0,1).applyQuaternion(wq(g));let prev=null;
      for(let i=0;i<=10;i++){const p=a.clone().lerp(b,i/10).addScaledVector(fr,L.f[i]);if(prev&&(prev.y-y)*(p.y-y)<=0&&prev.y!==p.y){const k=(y-prev.y)/(p.y-prev.y);z=Math.max(z,prev.z+(p.z-prev.z)*k)}prev=p}}
    return z}
  function easeP(P,d,b,u){const E=d.ease;if(!E)return;for(const [path,f] of Object.entries(E)){const [j,mv]=path.split("."),k=f(u),A=d.a[j]&&d.a[j][mv],B=b[j]&&b[j][mv];if(A==null||B==null)continue;
      P[j][mv]=Array.isArray(A)?A.map((x,i)=>x+(B[i]-x)*k[i]):A+(B-A)*k}}
  /* a hanging bar: where the straight arms reach (shoulder → closed hand), in front of the legs (and on the floor at most) */
  function hangBar(m,zMin,floor){let by=floor?0.225:0,bz=zMin;for(let it=0;it<3;it++){let y=9;for(const [sd,x] of [["d",-m.gx],["e",m.gx]]){const sh=jp("ombro_"+sd),R=sh.distanceTo(hook(sd).c)*0.9985,dx=x-sh.x,dz=bz-sh.z;
        y=Math.min(y,sh.y-Math.sqrt(Math.max(0,R*R-dx*dx-dz*dz)))}by=floor?Math.max(0.225,y):y;bz=m.legs?Math.max(zMin,barClear(m,by)+0.016):zMin}
    return new THREE.Vector3(0,by,bz)}
  function barAt(m,u){const d=m.d;
    if(d.bar==="costas"){const t1=jp("T1"),up=t1.clone().sub(jp("T6")).normalize(),bk=new THREE.Vector3(0,up.z,-up.y);const b=t1.clone().addScaledVector(bk,m.sex==="f"?0.075:0.085).addScaledVector(up,-0.015);b.x=0;return b}
    if(d.bar==="pend")return hangBar(m,m.barZ,!!d.floor);
    if(d.bar==="fixa")return m.barPt.clone();
    if(d.bar==="puxada"||d.bar==="vpega")return m.top.clone().lerp(m.low,sm(u));
    if(d.bar==="quadril"){const g=rig.G.pelve,b=jp("pelve").add(m.hipOff.clone().applyQuaternion(wq(g)));b.x=0;return b}
    if(d.bar==="remo"){const k=sm(u);return m.hang.clone().lerp(m.belly,k)}
    if(d.bar==="press"){const y=m.low.y+(m.top.y-m.low.y)*sm(u),t=Math.min(1,Math.max(0,(u-0.45)/0.55)),z=m.low.z+(m.top.z-m.low.z)*sm(t);return new THREE.Vector3(0,y,z)}
    const k=sm(u),b=m.top.clone().lerp(m.low,k);b.z=m.top.z+(m.low.z-m.top.z)*Math.pow(u,0.7);return b}
  function dbAt(m,u){if(m.d.db==="hang"){/* hanging at the sides from the shoulders, a little out to clear the thighs */
      return ["d","e"].map((sd,i)=>{const S=jp("ombro_"+sd);return S.add(new THREE.Vector3(0,-m.reach,0)).add(new THREE.Vector3(i?0.05:-0.05,0,0.02))})}
    const k=sm(u);return [0,1].map(i=>m.dbA[i].clone().lerp(m.dbB[i],k))}
  function placeHeld(m){const d=m.d;
    if(m.db)["d","e"].forEach((sd,i)=>{const h=hook(sd);m.db[i].position.copy(h.c);m.db[i].quaternion.setFromUnitVectors(X,h.ax)});
    if(m.rope){const a=hook("d").c,b=hook("e").c,k=a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0,0.075,0.015));m.rope.userData.set(k,a,b);m.knot=k}
    if(m.cab){const e=m.knot||(m.bar&&(d.bar==="vpega"?m.bar.position.clone().add(new THREE.Vector3(0,0,0.11)):m.bar.position));if(e)setCyl(m.cab,m.pulley,e)}
    if(d.hands==="fk"&&m.bar){const a=hook("d").c,b=hook("e").c;m.bar.position.copy(a).add(b).multiplyScalar(0.5);m.bar.quaternion.setFromUnitVectors(X,b.clone().sub(a).normalize())}}
  function frame(u){const m=MOT,d=m.d,P=lerpP(m.A,m.B,u);easeP(P,{...d,a:m.A},m.B,u);P.pegada_d=P.pegada_e=d.pegada!=null?d.pegada:1;P.ik=m.feet?{pe_d:m.feet[0],pe_e:m.feet[1]}:{};
    if(m.err&&d.err.joelho&&m.feet)P.ik={pe_d:{...m.feet[0],joelho:d.err.joelho*sm(u)},pe_e:{...m.feet[1],joelho:d.err.joelho*sm(u)}};
    if(m.dy||m.dz)P.pelve.pos=[P.pelve.pos[0],P.pelve.pos[1]+(m.dy||0),P.pelve.pos[2]+(m.dz||0)];
    if(m.solve)m.solve(m,u,P);
    rigPose(P);
    if(d.hands==="bar"){const bar=barAt(m,u),gd=d.bar==="vpega"?Y:X;gripTo(P,[["d",new THREE.Vector3(-m.gx,bar.y,bar.z),gd],["e",new THREE.Vector3(m.gx,bar.y,bar.z),gd]]);if(m.bar){m.bar.position.copy(bar);m.bar.quaternion.identity()}}
    else if(d.hands==="db"){const p=dbAt(m,u),ax=d.db==="hang"?Z:X;gripTo(P,[["d",p[0],ax],["e",p[1],ax]])}
    else if(d.hands==="chao"){P.pegada_d=P.pegada_e=0;P.ik={...P.ik,mao_d:m.hand[0].toArray(),mao_e:m.hand[1].toArray()};rigPose(P);palmsFlat();MOT.grip=Math.max(jp("punho_d").distanceTo(m.hand[0]),jp("punho_e").distanceTo(m.hand[1]))}
    else MOT.grip=0;
    placeHeld(m);m.u=u;need=true}
  const boxOf=ks=>{const b=new THREE.Box3();updW();for(const k of ks)if(parts[k])b.expandByObject(parts[k],true);return b};
  /* the trunk's frame at the current pose: up along the spine (L3→T1), front, and the side */
  function trunkFrame(){const up=jp("T1").sub(jp("L3")).normalize(),side=new THREE.Vector3(1,0,0),front=side.clone().cross(up).normalize();return {up,front}}
  /* 0.84: the hands flat on the floor, fingers forward (+z), thumbs toward each other (push-up) */
  function palmsFlat(){for(const [sd,s] of [["d",1],["e",-1]]){const f0=rig.C0["mcf3_"+sd].clone().sub(rig.C0["punho_"+sd]).normalize(),x0=rig.C0["mcf2_"+sd].clone().sub(rig.C0["mcf5_"+sd]).normalize();
      const n0=f0.clone().cross(x0).normalize(),x0b=n0.clone().cross(f0).normalize(),f1=new THREE.Vector3(0,0,1),x1=new THREE.Vector3(s,0,0),n1=f1.clone().cross(x1).normalize(),x1b=n1.clone().cross(f1).normalize();
      const B0=new THREE.Matrix4().makeBasis(f0,x0b,n0),B1=new THREE.Matrix4().makeBasis(f1,x1b,n1),q=new THREE.Quaternion().setFromRotationMatrix(B1.multiply(B0.invert()));setWorldQ(rig.G["punho_"+sd],q)}}
  /* toe contact point (tip of the big toe) */
  const toeTip=sd=>{const a=jp("ifh_"+sd),b=jp("mtf1_"+sd);return a.clone().addScaledVector(a.clone().sub(b).normalize(),0.022)};
  function motionStart(key,opt){motionStop(true);if(!rig||!MOV[key])return false;const d=MOV[key];opt=opt||{};
    const m=MOT={key,d,opt,t:0,last:performance.now(),play:opt.play!==false,speed:opt.speed||1,sex:curSex,b:opt.deep&&d.deep?d.deep:d.b,dy:0,dz:0,g:new THREE.Group(),err:!!(opt.erro&&d.err)};
    m.A=m.err?merge(d.a,d.err.a):d.a;m.B=m.err?merge(m.b,d.err.b):m.b;
    m.gx=d.gx?d.gx[m.sex==="f"?1:0]:0.25;
    rigPose({});const A0=jp("tornozelo_d"),A1=jp("tornozelo_e");m.barZ=(A0.z+A1.z)/2+0.06;
    const pose0=()=>{const P={...m.A,pegada_d:1,pegada_e:1};P.pelve={...m.A.pelve,pos:[m.A.pelve.pos[0],m.A.pelve.pos[1]+m.dy,m.A.pelve.pos[2]+m.dz]};P.ik=m.feet?{pe_d:m.feet[0],pe_e:m.feet[1]}:{};rigPose(P);return P};
    if(d.setup==="pe"){const f=d.feet||{},w=f.wide||0;m.feet=[{alvo:[A0.x-w,A0.y,A0.z],giro:f.giro||0},{alvo:[A1.x+w,A1.y,A1.z],giro:f.giro||0}];if(d.legs)m.legs=legFront()}
    else if(d.setup==="deitado"){/* lying: the back on a 44,5 cm bench, the feet flat on the floor in front */
      m.feet=null;rigPose({...m.B,pegada_d:1,pegada_e:1});m.dy=0.445-boxOf(["dorsal_superior","dorsal_inferior","trapezio_medio","gluteo_maximo"]).min.y;
      pose0();const pv=jp("pelve");m.feet=[{alvo:[-0.30,A0.y,pv.z+0.40]},{alvo:[0.30,A1.y,pv.z+0.40]}];pose0();m.pv=pv;m.headZ=jp("cabeca").z}
    else if(d.setup==="chao"){/* lying on the floor: the back's lowest point on the floor, feet flat in front with the knees up */
      m.feet=null;rigPose({...m.A,pegada_d:1,pegada_e:1});m.dy=0.006-boxOf(["dorsal_superior","dorsal_inferior","trapezio_medio","gluteo_maximo"]).min.y;
      pose0();const ka=jp("tornozelo_d"),kb=jp("tornozelo_e");m.feet=[{alvo:[ka.x-0.03,A0.y,ka.z]},{alvo:[kb.x+0.03,A1.y,kb.z]}];pose0()}
    else if(d.setup==="pendurado"){/* the bar high enough that the feet hang clear; the shoulders go from straight-arm hang to the chin over the bar */
      m.feet=null;pose0();const s0=jp("ombro_d").add(jp("ombro_e")).multiplyScalar(0.5),R0=jp("ombro_e").distanceTo(hook("e").c),dx=m.gx-Math.abs(jp("ombro_e").x);
      const vr=Math.sqrt(Math.max(0.01,(R0*0.985)**2-dx*dx)),H=rig.C0["ombro_e"].y+vr+0.2;m.barPt=new THREE.Vector3(0,H,0.02);m.H=H;
      m.yb=H-vr;m.yt=H-0.15;if(m.err&&d.err.half)m.yb=m.yb+(m.yt-m.yb)*d.err.half;
      m.solve=(m,u,P)=>{for(let it=0;it<3;it++){rigPose(P);const c=jp("ombro_d").add(jp("ombro_e")).multiplyScalar(0.5),ys=m.yb+(m.yt-m.yb)*sm(u),zs=m.barPt.z-0.04-0.1*sm(u);
        P.pelve.pos=[P.pelve.pos[0],P.pelve.pos[1]+ys-c.y,P.pelve.pos[2]+zs-c.z]}}}
    else if(d.setup==="flexao"){/* push-up: the body turns about the toes so the shoulders go from straight arms to the chest near the floor */
      m.feet=null;m.toeZ=-0.75;const th0=THREE.MathUtils.degToRad(90-m.A.pelve.flex);
      m.solve=(m,u,P)=>{const hs=m.hTop!=null?m.hTop+(m.hBot-m.hTop)*sm(u):0.6;let th=m.th==null?th0:m.th;
        for(let it=0;it<4;it++){P.pelve.flex=90-THREE.MathUtils.radToDeg(th);rigPose(P);const tc=toeTip("d").add(toeTip("e")).multiplyScalar(0.5);
          P.pelve.pos=[P.pelve.pos[0],P.pelve.pos[1]-tc.y+0.019,P.pelve.pos[2]+m.toeZ-tc.z];rigPose(P);const sh=jp("ombro_d").add(jp("ombro_e")).multiplyScalar(0.5),L=Math.max(0.5,Math.hypot(sh.y,sh.z-m.toeZ));
          th+=Math.asin(Math.max(-1,Math.min(1,(hs-sh.y)/L)))*0.9}m.th=th};
      /* first: arms straight from the shoulders to the floor; that gives the top height and where the hands go */
      const la=rig.C0["ombro_e"].distanceTo(rig.C0["cotovelo_e"])+rig.C0["cotovelo_e"].distanceTo(rig.C0["punho_e"]);m.hTop=0.046+la*0.97;m.hBot=m.err?0.25:0.2;m.th=null;
      const P=pose0();m.solve(m,0,P);rigPose(P);const sd2=jp("ombro_d"),se2=jp("ombro_e");m.hand=[new THREE.Vector3(sd2.x-0.07,0.046,sd2.z+0.03),new THREE.Vector3(se2.x+0.07,0.046,se2.z+0.03)];m.th=null}
    else if(d.setup==="ponte"){/* hip thrust: the back's contact point (upper back) stays on the bench edge E; feet where the top pose puts them */
      m.feet=null;m.E=new THREE.Vector3(0,0.432,0);const PB={...m.B,pegada_d:1,pegada_e:1};rigPose(PB);const tfB=trunkFrame(),T5=jp("T5");
      const bp=farthest(["dorsal_superior","trapezio_medio","infraespinhal","trapezio_inferior"],tfB.front.clone().negate()).p;bp.x=T5.x;m.backOff=bp.sub(T5).applyQuaternion(wq(rig.G.T5).invert());
      m.solve=(m,u,P)=>{const ik=P.ik;P.ik={};rigPose(P);const C=jp("T5").add(m.backOff.clone().applyQuaternion(wq(rig.G.T5)));P.pelve.pos=[P.pelve.pos[0],P.pelve.pos[1]+m.E.y-C.y,P.pelve.pos[2]+m.E.z-C.z];P.ik=ik};
      m.solve(m,1,PB);rigPose(PB);const ka=jp("tornozelo_d"),kb=jp("tornozelo_e");m.feet=[{alvo:[ka.x,A0.y,ka.z]},{alvo:[kb.x,A1.y,kb.z]}];
      /* the bar sits on the hip crease: offset from the pelvis, found at the top pose */
      const hc=jp("quadril_d").add(jp("quadril_e")).multiplyScalar(0.5),qp=wq(rig.G.pelve),pu=new THREE.Vector3(0,1,0).applyQuaternion(qp),pf=new THREE.Vector3(0,0,1).applyQuaternion(qp),hp=skinAt(["abdomen_infra","quad_reto_femoral","sartorio","adutores","deco"],hc,pu,pf,0.035);
      hp.addScaledVector(pf,0.05);hp.x=hc.x;m.hipOff=hp.sub(jp("pelve")).applyQuaternion(wq(rig.G.pelve).invert());
      pose0()}
    else if(d.setup==="bulgaro"){/* front (right) foot ahead, the back (left) foot's instep on a 45 cm bench behind */
      m.feet=[{alvo:[A0.x+0.01,A0.y,A0.z+0.36]},{alvo:[A1.x-0.02,0.45+0.055,A1.z-0.58],plano:false}];m.benchZ=A1.z-0.58-0.03;m.reach=0;pose0()}
    else if(d.setup==="ponta"){/* calf raise: no leg IK; the body is moved so the balls of the feet stay where they are */
      m.feet=null;rigPose({});const b0=jp("mtf1_d").add(jp("mtf1_e")).multiplyScalar(0.5);m.ball=b0;m.foot0={d:jp("mtf1_d").sub(jp("tornozelo_d")),e:jp("mtf1_e").sub(jp("tornozelo_e"))};
      m.solve=(m,u,P)=>{P.ik={};rigPose(P);/* the toes bend back by as much as the foot tips forward (measured, so bent knees count too) */
        for(const sd of ["d","e"]){const v=jp("mtf1_"+sd).sub(jp("tornozelo_"+sd)),r=m.foot0[sd],pt=Math.atan2(v.y,Math.hypot(v.x,v.z))-Math.atan2(r.y,Math.hypot(r.x,r.z));for(let i=1;i<=5;i++)P["mtf"+i+"_"+sd]={flex:THREE.MathUtils.radToDeg(pt)}}rigPose(P);const b=jp("mtf1_d").add(jp("mtf1_e")).multiplyScalar(0.5);const lf=m.lift?m.lift[0]+(m.lift[1]-m.lift[0])*sm(u):0;P.pelve.pos=[P.pelve.pos[0],P.pelve.pos[1]+m.ball.y-b.y+lf,P.pelve.pos[2]+m.ball.z-b.z]};
      m.lift=[0,0];pose0()}
    else if(d.setup==="remo"){/* seated cable row: glutes on a 42 cm seat, the legs by their angles, the feet on a plate where they are */
      m.feet=null;pose0();m.dy=0.42-farthest(GLUTK,new THREE.Vector3(0,-1,0)).p.y;pose0();const am=jp("tornozelo_d").add(jp("tornozelo_e")).multiplyScalar(0.5),sh=new THREE.Vector3(0,-1,0).applyQuaternion(wq(rig.G.tornozelo_d));sh.x=0;sh.normalize();
      /* the foot plate flat against the soles (the sole's normal = rest "down" turned with the foot) */m.plateN=sh;m.feet=[{alvo:jp("tornozelo_d").toArray(),plano:false},{alvo:jp("tornozelo_e").toArray(),plano:false}];m.plate=skinAt(["pele"],am,X,sh,0.4,0.4);m.plate.x=0;m.plateZ=m.plate.z;m.seatZ=farthest(GLUTK,new THREE.Vector3(0,-1,0)).p.z}
    else if(d.setup==="inclinado"){/* seated on an adjustable bench: glutes on a 47 cm seat, feet flat on the floor where the shins point */
      m.feet=null;pose0();m.dy=(d.seat||0.47)-farthest(GLUTK,new THREE.Vector3(0,-1,0)).p.y;pose0();
      /* feet on the floor right under the knees (thighs level on the seat, shins upright), a little wider */
      const ka=jp("joelho_d"),kb=jp("joelho_e");m.feet=[{alvo:[ka.x-0.05,A0.y,ka.z+0.04]},{alvo:[kb.x+0.05,A1.y,kb.z+0.04]}];pose0()}
    /* references of the path, at the starting pose */
    pose0();const tf=trunkFrame(),sd=jp("ombro_d"),se=jp("ombro_e"),la=sd.distanceTo(jp("cotovelo_d"))+jp("cotovelo_d").distanceTo(jp("punho_d"));
    if(d.bar==="peito"){const ch=boxOf(["peito_medial","peito_inferior"]),t6=jp("T6");m.low=new THREE.Vector3(0,ch.max.y+0.016,t6.z+0.03+(m.err&&d.err.low||0));
      const dx=m.gx-Math.abs(sd.x),reach=la*0.97+0.075;m.top=new THREE.Vector3(0,(sd.y+se.y)/2+Math.sqrt(Math.max(0.01,reach*reach-dx*dx)),(sd.z+se.z)/2+0.01)}
    if(d.bar==="remo"){m.legs=m.legs||legFront();m.hang=hangBar(m,(sd.z+se.z)/2+0.02,false);const bl=farthest(["abdomen_supra","abdomen_infra"],tf.front);m.belly=bl.p.clone().addScaledVector(tf.front,0.03);m.belly.x=0}
    if(d.bar==="press"){const fr=farthest(["peito_superior"],new THREE.Vector3(0,0,1));const sy=(sd.y+se.y)/2,sz=(sd.z+se.z)/2;
      m.low=new THREE.Vector3(0,sy+0.02,Math.max(fr.d+0.03,sz+0.12));const dx=m.gx-Math.abs(sd.x),reach=la*0.97+0.075;m.top=new THREE.Vector3(0,sy+Math.sqrt(Math.max(0.01,reach*reach-dx*dx)),sz-0.01)}
    if(d.db==="press"||d.db==="ohp"){const reach=la*0.97+0.06;m.dbA=[];m.dbB=[];
      for(const [S,s] of [[sd,-1],[se,1]]){const lat=new THREE.Vector3(s,0,0);
        if(d.db==="press"){m.dbA.push(S.clone().add(new THREE.Vector3(0,reach,0)).addScaledVector(lat,-0.04));m.dbB.push(S.clone().addScaledVector(tf.front,0.09).addScaledVector(tf.up,-0.02).addScaledVector(lat,0.17+(m.err&&d.err.dbLat||0)))}
        else{m.dbA.push(S.clone().addScaledVector(lat,0.12).addScaledVector(tf.up,0.09).addScaledVector(tf.front,0.03));m.dbB.push(S.clone().addScaledVector(tf.up,reach).addScaledVector(lat,-0.03))}}}
    if(d.db==="hang")m.reach=la*0.97+0.06;
    if(d.bar==="puxada"){/* top: straight arms overhead (a little in front); bottom: the top of the chest at the end pose */
      const dx=m.gx-Math.abs(sd.x),reach=la*0.97+0.075;m.top=new THREE.Vector3(0,(sd.y+se.y)/2+Math.sqrt(Math.max(0.01,reach*reach-dx*dx)),(sd.z+se.z)/2+0.07);
      const P=lerpP(m.A,m.B,1);P.pelve.pos=[P.pelve.pos[0],P.pelve.pos[1]+m.dy,P.pelve.pos[2]+m.dz];P.ik=m.feet?{pe_d:m.feet[0],pe_e:m.feet[1]}:{};rigPose(P);const t2=trunkFrame();
      m.low=farthest(["peito_superior"],t2.front).p.addScaledVector(t2.front,0.035).addScaledVector(t2.up,0.03);m.low.x=0;pose0();m.pulley=new THREE.Vector3(0,m.top.y+0.5,m.top.z+0.02)}
    if(d.bar==="vpega"){/* arms straight forward at belly height → the handle just in front of the belly */
      const bl=farthest(["abdomen_supra"],Z).p,h=bl.y+0.02,S=sd.clone().add(se).multiplyScalar(0.5),reach=la*(m.err?0.9:0.94)+0.075;
      m.top=new THREE.Vector3(0,h,S.z+Math.sqrt(Math.max(0.01,reach*reach-(S.y-h)**2)));
      /* the end: in front of the belly as it is at the end pose (with the mistake, the trunk leans back) */
      {const P=lerpP(m.A,m.B,1);P.pelve.pos=[P.pelve.pos[0],P.pelve.pos[1]+m.dy,P.pelve.pos[2]+m.dz];P.ik={};rigPose(P);const b2=farthest(["abdomen_supra"],Z).p;m.low=new THREE.Vector3(0,h,b2.z+0.07);pose0()}m.pulley=new THREE.Vector3(0,h,Math.max(m.plateZ+0.3,m.top.z+0.3))}
    if((d.hands==="bar"||d.holds==="bar")&&d.bar!=="fixa"){m.bar=d.bar==="puxada"?latBar():d.bar==="vpega"?vHandle():barbell();m.g.add(m.bar)}
    if(d.holds==="corda"){m.rope=rope();m.g.add(m.rope)}
    if(d.hands==="db"||d.holds==="db"){m.db=[dumbbell(),dumbbell()];m.db.forEach(x=>m.g.add(x))}
    frame(0);
    const E=d.eq||[],FR=()=>eqMat(0x33373d,.45,.45),ST=()=>eqMat(0xc9cdd3,.6,.3);
    if(E.includes("stands"))for(const s of [-1,1])upright(m.g,s*0.6,m.bar.position.z+0.85,-1,m.bar.position.y-0.06,FR(),ST());
    if(E.includes("banco"))flatBench(m.g,0.445,m.headZ-0.16,m.pv.z+0.22);
    if(E.includes("suportes"))for(const s of [-1,1])upright(m.g,s*0.56,m.headZ-0.1,1,m.top.y-0.12,FR(),ST());
    if(E.includes("barra_fixa"))pullBar(m.g,m.H);
    if(E.includes("polia_alta")){const k=m.knot||hook("d").c;m.pulley=new THREE.Vector3(0,2.05,k.z+0.06);cableTower(m.g,m.pulley,m.pulley.z+0.32,false)}
    if(E.includes("polia_puxada")){const kn=jp("joelho_d"),seatTop=d.seat||0.47,sz=farthest(GLUTK,new THREE.Vector3(0,-1,0)).p.z,pad=eqMat(0x1e2125,0,.6),fr=eqMat(0x33373d,.45,.45);
      ebox(m.g,0.36,0.07,0.36,0,seatTop-0.035,sz+0.06,pad,"pad");ebox(m.g,0.06,seatTop-0.07,0.06,0,(seatTop-0.07)/2,sz+0.06,fr,"frame");
      const thigh=boxOf(["quad_reto_femoral","quad_vasto_lateral"]).max.y;for(const s of [-1,1]){const r=eqMesh(new THREE.CylinderGeometry(0.055,0.055,0.2,20).rotateZ(Math.PI/2),pad,"pad",m.g);r.position.set(s*0.13,thigh+0.05,kn.z-0.06)}
      ebox(m.g,0.06,0.06,0.5,0,thigh+0.05,kn.z+0.2,fr,"frame");cableTower(m.g,m.pulley,kn.z+0.45,true)}
    if(E.includes("polia_baixa")){const pad=eqMat(0x1e2125,0,.6),fr=eqMat(0x33373d,.45,.45);ebox(m.g,0.34,0.07,0.46,0,0.385,m.seatZ+0.04,pad,"pad");for(const zz of [m.seatZ-0.12,m.seatZ+0.2])ebox(m.g,0.06,0.35,0.06,0,0.175,zz,fr,"frame");
      ebox(m.g,0.05,0.05,Math.max(0.2,m.pulley.z-m.seatZ+0.1),0,0.08,(m.seatZ+m.pulley.z)/2,fr,"frame");
      const pc=m.plate.clone().addScaledVector(m.plateN,0.016),pl=ebox(m.g,0.5,0.34,0.03,0,0,0,fr,"frame");pl.position.copy(pc);pl.quaternion.setFromUnitVectors(Z,m.plateN);ebox(m.g,0.05,pc.y,0.05,0,pc.y/2,pc.z+0.06,fr,"frame");cableTower(m.g,m.pulley,m.pulley.z+0.28,false)}
    if(m.pulley){m.cab=cableMesh(m.g);placeHeld(m)}
    if(E.includes("banco_x")){const sub=new THREE.Group();flatBench(sub,m.E.y-0.004,-0.62,0.62);sub.rotation.y=Math.PI/2;sub.position.set(0,0,m.E.z-0.13);m.g.add(sub)}
    if(E.includes("banco_tras")){const sub=new THREE.Group();flatBench(sub,0.45,-0.55,0.55);sub.rotation.y=Math.PI/2;sub.position.set(0,0,m.benchZ-0.04);m.g.add(sub)}
    if(m.d.bar==="quadril"&&m.bar){const pad=eqMesh(new THREE.CylinderGeometry(0.042,0.042,0.4,28).rotateZ(Math.PI/2),eqMat(0x2a2d32,0,.85),"pad",m.bar)}
    if(E.includes("banco_inc")){/* the back pad lies on the back, at the trunk's own angle; the seat under the glutes */
      const t2=trunkFrame(),ang=THREE.MathUtils.radToDeg(Math.atan2(t2.up.y,-t2.up.z)),a=THREE.MathUtils.degToRad(ang),nrm=new THREE.Vector3(0,Math.cos(a),Math.sin(a));
      const bk=farthest(BACKK,nrm.clone().negate()),gl=farthest(GLUTK,new THREE.Vector3(0,-1,0)),seatTop=gl.p.y;
      const pz=bk.p.z-Math.cos(a)*(seatTop-bk.p.y)/Math.max(0.2,Math.sin(a));
      adjBench(m.g,seatTop,pz-0.02,pz+0.36,new THREE.Vector3(0,seatTop,pz),ang,0.78)}
    addShadow(m);scene.add(m.g);
    const [deg,ty,dk,tz]=d.cam,a=THREE.MathUtils.degToRad(deg);m.tgt=new THREE.Vector3(0,ty,tz);m.dk=dk;
    controls.target.copy(m.tgt);const dd=fitD()*dk;camera.position.set(Math.sin(a)*dd,ty+0.08,tz+Math.cos(a)*dd);controls.maxDistance=fitD()*1.6;controls.minDistance=fitD()*0.45;
    need=true;return true}
  /* 0.83: the target muscles glow a little stronger while they work hardest (the step that moves toward `con`, the
     concentric end), softer while lowering and at rest */
  function effort(m){const T=m.d.t,[i,f]=stepAt(m.t,T),u0=T[(i+T.length-1)%T.length][1],u1=T[i][1],c=m.d.con;
    if(u0===u1)return u1===c?0.55:0.15;return u1===c?0.55+0.45*Math.sin(Math.PI*Math.min(1,f*1.15)):0.3}
  function glowStep(){const m=MOT;if(!m)return;const e=effort(m);m.glow=(m.glow==null?e:m.glow+(e-m.glow)*0.12);
    for(const [k0,o] of Object.entries(parts)){const s=state[BASEK(k0)];if(!s||!s.on||!o.material||!o.material.emissive)continue;o.material.emissiveIntensity=0.1+0.42*m.glow}need=true}
  /* 0.83: turn the camera around the movement to an angle (0 = in front, 90 = from the side, 180 = behind) */
  function orbit(deg){const m=MOT,t=m?m.tgt:controls.target,o=camera.position.clone().sub(t),r=Math.hypot(o.x,o.z),y=o.y,a0=Math.atan2(o.x,o.z),a1=THREE.MathUtils.degToRad(deg);
    let da=a1-a0;da=Math.atan2(Math.sin(da),Math.cos(da));if(reduce()){camera.position.set(t.x+Math.sin(a1)*r,t.y+y,t.z+Math.cos(a1)*r);need=true;return}
    const t0=performance.now();(function step(){if(!alive)return;const k=Math.min(1,(performance.now()-t0)/500),e=1-Math.pow(1-k,3),a=a0+da*e;camera.position.set(t.x+Math.sin(a)*r,t.y+y,t.z+Math.cos(a)*r);need=true;if(k<1)requestAnimationFrame(step)})()}
  /* 0.83: a soft shadow on the floor under the scene (not in the outline pass) */
  let SHT=null;function shadowTex(){if(SHT)return SHT;const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d"),gr=g.createRadialGradient(64,64,4,64,64,64);
    gr.addColorStop(0,"rgba(0,0,0,0.34)");gr.addColorStop(0.55,"rgba(0,0,0,0.16)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(0,0,128,128);SHT=new THREE.CanvasTexture(c);return SHT}
  function addShadow(m){const b=new THREE.Box3();for(const id of ["pelve","tornozelo_d","tornozelo_e","cabeca","punho_d","punho_e"])b.expandByPoint(jp(id));m.g.updateMatrixWorld(true);
    m.g.traverse(o=>{if(o.isMesh&&o.geometry){o.geometry.computeBoundingBox&&o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);if(bb.max.y<1.2){b.expandByPoint(new THREE.Vector3(bb.min.x,0,bb.min.z));b.expandByPoint(new THREE.Vector3(bb.max.x,0,bb.max.z))}}});
    const w=Math.max(0.9,b.max.x-b.min.x+0.5),l=Math.max(0.9,b.max.z-b.min.z+0.5);
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(w,l),new THREE.MeshBasicMaterial({map:shadowTex(),transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.set((b.min.x+b.max.x)/2,0.002,(b.min.z+b.max.z)/2);sh.renderOrder=-1;sh.name="sombra";m.g.add(sh);m.shadow=sh}
  function motionStop(keepCam){if(!MOT)return;clearEq();MOT=null;if(rig)rigPose({});if(!keepCam&&ready){lims();view(curV,false)}need=true}

  renderer.setAnimationLoop(()=>{if(!box.offsetParent)return;   /* hidden (2D or another tab): no drawing */
    controls.enabled=!api.covered();
    if(MOT&&MOT.play){const now=performance.now(),dt=Math.min(0.1,(now-MOT.last)/1000);MOT.last=now;MOT.t+=dt*MOT.speed;frame(phaseAt(MOT.t,MOT.d.t));glowStep()}else if(MOT)MOT.last=performance.now();
    if(controls.update())need=true;
    /* the point it turns around stays near the middle of the body (owner 0.19: "mais centralizado") */
    const t=controls.target,c=MOT?t.clone().clamp(MOT.tgt.clone().subScalar(0.5),MOT.tgt.clone().addScalar(0.5)):t.clone().clamp(BB.min,BB.max);if(!MOT){c.x=Math.max(-BW*0.2,Math.min(BW*0.2,c.x));c.z=Math.max(-0.08,Math.min(0.08,c.z))}if(!c.equals(t)){camera.position.add(c.clone().sub(t));t.copy(c);need=true}
    if(need){keepOut();need=false;draw()}});
  /* owner: zoom must not go inside the body — if the camera gets closer than ~13 cm to the surface, it backs off */
  const camP=new THREE.Vector3(),awayV=new THREE.Vector3();
  function keepOut(){if(!CLOUD||MOT)return;const R=0.13,R2=R*R;
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
    pose(P){rigPose(P)},rigReady(){return !!rig},
    /* 0.77: the exercise movement — motion("agach"|"terra"|"supino", {deep, play, speed}) → false if the body is not
       ready; motion(null) stops (back to the A pose and the usual framing); play(on), speed(0.5|1); still(u) = still frame */
    motion(k,o){if(!k){motionStop();return true}return motionStart(k,o)},
    play(on){if(MOT){MOT.play=!!on;MOT.last=performance.now()}},speed(x){if(MOT)MOT.speed=x},orbit(deg){orbit(deg)},glow(){return MOT?MOT.glow:null},erro(){return MOT?MOT.err:false},
    camPos(){return camera.position.toArray()},
    still(u){if(MOT){MOT.play=false;frame(u);glowStep()}},motionInfo(){return MOT?{key:MOT.key,play:MOT.play,speed:MOT.speed,u:MOT.u,t:MOT.t,bar:MOT.bar?MOT.bar.position.toArray():null,grip:MOT.grip,legGap:MOT.legs&&MOT.bar?MOT.bar.position.z-barClear(MOT,MOT.bar.position.y):null,step:stepAt(MOT.t,MOT.d.t),steps:MOT.d.t.length,T:MOT.d.t,err:MOT.err}:null},
    motions(){return Object.keys(MOV)},
    /* for checks/prints only: a thin rod between two points (stands in for a barbell until the equipment exists) */
    marca(id,a,b){scene.children.filter(o=>o.name==="mk_"+id).forEach(o=>{scene.remove(o);o.geometry.dispose()});if(!a)return need=true;
      const A=new THREE.Vector3().fromArray(a),B=new THREE.Vector3().fromArray(b),L=A.distanceTo(B);
      const m=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,L,16),new THREE.MeshStandardMaterial({color:0x555b63,roughness:0.4,metalness:0.6}));m.name="mk_"+id;
      m.position.copy(A).add(B).multiplyScalar(0.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());scene.add(m);need=true},rigJoints(){return rig?Object.fromEntries(Object.entries(rig.J).map(([k,j])=>[k,{nome:j.nome,pai:j.pai,mov:j.mov.map(m=>[m.id,m.min,m.max,m.repouso])}])):null},
    rigDebug(on){rigDebug(on)},
    jointPos(id){if(!rig||!rig.G[id])return null;const v=new THREE.Vector3();rig.G[id].getWorldPosition(v);return v.toArray()},
    /* for tests: is this part drawn now; bounding boxes of the skeleton and of the body */
    visible(k){return !!(parts[k]&&parts[k].visible)},
    /* 0.76: how many parts are skinned to the joints; each part's box with the pose applied (CPU skinning, slow) */
    skinned(){return [pickables.filter(o=>o.isSkinnedMesh).length,pickables.length]},
    /* 0.84 (tests): the closest any vertex of these parts comes to the segment p0–p1 (metres; JS linear skinning) */
    nearest(ks,p0,p1){updW();const A=new THREE.Vector3().fromArray(p0),B=new THREE.Vector3().fromArray(p1),ln=new THREE.Line3(A,B),v=new THREE.Vector3(),c=new THREE.Vector3();let best=9,bp=null;
      for(const k of ks){const o=parts[k];if(!o)continue;const n=o.geometry.attributes.position.count;for(let i=0;i<n;i++){o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);ln.closestPointToPoint(v,true,c);const d=c.distanceTo(v);if(d<best){best=d;bp=v.toArray()}}}
      return {d:best,p:bp}},
    lowest(ks){updW();const v=new THREE.Vector3();let best=null;for(const k of ks||Object.keys(parts)){const o=parts[k];if(!o)continue;const n=o.geometry.attributes.position.count;
      for(let i=0;i<n;i++){o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);if(!best||v.y<best.p[1])best={k,p:v.toArray()}}}return best},
    eqInfo(){const m=MOT;if(!m)return null;const a=v=>v&&v.toArray?v.toArray().map(x=>+x.toFixed(3)):v;return {pulley:a(m.pulley),plate:a(m.plate),plateZ:m.plateZ,plateN:a(m.plateN),seatZ:m.seatZ,top:a(m.top),low:a(m.low),knot:a(m.knot),cab:m.cab?{p:a(m.cab.position),len:+m.cab.scale.y.toFixed(3)}:null}},
    bar(){return MOT&&MOT.barPt?MOT.barPt.toArray():MOT&&MOT.bar?MOT.bar.position.toArray():null},
    partBoxes(){updW();const r={};for(const [k,o] of Object.entries(parts)){const b=new THREE.Box3().expandByObject(o,true);r[k]={min:b.min.toArray(),max:b.max.toArray()}}return r},
    boxes(){if(!bones||!root)return null;const bb=new THREE.Box3();for(const o of boneMs)if(o.visible)bb.expandByObject(o);const cv=root.visible;const v0=Object.values(parts).map(o=>o.visible);Object.values(parts).forEach(o=>o.visible=true);
      const cb=new THREE.Box3().setFromObject(root);Object.values(parts).forEach((o,i)=>o.visible=v0[i]);return {bones:{min:bb.min.toArray(),max:bb.max.toArray()},body:{min:cb.min.toArray(),max:cb.max.toArray()}}},
    bonesReady(){return !!bones&&bonesSex===curSex},
    sexNow(){return curSex},
    refit(){resize();view(curV,true)},
    keys(){return Object.keys(parts)},
    /* for tests: where a muscle is on screen (middle of its front/back half), and its colour now */
    at(k){const o=parts[k];if(!o)return null;const bb=new THREE.Box3().setFromObject(o),c=bb.getCenter(new THREE.Vector3());c.z=curV==="back"?bb.min.z:bb.max.z;c.x=bb.min.x+(bb.max.x-bb.min.x)*0.3;
      c.project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(c.x+1)/2*r.width,y:r.top+(1-c.y)/2*r.height}},
    /* for screenshots: look from an angle (deg, 0 = front), distance (m) and height (0..1 of the body) */
    look(deg,dist,yf,xo,zo){const a=THREE.MathUtils.degToRad(deg),y=yf==null?CY:BB.min.y+(BB.max.y-BB.min.y)*yf,d=dist||fitD(),x=xo||0,z=zo||0;
      controls.target.set(x,y,z);camera.position.set(x+Math.sin(a)*d,y+0.03,z+Math.cos(a)*d);need=true},
    /* for tests: put the camera somewhere (relative to the target) and read where it ended up */
    setTarget(t){controls.target.fromArray(t);if(MOT)MOT.tgt.fromArray(t);need=true},
    place(x,y,z){camera.position.set(controls.target.x+x,controls.target.y+y,controls.target.z+z);need=true},
    cam(){const o=camera.position.clone().sub(controls.target),p=camera.position;let m=Infinity;
      if(CLOUD)for(let i=0;i<CLOUD.length;i+=3)m=Math.min(m,Math.hypot(CLOUD[i]-p.x,CLOUD[i+1]-p.y,CLOUD[i+2]-p.z));
      return {dist:o.length(),polar:THREE.MathUtils.radToDeg(Math.acos(o.y/o.length())),surf:m,max:controls.maxDistance,min:controls.minDistance}},
    jointAt(j){const g=jMarks.find(x=>x.userData.j===j);if(!g)return null;const c=g.position.clone().project(camera),r=canvas.getBoundingClientRect();return {x:r.left+(c.x+1)/2*r.width,y:r.top+(1-c.y)/2*r.height,c:"#"+g.userData.fill.material.color.getHexString()}},
    color(k){const o=parts[k];return o?"#"+o.material.color.getHexString():null},
    dispose(){alive=false;HEADS.delete(applyHead);renderer.setAnimationLoop(null);ro.disconnect();mo.disconnect();mq.removeEventListener("change",onMq);controls.dispose();renderer.dispose();canvas.remove();tip.remove()}
  };
}
