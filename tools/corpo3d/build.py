# Muscle Atlas 3D bodies (3d/corpo-N.glb male, 3d/corpo-f-N.glb female). BodyParts3D (DBCLS, CC BY-SA 2.1 JP) -> muscles
# grouped by the Atlas keys, A-pose, Classic Physique (male) or Wellness (female, SEX=f: wide hips, small waist, big glutes,
# thick thighs, lighter shoulders/arms, smooth breast contour), solid skull with teeth (baked shadow), skin only on hands,
# feet and the front of the neck (owner, nov/2026).
# Needs: pip install trimesh fast_simplification scipy scikit-image (embree/pyembree speeds up the skull shadow) ; the BodyParts3D
#        STL folder in BP3D_STL (muscles, bones, skin FMA7163, the 28 teeth and the eyeballs FMA12513) ; sel.tsv next to this file.
# Run:  BP3D_STL=/path/to/stl python3 build.py        ->  corpo.glb   + juntas.json
#       BP3D_STL=/path/to/stl SEX=f python3 build.py  ->  corpo-f.glb + juntas-f.json
#       then  npx @gltf-transform/cli quantize corpo.glb ../../3d/corpo-N.glb  (and the same for the female body), and copy the
#       joints to ../../3d/juntas-N.json / juntas-f-N.json (new names = phones fetch them again)
import trimesh, numpy as np, fast_simplification as fs, re, sys, os
D=os.environ.get('BP3D_STL','').rstrip('/')+'/'
os.chdir(os.path.dirname(os.path.abspath(__file__)))
MAP=[("clavicular part of .* pectoralis","peito_superior"),("sternocostal part of .* pectoralis","peito_medial"),("abdominal part of .* pectoralis","peito_inferior"),
("clavicular part of .* deltoid","ombro_frontal"),("acromial part of .* deltoid","ombro_lateral"),("spinal part of .* deltoid","ombro_posterior"),
("long head of .* biceps brachii","biceps_longa"),("short head of .* biceps brachii","biceps_curta"),("brachialis","braquial"),
("long head of .* triceps","triceps_longa"),("lateral head of .* triceps","triceps_lateral"),("medial head of .* triceps","triceps_medial"),
("brachioradialis","antebraco_braquiorradial"),("flexor carpi|palmaris|flexor digitorum superficialis|pronator teres","antebraco_flexores"),
("extensor carpi|extensor digitorum$|extensor digiti minimi|anconeus","antebraco_extensores"),
("descending part of .* trapezius","trapezio_superior"),("transverse part of .* trapezius","trapezio_medio"),("ascending part of .* trapezius","trapezio_inferior"),
("infraspinatus|teres minor","infraespinhal"),("teres major","redondo_maior"),("latissimus","DORSAL"),("serratus anterior","serratil"),
("rectus abdominis","ABDOMEN"),("external oblique","obliquos"),("gluteus maximus","gluteo_maximo"),("gluteus medius","gluteo_medio"),
("tensor fasciae","abdutores"),("adductor|gracilis|pectineus","adutores"),("rectus femoris","quad_reto_femoral"),("vastus lateralis","quad_vasto_lateral"),
("vastus medialis","quad_vasto_medial"),("biceps femoris","isquio_biceps_femoral"),("semitendinosus|semimembranosus","isquio_semitendineo"),
("gastrocnemius","panturrilha_gastro"),("soleus","panturrilha_soleo")]

# Owner: "bem mais forte, musculoso que o normal". Push each muscle out along its normals, most in the belly, nothing at the
# tendons (t = position along the muscle's long axis). Values in mm, by Atlas group.
INF={"peito_superior":23,"peito":20,"ombro_lateral":27,"ombro":25,"biceps":24,"braquial":12,"triceps":23,"antebraco":13,"trapezio_superior":23,"trapezio":17,"infraespinhal":12,"redondo":12,"DORSAL":21,
 "serratil":8,"ABDOMEN":7,"obliquos":1,"gluteo":10,"abdutores":4,"adutores":17,"quad_vasto_lateral":19,"quad_vasto_medial":9,"quad_reto_femoral":12,"quad":8,"isquio":10,
 "panturrilha_gastro":11,"panturrilha_soleo":3}
