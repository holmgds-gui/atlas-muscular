# Muscle Atlas 3D body (3d/corpo-N.glb). BodyParts3D (DBCLS, CC BY-SA 2.1 JP) -> muscles grouped by the Atlas keys,
# A-pose, inflated to a Classic Physique build (owner, nov/2026), skin only on head, hands and feet.
# Needs: pip install trimesh fast_simplification scipy ; the BodyParts3D STL folder in BP3D_STL ; sel.tsv next to this file.
# Run:  BP3D_STL=/path/to/stl/ python3 build.py  ->  corpo.glb ; then  npx @gltf-transform/cli quantize corpo.glb ../../3d/corpo-N.glb
import trimesh, numpy as np, fast_simplification as fs, re, sys, os
D=os.environ.get("BP3D_STL","/home/claude/kevin-mattheus-moerman/bodyparts3d/assets/BodyParts3D_data/stl/")
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
 "serratil":8,"ABDOMEN":7,"obliquos":1,"gluteo":12,"abdutores":7,"adutores":18,"quad_vasto_lateral":24,"quad_vasto_medial":22,"quad":15,"isquio":15,
 "panturrilha_gastro":2,"panturrilha_soleo":9}
# where along the muscle (0 = lowest point, 1 = highest) the bulge peaks, and how wide it is: the outer quad "sweep" sits
# low-mid, the inner quad "teardrop" just above the knee, the calf high (diamond, not a ball at the ankle)
PEAK={"quad_vasto_lateral":(0.42,0.32),"quad_vasto_medial":(0.16,0.17),"quad_reto_femoral":(0.5,0.35),"panturrilha_gastro":(0.62,0.22),
 "panturrilha_soleo":(0.35,0.3),"isquio":(0.55,0.3),"adutores":(0.7,0.3)}
def inflate(m,key,name):
  a=next((v for k,v in INF.items() if key.startswith(k)),0)
  if key=="deco":  # shin and front-of-thigh muscles fill out too, so the lower leg is not thin next to the calves
    a=next((v for k,v in (("tibialis anterior",8),("fibularis",7),("extensor digitorum longus",6),("sartorius",5)) if k in name),0)
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
raw=[];area=0
for a,k,n in parts:
  if re.search(r"masseter|temporalis|frontalis",n):continue   # owner: no face muscles
  m=trimesh.load(D+a+'.stl');m.merge_vertices()
  # skull, hands and feet show as bone; every other bone sits deep and only shows through gaps -> deep-tissue colour
  OSSO=r"frontal bone|occipital|sphenoid|temporal bone|parietal|zygomatic|nasal bone|maxilla|mandible|lacrimal|ethmoid|vomer|scaphoid|lunate|triquetr|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx|talus|calcaneus|navicular|cuboid|cuneiform|metatarsal|patella|tibia$"
  if k=='b' and re.search(OSSO,n) and not re.search(r"patella|tibia$",n):continue
  key=('tend' if re.search(r"patella|tibia$|fibula$",n) else 'fundo') if k=='b' else next((v for p,v in MAP if re.search(p,n)),'deco')
  raw.append((key,n,m));area+=m.area if k=='m' else 0
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
crop((z>1437)|((z>1392)&(y>-70)),"skinhead",9000)   # and the back of the neck up under the skull
crop((z>1330)&(z<=1437)&(np.abs(x)<44)&(y<-118),"skinneck",700)
for sd,sx in(("right",-1),("left",1)):
  wc=np.array([sx*250,-88,816.0]);crop((np.linalg.norm(SKc-wc,axis=1)<150)&(z<824)&(x*sx>197),"skinhand "+sd,2600)
  crop((z<100)&(x*sx>0),"skinfoot "+sd,2600,(100,60,0.36))

# ---- A-pose (owner): arms out to ~38 deg (from 11), legs out 6 deg. Bones and muscles of the limb turn rigidly
# around the shoulder / hip joint; muscles that cross the joint (deltoid, pec, lat, teres, infraspinatus, glutes,
# adductors...) turn part of the way, more the closer they are to the limb, so nothing tears at the joint.
def jc(name,fn):
  for k,n,m in raw:
    if n==name:return fn(m.vertices)
SH={s:jc(s+" humerus",lambda v:v[v[:,2]>v[:,2].max()-35].mean(0)) for s in("right","left")}
def hipc(v):t=v[v[:,2]>v[:,2].max()-45];return t[np.argsort(np.abs(t[:,0]))[:len(t)//2]].mean(0)
HP={s:jc(s+" femur",hipc) for s in("right","left")}
ARM_A,LEG_A=np.radians(27),np.radians(6)
ARM_RIGID=r"skinhand|biceps brachii|brachialis|triceps|coracobrachialis|brachioradialis|flexor carpi|palmaris|flexor digitorum superficialis|pronator teres|extensor carpi|extensor digitorum$|extensor digiti minimi|anconeus|humerus|radius|ulna|scaphoid|lunate|triquetr|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal"
ARM_CROSS=r"pectoralis major|latissimus|teres major|teres minor|infraspinatus"
TORSO_ONLY=r"skinhead|skinneck|rectus abdominis|external oblique|hip bone|sacrum|coccyx|vertebra|rib$|sternum|xiphoid|manubrium|serratus|trapezius|scapula|clavicle"
def sstep(a,b,x):t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def rot(V,C,s,phi):
  r=V-C;c,sn=np.cos(phi),np.sin(phi)
  x=r[:,0]*c-r[:,2]*s*sn;z=r[:,0]*s*sn+r[:,2]*c
  return np.c_[x,r[:,1],z]+C
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
  V[:,0]*=1-0.075*b;return trimesh.Trimesh(V,m.faces,process=False)
BUDGET_M=int(sys.argv[1]) if len(sys.argv)>1 else 170000;BUDGET_B=int(sys.argv[2]) if len(sys.argv)>2 else 45000
barea=sum(m.area for k,n,m in raw if k in('osso','fundo'))
for key,n,m in raw:
  if key=='pele':
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
if "obliquos" in meshes and "abdomen_supra" in meshes:
  ra=trimesh.util.concatenate(meshes["abdomen_supra"]+meshes["abdomen_infra"]);lim=np.abs(ra.vertices[:,0]).max()*1.02
  ylo,yhi=ra.vertices[:,1].min(),ra.vertices[:,1].max()
  out=[]
  for o in meshes["obliquos"]:
    c=o.triangles_center;keep=~((np.abs(c[:,0])<lim)&(c[:,1]>ylo)&(c[:,1]<yhi)&(c[:,2]>0))
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
    if key in("osso","fundo","base","pele","tend"):continue
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
open("corpo.glb","wb").write(trimesh.exchange.gltf.export_glb(sc,include_normals=True));print('faces',tot,'nodes',len(meshes),'height',allv.max(0)[1]-allv.min(0)[1])