# where along the muscle (0 = lowest point, 1 = highest) the bulge peaks, and how wide it is: the outer quad "sweep" sits
# low-mid, the inner quad "teardrop" just above the knee, the calf high (diamond, not a ball at the ankle)
import os
FEM=os.environ.get("SEX")=="f"
if FEM:   # owner (0.15): female 3D, Wellness — thick thighs, very big glutes, small waist, wide hips, lighter shoulders and arms
  INF={"peito_superior":5,"peito":5,"ombro_lateral":12,"ombro":10,"biceps":8,"braquial":5,"triceps":9,"antebraco":4,"trapezio_superior":4,"trapezio":7,"infraespinhal":7,"redondo":6,"DORSAL":8,
   "serratil":3,"ABDOMEN":4,"obliquos":0,"gluteo_maximo":27,"gluteo_medio":14,"abdutores":8,"adutores":24,"quad_vasto_lateral":24,"quad_vasto_medial":12,"quad_reto_femoral":14,"quad":10,"isquio":18,
   "panturrilha_gastro":8,"panturrilha_soleo":3}
PEAK={"quad_vasto_lateral":(0.55,0.3),"quad_vasto_medial":(0.2,0.14),"quad_reto_femoral":(0.6,0.33),"panturrilha_gastro":(0.74,0.17),
 "panturrilha_soleo":(0.4,0.25),"isquio":(0.65,0.3),"adutores":(0.82,0.22)}
if FEM:PEAK["gluteo_maximo"]=(0.42,0.36)   # the round glute sits low, with a shelf on top
def inflate(m,key,name):
  a=next((v for k,v in INF.items() if key.startswith(k)),0)
  if key=="deco":  # shin and front-of-thigh muscles fill out too, so the lower leg is not thin next to the calves
    a=next((v for k,v in (("tibialis anterior",4),("fibularis",3),("extensor digitorum longus",3),("sartorius",3)) if k in name),0)
  if not a:return m
  V=m.vertices.copy();c=V.mean(0)
  # smooth normals over the neighbours first: raw normals of a decimated mesh are noisy and make the surface fold
  N=m.vertex_normals.copy();nb=m.vertex_neighbors
  A=trimesh.graph.adjacency_matrix(m.edges_unique) if False else None
  import scipy.sparse as sp
  e=m.edges_unique;W=sp.coo_matrix((np.ones(len(e)*2),(np.r_[e[:,0],e[:,1]],np.r_[e[:,1],e[:,0]])),shape=(len(V),len(V))).tocsr()
  deg=np.asarray(W.sum(1)).ravel()+1
  for _ in range(8):N=(W@N+N)/deg[:,None];N/=np.linalg.norm(N,axis=1,keepdims=True)+1e-9
  u,sv,vt=np.linalg.svd(V-c,full_matrices=False);ax=vt[0]
  t=(V-c)@ax;t=(t-t.min())/(t.max()-t.min()+1e-9)
  f=np.sin(np.pi*np.clip(t,0,1))**0.8
  pk=next((v for k,v in PEAK.items() if key.startswith(k)),None)
  if pk:   # shaped along the height of the leg instead of the muscle's own axis
    tz=(V[:,2]-V[:,2].min())/(np.ptp(V[:,2])+1e-9);f=np.exp(-((tz-pk[0])/pk[1])**2)*np.sin(np.pi*np.clip(tz,0,1))**0.35
  if key=="ABDOMEN":   # six-pack: 4 bulges down the muscle (z = up) and a groove at the midline
    z=(V[:,2]-V[:,2].min())/(np.ptp(V[:,2])+1e-9)
    f=0.35+0.65*np.abs(np.sin(np.pi*(z*3.6+0.15)))**0.6
    f*=np.clip(np.abs(V[:,0])/12.0,0.55,1)
  if "trapezius" in name and "descending" in name: f=np.maximum(f,0.6)
  # near the midline grow forward/backward only, so left and right halves never cross each other (no speckles at the
  # spine, sternum and linea alba)
  N=N.copy();N[:,0]*=np.clip(np.abs(V[:,0])/25.0,0,1)
  for _ in range(3):f=(W@f+f)/deg
  m=trimesh.Trimesh(V+N*(a*f)[:,None],m.faces,process=False)
  return m

parts=[l.rstrip('\n').split('\t') for l in open('sel.tsv')]
meshes={}
def add(key,m):meshes.setdefault(key,[]).append(m)
raw=[];area=0;SKULL=[]
for a,k,n in parts:
  if re.search(r"masseter|temporalis|frontalis",n):continue   # owner: no face muscles
  m=trimesh.load(D+a+'.stl');m.merge_vertices()
  # skull, hands and feet show as bone; every other bone sits deep and only shows through gaps -> deep-tissue colour
  OSSO=r"frontal bone|occipital|sphenoid|temporal bone|parietal|zygomatic|nasal bone|maxilla|mandible|lacrimal|ethmoid|vomer|scaphoid|lunate|triquetr|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx|talus|calcaneus|navicular|cuboid|cuneiform|metatarsal|patella|tibia$"
  if k=='b' and re.search(OSSO,n) and not re.search(r"patella|tibia$",n):
    if m.centroid[2]>=1300 and abs(m.centroid[0])<=200:SKULL.append(m)
    continue
  key=('tend' if re.search(r"patella|tibia$|fibula$",n) else 'fundo') if k=='b' else next((v for p,v in MAP if re.search(p,n)),'deco')
  raw.append((key,n,m));area+=m.area if k=='m' else 0
# --- skull (owner 0.15: "caveira mais caprichada, dentes e órbitas sem buracos"): the 14 skull bones + the 28 teeth are
#     voxelised together, gaps under ~6 mm (sutures, fissures at the back of the orbits, between teeth) are closed and the
#     inside is filled, then one smooth surface is taken back out. No cracks, no see-through orbits, closed mouth.
def solid_skull(bones,teeth,pitch=0.9):
  from scipy import ndimage;from skimage import measure
  allv=np.vstack([m.vertices for m in bones+teeth]);lo=allv.min(0)-8;shape=tuple(np.ceil((allv.max(0)+8-lo)/pitch).astype(int)+1)
  ball=lambda r:np.add.outer(np.add.outer(np.arange(-r,r+1)**2,np.arange(-r,r+1)**2),np.arange(-r,r+1)**2)<=r*r
  def vox(ms):
    G=np.zeros(shape,bool)
    for m in ms:
      vg=m.voxelized(pitch)
      try:vg=vg.fill()
      except Exception:pass
      ij=np.round((vg.points-lo)/pitch).astype(int);ok=np.all((ij>=0)&(ij<shape),1);G[tuple(ij[ok].T)]=True
    return G
  B=ndimage.binary_dilation(vox(bones),ball(1));B=ndimage.binary_closing(np.pad(B,4),ball(3))[4:-4,4:-4,4:-4]
  # the eyeballs plug the orbits for a moment, so the braincase can be filled slice by slice (it opens below at the
  # foramen magnum, so a 3D fill would not reach it) without the fill leaking out through the orbits; then they come out
  # again: deep sockets with a bone floor, no see-through holes at the back
  ii=(np.indices(shape).transpose(1,2,3,0)*pitch+lo);E=np.zeros(shape,bool)
  for c,r in EYES:E|=((ii-c)**2).sum(-1)<=(r+1.2)**2
  B0=B.copy();B|=E;F=B.copy()
  for k in range(B.shape[2]):F[:,:,k]=ndimage.binary_fill_holes(B[:,:,k])
  # only behind the eyes: the front of the orbits (and the face) keeps its real shape
  ey=min(c[1] for c,r in EYES)+6;B=B0|(F&(ii[...,1]>ey));B=ndimage.binary_fill_holes(B);B&=~E
  # nasal cavity: filled from ~12 mm behind the opening, so the nose is a shallow hole with a floor
  C=B.copy()
  for j in range(B.shape[1]):C[:,j,:]=ndimage.binary_fill_holes(B[:,j,:])
  ny=NASAL[1]+17;C&=(np.abs(ii[...,0])<13)&(ii[...,1]>ny)&(ii[...,2]>NASAL[2]-30)&(ii[...,2]<NASAL[2]+16);B|=C
  T=ndimage.binary_closing(np.pad(vox(teeth),2),ball(1))[2:-2,2:-2,2:-2]
  F=np.maximum(ndimage.gaussian_filter(B.astype(np.float32),1.0),ndimage.gaussian_filter(T.astype(np.float32),0.55))
  v,f,_,_=measure.marching_cubes(F,0.5);v=v*pitch+lo
  s=trimesh.Trimesh(v,f[:,::-1],process=True)
  s=max(s.split(only_watertight=False),key=lambda q:len(q.faces))
  v,f=fs.simplify(s.vertices.astype(np.float32),s.faces.astype(np.int32),target_reduction=1-20000/len(s.faces));s=trimesh.Trimesh(v,f,process=True)
  trimesh.smoothing.filter_taubin(s,iterations=4);s.fix_normals();return s
EYES=[(b.bounds.mean(0),np.ptp(b.bounds,0).mean()/2) for b in trimesh.load(D+'FMA12513.stl').split(only_watertight=False) if len(b.faces)>500];print('eyes',[(c.round(0),round(r,1)) for c,r in EYES])
_n=[m for m in SKULL if len(m.faces)<1200 and m.centroid[1]<-180]   # the two nasal bones: where the nose opening is
NASAL=np.vstack([m.vertices for m in _n]).mean(0) if _n else np.array([0,-185,1500.]);NASAL[2]-=22
TEETH_IDS="FMA55680 FMA55681 FMA55682 FMA55683 FMA55686 FMA55687 FMA55688 FMA55689 FMA55690 FMA55691 FMA55692 FMA55693 FMA55694 FMA55695 FMA55697 FMA55698 FMA55699 FMA55700 FMA55703 FMA55704 FMA55705 FMA55706 FMA55798 FMA55799 FMA57140 FMA57141 FMA57142 FMA57143".split()
TEETH=[trimesh.load(D+a+'.stl') for a in TEETH_IDS]
SKULL=solid_skull(SKULL,TEETH);print('skull faces',len(SKULL.faces))
# baked shadow (ambient occlusion) as vertex colour: with the light from the front a 3 cm deep orbit looked flat — now the
# orbits, the nose opening and the gaps between the teeth are dark like on a real skull
def ao(S,n=48,maxd=45):
  V=S.vertices;N=S.vertex_normals;d=np.random.default_rng(1).normal(size=(n,3));d/=np.linalg.norm(d,axis=1,keepdims=True)
  occ=np.zeros(len(V));w=np.zeros(len(V))
  for k in range(n):
    D=np.repeat(d[k][None],len(V),0);c=(D*N).sum(1);D[c<0]*=-1;c=np.abs(c);O=V+N*0.6
    loc,ri,_=S.ray.intersects_location(O,D,multiple_hits=False);dist=np.full(len(V),1e9);dist[ri]=np.linalg.norm(loc-O[ri],axis=1)
    occ+=c*(dist<maxd)*(1-dist.clip(0,maxd)/maxd)**0.5;w+=c
  return 1-occ/w
SKULL_AO=np.clip(0.06+1.0*ao(SKULL,maxd=60)**2.6,0,1)
# --- tendons that ran on into the hand and the foot poked through the skin there as dark slivers: anything that is not
#     skin is cut away well inside the hand/foot skin (the top band, where the skin narrows, keeps them)
def inside_skin(c):return ((c[:,2]<818)&(np.abs(c[:,0])>201)&(c[:,2]>540))|(c[:,2]<105)
raw=[(k,n,m if not inside_skin(m.triangles_center).any() else m.submesh([np.where(~inside_skin(m.triangles_center))[0]],append=True)) for k,n,m in raw]
raw=[(k,n,m) for k,n,m in raw if len(m.faces)]
# --- skin only where there is no muscle to show (owner: the skull, bony hands and feet looked odd): head, front of the
#     neck (hides windpipe and spine), hands below the wrist and feet below the ankle. Same grey as the muscles.
SK=trimesh.load(D+'FMA7163.stl');SKc=SK.triangles_center
def crop(mask,name,tgt,taper=None):
  s=SK.submesh([np.where(mask)[0]],append=True);s.merge_vertices()
  if taper:   # the top of the foot skin narrows onto the ankle tendons, so it does not look like a boot
    zt,band,k=taper;V=s.vertices.copy();w=np.clip((V[:,2]-(zt-band))/band,0,1)**1.5
    top=V[V[:,2]>zt-12];c=top[:,:2].mean(0);V[:,:2]=c+(V[:,:2]-c)*(1-k*w)[:,None];s=trimesh.Trimesh(V,s.faces,process=False)
  if len(s.faces)>tgt:
    v,f=fs.simplify(s.vertices.astype(np.float32),s.faces.astype(np.int32),target_reduction=1-tgt/len(s.faces));s=trimesh.Trimesh(v,f,process=True)
  raw.append(('pele',name,s))
x,y,z=SKc[:,0],SKc[:,1],SKc[:,2]

crop((z>1330)&(z<=1437)&(np.abs(x)<44)&(y<-118),"skinneck",700)
for sd,sx in(("right",-1),("left",1)):
  crop((z<872)&(z>560)&(x*sx>201),"skinhand "+sd,6000,(872,70,0.42))
  crop((z<150)&(x*sx>0),"skinfoot "+sd,4500,(150,95,0.5))
# ---- female breasts (owner: "contorno suave", like the 2D): a smooth volume over each pectoral taken from the skin and
#      pushed forward, fuller below; its rim sinks under the muscle, so only a soft outline shows. Not a muscle: it takes
#      the colour of the pectoral part under it and a tap on it is a tap on that part (3d/v3.js, keys "mama_<pec key>").
if FEM:
  N0=SK.vertex_normals
  for sd,sx in(("right",-1),("left",1)):
    cx,cz,rx=92*sx,1195,96
    def r2(X,Z):return ((X-cx)/rx)**2+np.where(Z>cz,(Z-cz)/108,(Z-cz)/74)**2
    mask=(r2(x,z)<1)&(y<-110)
    b=SK.submesh([np.where(mask)[0]],append=True);b.merge_vertices()
    v,f=trimesh.remesh.subdivide_to_size(b.vertices,b.faces,max_edge=2.5);b=trimesh.Trimesh(v,f,process=True)
    # no skin detail (the male nipple showed through): small bumps are smoothed away, the rim stays where it is
    import scipy.sparse as sp
    e=b.edges_unique;n=len(b.vertices);Wm=sp.coo_matrix((np.ones(len(e)*2),(np.r_[e[:,0],e[:,1]],np.r_[e[:,1],e[:,0]])),shape=(n,n)).tocsr()
    dg=np.asarray(Wm.sum(1)).ravel();bd=np.zeros(n,bool)
    be=b.edges_sorted[trimesh.grouping.group_rows(b.edges_sorted,require_count=1)];bd[be.ravel()]=True
    V=b.vertices.copy()
    for _ in range(40):Vn=(Wm@V)/dg[:,None];V[~bd]=Vn[~bd]
    b=trimesh.Trimesh(V,b.faces,process=False);V=b.vertices.copy();nn=b.vertex_normals.copy()
    if (nn[:,1]<0).mean()<0.5:nn=-nn   # outward = forward here
    pr=np.clip(1-r2(V[:,0],V[:,2]),0,1)**1.2
    d=0.5*nn+0.5*np.array([0.1*sx,-1,-0.25]);d/=np.linalg.norm(d,axis=1,keepdims=True)
    V=V+d*(46*pr-14)[:,None];b=trimesh.Trimesh(V,b.faces,process=False)
    trimesh.smoothing.filter_taubin(b,iterations=6)
    if len(b.faces)>5000:
      v,f=fs.simplify(b.vertices.astype(np.float32),b.faces.astype(np.int32),target_reduction=1-5000/len(b.faces));b=trimesh.Trimesh(v,f,process=True)
    raw.append(('mama',"skinbreast "+sd,b))

# ---- A-pose (owner): arms out to ~38 deg (from 11), legs out 6 deg. Bones and muscles of the limb turn rigidly
# around the shoulder / hip joint; muscles that cross the joint (deltoid, pec, lat, teres, infraspinatus, glutes,
# adductors...) turn part of the way, more the closer they are to the limb, so nothing tears at the joint.
def jc(name,fn):
  for k,n,m in raw:
    if n==name:return fn(m.vertices)
SH={s:jc(s+" humerus",lambda v:v[v[:,2]>v[:,2].max()-35].mean(0)) for s in("right","left")}
def hipc(v):t=v[v[:,2]>v[:,2].max()-45];return t[np.argsort(np.abs(t[:,0]))[:len(t)//2]].mean(0)
HP={s:jc(s+" femur",hipc) for s in("right","left")}
ARM_A,LEG_A=np.radians(27),np.radians(2)
ARM_RIGID=r"skinhand|biceps brachii|brachialis|triceps|coracobrachialis|brachioradialis|flexor carpi|palmaris|flexor digitorum superficialis|pronator teres|extensor carpi|extensor digitorum$|extensor digiti minimi|anconeus|humerus|radius|ulna|scaphoid|lunate|triquetr|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal"
ARM_CROSS=r"pectoralis major|latissimus|teres major|teres minor|infraspinatus"
TORSO_ONLY=r"skinbreast|skinhead|skinneck|rectus abdominis|external oblique|hip bone|sacrum|coccyx|vertebra|rib$|sternum|xiphoid|manubrium|serratus|trapezius|scapula|clavicle"
def sstep(a,b,x):t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def rot(V,C,s,phi):
  r=V-C;c,sn=np.cos(phi),np.sin(phi)
  x=r[:,0]*c-r[:,2]*s*sn;z=r[:,0]*s*sn+r[:,2]*c
  return np.c_[x,r[:,1],z]+C
# ---- female (owner 0.15, Wellness): narrower shoulders and neck, thinner arms, wide hips, small waist. Done before the
#      A-pose turn, in the original millimetres: the torso is squeezed in x near the shoulders and widened near the hips;
#      the arm moves in with the shoulder joint and gets thinner around its own axis (hands a little smaller too).
WR={s:jc(s+" radius",lambda v:v[v[:,2]<v[:,2].min()+18].mean(0)) for s in("right","left")}
def fg(z):return 1-0.10*sstep(1150,1300,z)*(1-sstep(1390,1450,z))
def fh(z):   # hip widening: most at the hip joints/trochanters, gone by the waist, a little left at the knee
  up=np.exp(-((z-850)/105.0)**2);dn=(0.25+0.75*np.exp(-((z-850)/230.0)**2))*sstep(240,420,z)
  return np.where(z>=850,up,dn)
def fem(V,arm,n,side,S,H):
  V=V.copy();dS=S[0]*(fg(S[2])-1)
  if (arm>=0.999).all():   # thinner arm: shrink around the shoulder-wrist line
    a=WR[side]-S;a/=np.linalg.norm(a);r=V-S;t=r@a;P=S+t[:,None]*a[None];V=P+(V-P)*0.87
  Va=V+[dS,0,0];Vt=V.copy();Vt[:,0]*=fg(V[:,2])
  V=arm[:,None]*Va+(1-arm[:,None])*Vt
  V[:,0]*=1+0.12*fh(V[:,2])*(1-arm)
  S=S+[dS,0,0];H=H*[1+0.12*fh(np.array([H[2]]))[0],1,1]
  return V,S,H
def pose(m,n):
  V=m.vertices.copy();cz=V.mean(0)
  side="right" if cz[0]<0 else "left";s=-1.0 if side=="right" else 1.0
  S=SH[side];H=HP[side];arm=np.zeros(len(V));leg=np.zeros(len(V))
  if re.search(ARM_RIGID,n) or (re.search("phalanx",n) and cz[2]>500): arm[:]=1
  elif "deltoid" in n: arm[:]=0.45+0.55*sstep(S[2]+40,S[2]-60,V[:,2])
  elif re.search(ARM_CROSS,n):
    d=np.linalg.norm(V-S,axis=1);arm[:]=(1-sstep(25,150,d))*sstep(abs(S[0])-140,abs(S[0])-40,np.abs(V[:,0]))
  elif not re.search(TORSO_ONLY,n) and cz[2]<H[2]+120:
    leg[:]=sstep(H[2]+40,H[2]-90,V[:,2])*sstep(15,70,np.abs(V[:,0]))
  if FEM:V,S,H=fem(V,arm,n,side,S,H)
  if arm.any():
    for w in np.unique(np.round(arm,3)):
      i=np.round(arm,3)==w
      if w>0:V[i]=rot(V[i],S,s,ARM_A*w)
  if leg.any():
    for w in np.unique(np.round(leg,3)):
      i=np.round(leg,3)==w
      if w>0:V[i]=rot(V[i],H,s,LEG_A*w)
  return trimesh.Trimesh(V,m.faces,process=False)
# small waist (Classic Physique): the torso narrows a little around the navel; arms (out in the A-pose) are not touched
def waist(m):
  V=m.vertices.copy();b=np.exp(-((V[:,2]-1020)/85.0)**2)*(1-sstep(150,200,np.abs(V[:,0])))
  V[:,0]*=1-(0.11 if FEM else 0.075)*b;return trimesh.Trimesh(V,m.faces,process=False)
BUDGET_M=int(sys.argv[1]) if len(sys.argv)>1 else 170000;BUDGET_B=int(sys.argv[2]) if len(sys.argv)>2 else 45000
barea=sum(m.area for k,n,m in raw if k in('osso','fundo'))
for key,n,m in raw:
  if key in('pele','mama'):
    m=pose(m,n);v=m.vertices;m=trimesh.Trimesh(np.c_[v[:,0],v[:,2],-v[:,1]]/1000.0,m.faces,process=False);add(key,m);continue
  share=(BUDGET_B*m.area/barea) if key in('osso','fundo') else (BUDGET_M*m.area/area)
  tgt=max(120 if key in('osso','fundo') else 400,int(share))
  if len(m.faces)>tgt:
    v,f=fs.simplify(m.vertices.astype(np.float32),m.faces.astype(np.int32),target_reduction=1-tgt/len(m.faces))
    m=trimesh.Trimesh(v,f,process=True)
  m=pose(m,n)
  if key not in('osso','fundo','tend'): m=inflate(m,key,n)
  m=waist(m)
  # mm z-up -> m y-up, front +Z
  v=m.vertices; m=trimesh.Trimesh(np.c_[v[:,0],v[:,2],-v[:,1]]/1000.0,m.faces,process=False)
  if key in("DORSAL","ABDOMEN"):
    c=m.triangles_center[:,1];
    if key=="DORSAL": cut=np.percentile(c,45); lo,hi="dorsal_inferior","dorsal_superior"
    else: ymin,ymax=c.min(),c.max(); cut=ymin+0.45*(ymax-ymin); lo,hi="abdomen_infra","abdomen_supra"
    for nm,mask in((hi,c>=cut),(lo,c<cut)):
      s=m.submesh([np.where(mask)[0]],append=True);add(nm,s)
  else: add(key,m)
v=SKULL.vertices;_s=trimesh.Trimesh(np.c_[v[:,0],v[:,2],-v[:,1]]/1000.0,SKULL.faces,process=False)
_g=(SKULL_AO*255).astype(np.uint8);_s.visual=trimesh.visual.ColorVisuals(_s,vertex_colors=np.c_[_g,_g,_g,np.full(len(_g),255,np.uint8)]);add('osso',_s)
if "mama" in meshes:   # each bit of the breast belongs to the pectoral part right under it
  from scipy.spatial import cKDTree
  pk=[k for k in("peito_superior","peito_medial","peito_inferior") if k in meshes];PV=[trimesh.util.concatenate(meshes[k]).vertices for k in pk]
  lab=np.concatenate([np.full(len(p),i) for i,p in enumerate(PV)]);M=trimesh.util.concatenate(meshes.pop("mama"))
  fl=lab[cKDTree(np.vstack(PV)).query(M.triangles_center)[1]]
  for i,k in enumerate(pk):
    sel=np.where(fl==i)[0]
    if len(sel):meshes["mama_"+k]=[M.submesh([sel],append=True)]
if "obliquos" in meshes and "abdomen_supra" in meshes:
  ra=trimesh.util.concatenate(meshes["abdomen_supra"]+meshes["abdomen_infra"]);lim=np.abs(ra.vertices[:,0]).max()*1.02
  ylo,yhi=ra.vertices[:,1].min(),ra.vertices[:,1].max()
  out=[]
  # the oblique tucks under the edge of the rectus at every height and side (one straight limit for the whole height left a
  # jagged dark gap along one side of the abs)
  RV=ra.vertices;yb=np.arange(ylo,yhi+0.01,0.01)
  def edge(sgn):
    e=np.array([np.abs(RV[(np.sign(RV[:,0])==sgn)&(np.abs(RV[:,1]-y0)<0.015),0]).max(initial=0) for y0 in yb])
    return np.maximum.accumulate(e*0)+np.convolve(np.pad(e,2,mode='edge'),np.ones(5)/5,'valid')
  ED={1:edge(1),-1:edge(-1)}
  for o in meshes["obliquos"]:
    c=o.triangles_center;sg=np.where(c[:,0]>=0,1,-1);ix=np.clip(np.round((c[:,1]-ylo)/0.01).astype(int),0,len(yb)-1)
    lim2=np.where(sg>0,ED[1][ix],ED[-1][ix])-0.008
    keep=~((np.abs(c[:,0])<lim2)&(c[:,1]>ylo)&(c[:,1]<yhi)&(c[:,2]>0))
    out.append(o.submesh([np.where(keep)[0]],append=True))
  meshes["obliquos"]=out
FAN=("peito","ombro","dorsal","trapezio","gluteo","infraespinhal","redondo")
def fiber_uv(m,fan):
  V=m.vertices;c=V.mean(0);_,_,vt=np.linalg.svd(V-c,full_matrices=False);P=(V-c)@vt.T;a,b,cc=P[:,0],P[:,1],P[:,2]
  if fan:
    lo,hi=a<np.quantile(a,.12),a>np.quantile(a,.88)
    end=lo if b[lo].std()<b[hi].std() else hi;ia=a[end].mean()+(-0.02 if end is lo else 0.02);ib=b[end].mean()
    dx,dy=a-ia,b-ib;r=np.hypot(dx,dy);th=np.arctan2(dy,np.abs(dx));u=th*np.median(r);v=r
  else:
    th=np.arctan2(cc,b);ra=np.median(np.hypot(b,cc));n=max(4,round(2*np.pi*ra/0.006));u=th/(2*np.pi)*n*0.006;v=a
  return np.c_[u-u.min()+0.01,v-v.min()+0.01]/1.0
for key,L in meshes.items():
  for q in L:
    if key in("osso","fundo","base","pele","tend") or key.startswith("mama"):continue
    q.visual=trimesh.visual.TextureVisuals(uv=fiber_uv(q,key.startswith(FAN)))
sc=trimesh.Scene();allv=[]
for key,L in meshes.items():
  mm=trimesh.util.concatenate(L);allv.append(mm.vertices)
allv=np.vstack(allv);ctr=(allv.min(0)+allv.max(0))/2;ctr[1]=allv.min(0)[1]
tot=0
for key,L in meshes.items():
  mm=trimesh.util.concatenate(L);mm.vertices-=ctr;tot+=len(mm.faces)
  _=mm.vertex_normals
  sc.add_geometry(mm,node_name=key,geom_name=key)
# ---- joints for the Articulações mode (3D): one point per joint and side, posed like the body, in the same metres/axes
import json
IDS={n:a for a,k,n in (l.rstrip("\n").split("\t") for l in open("sel.tsv"))}
def bone(n):return trimesh.load(D+IDS[n]+".stl").vertices
def J(p,n):
  m=trimesh.Trimesh(np.array([p,p+[1,0,0],p+[0,1,0]],float),[[0,1,2]],process=False);q=pose(m,n).vertices[0]
  return [round(q[0]/1000,4),round(q[2]/1000,4),round(-q[1]/1000,4)]
mid=lambda *ns:np.vstack([bone(n) for n in ns]).mean(0)
JT={"pescoco":[J(mid("fourth cervical vertebra","fifth cervical vertebra"),"vertebra")],
  "toracica":[J(mid("sixth thoracic vertebra","seventh thoracic vertebra"),"vertebra")],
  "lombar":[J(mid("third lumbar vertebra","fourth lumbar vertebra"),"vertebra")]}
for sd in("right","left"):
  hu=bone(sd+" humerus");ra=np.vstack([bone(sd+" radius"),bone(sd+" ulna")]);fe=bone(sd+" femur");ti=bone(sd+" tibia")
  JT.setdefault("ombro",[]).append(J(SH[sd],"x"))
  JT.setdefault("cotovelo",[]).append(J(hu[hu[:,2]<hu[:,2].min()+25].mean(0),"humerus"))
  JT.setdefault("punho",[]).append(J(ra[ra[:,2]<ra[:,2].min()+18].mean(0),"radius"))
  JT.setdefault("quadril",[]).append(J(HP[sd],"x"))
  JT.setdefault("joelho",[]).append(J((fe[fe[:,2]<fe[:,2].min()+25].mean(0)+ti[ti[:,2]>ti[:,2].max()-25].mean(0))/2,"joint"))
  JT.setdefault("tornozelo",[]).append(J(bone(sd+" talus").mean(0),"joint"))
OUT="corpo-f" if FEM else "corpo"
json.dump(JT,open(OUT.replace("corpo","juntas")+".json","w"),separators=(",",":"));print("juntas",{k:len(v) for k,v in JT.items()})
open(OUT+".glb","wb").write(trimesh.exchange.gltf.export_glb(sc,include_normals=True));print('faces',tot,'nodes',len(meshes),'height',allv.max(0)[1]-allv.min(0)[1])
