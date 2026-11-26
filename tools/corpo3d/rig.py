# Muscle Atlas — articulações do esqueleto 3D (etapa 1 da animação, 0.68; pedido do dono: "faça a etapa 1, siga a
# anatomia do corpo humano e faça bem feito").
#
# Recebe os ossos já na pose do app (milímetros, z para cima, frente = -y, esquerda = +x; depois de pose()/waist() do
# build.py, e do fem_bone() no corpo feminino) e devolve:
#   seg_of(nome do osso)  -> o segmento (peça rígida) a que o osso pertence
#   joints                -> para cada articulação: pai, centro de giro, eixos de cada movimento, amplitude (ROM),
#                            ângulo de repouso (quanto a pose A do modelo já está dobrada naquele movimento)
#   couplings             -> movimentos que acompanham outros (ritmo escapuloumeral, patela, "screw-home" do joelho)
# Os centros e eixos saem da forma dos próprios ossos (o mesmo banco de anatomia dos músculos), seguindo os métodos
# usados em biomecânica (ISB — Wu et al. 2002/2005; Inman 1976; White & Panjabi 1990):
#   - quadril e ombro (glenoumeral): centro = esfera ajustada à cabeça do fêmur / do úmero;
#   - cotovelo: eixo pelos epicôndilos do úmero, centro no meio do bloco tróclea–capítulo;
#   - joelho: eixo transepicondilar do fêmur, centro no meio dos epicôndilos;
#   - tornozelo (talocrural): eixo pelas pontas dos maléolos, 5 mm abaixo (Inman);
#   - subtalar: eixo oblíquo, 42° acima do plano do pé e 23° para medial do eixo longo do pé (média de Inman);
#   - antebraço (pronação/supinação): eixo da cabeça do rádio à cabeça da ulna;
#   - punho: centro na cabeça do capitato, flexão em torno da linha entre os processos estiloides;
#   - dedos (mãos e pés): centro = esfera ajustada à cabeça do osso de cima (metacarpo/metatarso/falange);
#     dedos dos pés dobram em torno da linha das cabeças dos metatarsos (a "quebra metatarsal");
#   - coluna: um centro por nível, no disco intervertebral, um pouco para trás e para baixo (o eixo instantâneo de
#     rotação fica na metade de trás do disco); C1–C2 gira em torno do dente do áxis; a cabeça acena sobre o atlas;
#   - cintura escapular: esternoclavicular na ponta medial da clavícula, acromioclavicular na ponta lateral.
# Amplitudes (graus, a partir da posição anatômica): AAOS / American Academy of Orthopaedic Surgeons (Greene &
# Heckman 1994) para os membros, White & Panjabi para cada nível da coluna.
import numpy as np, re

UP=np.array([0.,0,1]);FRONT=np.array([0.,-1,0]);BACK=-FRONT;DOWN=-UP
def nz(v):v=np.asarray(v,float);n=np.linalg.norm(v);return v/n if n>1e-9 else v
def perp(v,a):a=nz(a);return nz(v-(v@a)*a)
def sphere_fit(P):
  A=np.c_[2*P,np.ones(len(P))];b=(P**2).sum(1);c=np.linalg.lstsq(A,b,rcond=None)[0];C=c[:3];return C,float(np.sqrt(max(c[3]+C@C,1e-6)))
def sphere_refit(P,it=3,tol=3.0):
  C,r=sphere_fit(P)
  for _ in range(it):
    d=np.abs(np.linalg.norm(P-C,axis=1)-r);k=d<max(tol,np.percentile(d,60))
    if k.sum()<12:break
    C,r=sphere_fit(P[k])
  return C,r
def long_axis(V,toward=None):
  c=V.mean(0);_,_,vt=np.linalg.svd(V-c,full_matrices=False);a=vt[0]
  if toward is not None and a@(toward-c)<0:a=-a
  return c,nz(a)
def ang(a,b):return float(np.degrees(np.arccos(np.clip(nz(a)@nz(b),-1,1))))
def pang(a,b,axis):
  """angle between a and b seen along axis (only the part of the bend that this joint makes)"""
  return ang(perp(a,axis),perp(b,axis))
def signed_axis(axis,d,t):
  """axis oriented so that a positive turn moves direction d toward t (right-hand rule)"""
  axis=nz(axis);return axis if np.cross(axis,d)@t>=0 else -axis

SIDES=(("right",-1,"d"),("left",1,"e"))
ORD=["first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth","eleventh","twelfth"]
FING={2:"index finger",3:"middle finger",4:"ring finger",5:"little finger"}
TOES={1:"big toe",2:"second toe",3:"third toe",4:"fourth toe",5:"little toe"}
NM_PT={"pelve":"Pelve (raiz)","cabeca":"Cabeça (atlanto-occipital)","C1":"Atlas / áxis (C1–C2)","esc":"Escápula (acromioclavicular)",
  "cla":"Clavícula (esternoclavicular)","ombro":"Ombro (glenoumeral)","cotovelo":"Cotovelo","antebraco":"Antebraço (radioulnar)",
  "punho":"Punho","quadril":"Quadril","joelho":"Joelho","patela":"Patela","tornozelo":"Tornozelo (talocrural)","subtalar":"Subtalar",
  "cmc1":"Polegar — carpometacarpal","mcf1":"Polegar — metacarpofalângica","if1":"Polegar — interfalângica",
  "mtf1":"Hálux — metatarsofalângica","ifh":"Hálux — interfalângica"}

def seg_of(n):
  """the rigid piece (segment) that carries this bone; a segment is named after the joint that moves it"""
  sd=next((c for s,_,c in SIDES if re.search(r"\b"+s+r"\b",n)),None)
  m=re.search(r"(\w+) (cervical|thoracic|lumbar) vertebra$",n)
  if n.startswith("intervertebral disk of"):   # a disc goes with the vertebra below it
    if "axis" in n:return "C3"
    k=ORD.index(re.search(r"of (\w+) ",n).group(1))+1;reg=re.search(r"(cervical|thoracic|lumbar)",n).group(1)
    nxt={"cervical":("C",7,"T"),"thoracic":("T",12,"L"),"lumbar":("L",5,None)}[reg]
    if k<nxt[1]:return f"{nxt[0]}{k+1}"
    return f"{nxt[2]}1" if nxt[2] else "pelve"
  if m:return {"cervical":"C","thoracic":"T","lumbar":"L"}[m.group(2)]+str(ORD.index(m.group(1))+1)
  if n=="atlas":return "C1"
  if n=="axis":return "C2"
  if n=="hyoid bone":return "C3"
  if re.search(r"hip bone|sacrum",n):return "pelve"
  if re.search(r"manubrium|body of sternum|xiphoid|costal cartilage",n):return "T4"
  m=re.search(r"(\w+) rib$",n)
  if m:return "T"+str(ORD.index(m.group(1))+1)
  if re.search(r"clavicle",n):return "cla_"+sd
  if re.search(r"scapula",n):return "esc_"+sd
  if re.search(r"humerus",n):return "ombro_"+sd
  if re.search(r"ulna",n):return "cotovelo_"+sd
  if re.search(r"radius",n):return "antebraco_"+sd
  if re.search(r"scaphoid|lunate|triquetr|pisiform|trapezium|trapezoid|capitate|hamate",n) or re.search(r"(second|third|fourth|fifth) metacarpal",n):return "punho_"+sd
  if re.search(r"first metacarpal",n):return "cmc1_"+sd
  if re.search(r"phalanx of \w+ thumb",n):return ("mcf1_" if n.startswith("proximal") else "if1_")+sd
  for k,f in FING.items():
    if f in n:return {"proximal":"mcf","middle":"ifp","distal":"ifd"}[n.split()[0]]+f"{k}_"+sd
  if re.search(r"femur",n):return "quadril_"+sd
  if re.search(r"patella",n):return "patela_"+sd
  if re.search(r"tibia|fibula",n):return "joelho_"+sd
  if re.search(r"talus",n):return "tornozelo_"+sd
  if re.search(r"calcaneus|navicular|cuboid|cuneiform|metatarsal|sesamoid bone of",n):return "subtalar_"+sd
  for k,t in TOES.items():
    if t in n:
      if k==1:return ("mtf1_" if n.startswith("proximal") else "ifh_")+sd
      return {"proximal":"mtf","middle":"ifpp","distal":"ifdp"}[n.split()[0]]+f"{k}_"+sd
  return None

def build(posed,skull,to_app,dir_app):
  """posed: {bone name: posed trimesh (mm)}; skull: the posed solid skull; to_app/dir_app: point/direction → app metres"""
  V=lambda n:posed[n].vertices
  J={};CP=[]
  def add(jid,parent,center,dofs,name=None):
    J[jid]={"pai":parent,"centro":[round(x,5) for x in to_app(center)],"nome":name or jid,"mov":dofs}
  def dof(key,axis,rom,rest=0.0,nome=None):
    return {"id":key,"eixo":[round(x,5) for x in dir_app(nz(axis))],"min":rom[0],"max":rom[1],"repouso":round(float(rest),1),**({"nome":nome} if nome else {})}
  # ---- spine: one joint per level, in the disc, a little back and down (instantaneous axis of rotation)
  def body_c(n):return V(n).mean(0)
  def disc_center(disc,lower):
    D=V(disc);c=D.mean(0);dz=np.ptp(D@UP);dy=np.ptp(D@FRONT)
    return c+BACK*0.18*dy+DOWN*0.25*dz
  # White & Panjabi (representative values per level): flexion, extension, lateral bending (each side), axial rotation (each side)
  ROMC={"C2":(5,5,10,3),"C3":(7,6,11,7),"C4":(8,9,11,7),"C5":(10,10,8,7),"C6":(10,10,7,6),"C7":(5,4,4,2)}
  ROMT={1:(2,2,6,9),2:(2,2,6,8),3:(2,2,6,8),4:(2,2,6,8),5:(2,2,6,8),6:(2,2,6,8),7:(2,2,6,8),8:(3,3,6,7),9:(3,3,6,4),10:(3,3,6,2),11:(5,4,9,2),12:(6,4,8,2)}
  ROML={1:(8,5,6,1),2:(10,3,6,1),3:(10,3,8,1),4:(12,4,6,1),5:(13,7,3,1)}
  chain=[("L",5,"pelve")]+[("L",k,f"L{k+1}") for k in range(4,0,-1)]+[("T",12,"L1")]+[("T",k,f"T{k+1}") for k in range(11,0,-1)]+[("C",7,"T1")]+[("C",k,f"C{k+1}") for k in range(6,1,-1)]
  regn={"C":"cervical","T":"thoracic","L":"lumbar"}
  for r,k,par in chain:
    me=f"{r}{k}";name=f"{ORD[k-1]} {regn[r]} vertebra" if not (r=="C" and k==2) else "axis"
    disc=f"intervertebral disk of {ORD[k-1]} {regn[r]} vertebra" if not (r=="C" and k==2) else "intervertebral disk of axis"
    lowern={"pelve":"sacrum"}.get(par) or (f"{ORD[int(par[1:])-1]} {regn[par[0]]} vertebra")
    c=disc_center(disc,lowern) if disc in posed else (body_c(name)+body_c(lowern))/2
    up=nz(body_c(name)-body_c(lowern));lat=perp(np.array([1.,0,0]),up);ap=nz(np.cross(up,lat))
    f,e,l,rt={"C":ROMC,"T":ROMT,"L":ROML}[r][me if r=="C" else k]
    add(me,par if par!="pelve" else "pelve",c,[
      dof("flex",signed_axis(lat,up,FRONT),[-e,f],nome="flexão (+) / extensão (−)"),
      dof("incl",signed_axis(ap,up,np.array([1.,0,0])),[-l,l],nome="inclinação para a esquerda (+) / direita (−)"),
      dof("rot",signed_axis(up,FRONT,np.array([1.,0,0])),[-rt,rt],nome="rotação para a esquerda (+) / direita (−)")],f"{me}/{par if par!='pelve' else 'S1'}")
  # C1–C2: rotation around the dens of the axis
  A=V("axis");top=A[A@UP>(A@UP).max()-12];dens=top[np.abs(top[:,0]-A[:,0].mean())<9];dc=dens.mean(0) if len(dens)>5 else top.mean(0)
  dax=nz(dc-body_c("axis"))
  add("C1","C2",dc-dax*6,[dof("flex",signed_axis(perp(np.array([1.,0,0]),dax),dax,FRONT),[-10,5]),dof("incl",signed_axis(np.cross(dax,perp(np.array([1.,0,0]),dax)),dax,np.array([1.,0,0])),[-3,3]),
    dof("rot",signed_axis(dax,FRONT,np.array([1.,0,0])),[-40,40])],"Atlas sobre o áxis (C1–C2)")
  # head on the atlas (occipital condyles on the superior facets of the atlas)
  At=V("atlas");hi=At[At@UP>(At@UP).max()-7];fac=hi[np.abs(hi[:,0]-At[:,0].mean())>9];oc=fac.mean(0) if len(fac)>5 else hi.mean(0)
  add("cabeca","C1",oc,[dof("flex",signed_axis(np.array([1.,0,0]),UP,FRONT),[-15,10]),dof("incl",signed_axis(FRONT,UP,np.array([1.,0,0])),[-5,5]),dof("rot",signed_axis(UP,FRONT,np.array([1.,0,0])),[-5,5])],"Cabeça sobre o atlas (C0–C1)")
  rest={}
  for side,sg,s in SIDES:
    LAT=np.array([sg,0.,0]);MED=-LAT
    # ---- shoulder girdle: sternoclavicular at the medial end of the clavicle, acromioclavicular at its lateral end
    Cl=V(f"{side} clavicle");cx=Cl@LAT;med_end=Cl[cx<cx.min()+8].mean(0);lat_end=Cl[cx>cx.max()-8].mean(0);cd=nz(lat_end-med_end)
    add(f"cla_{s}","T4",med_end,[
      dof("elev",signed_axis(np.cross(cd,UP),cd,UP),[-10,45],nome="elevação (+) / depressão (−)"),
      dof("prot",signed_axis(UP,cd,FRONT),[-25,30],nome="protração (+) / retração (−)"),
      dof("rot",signed_axis(cd,UP,BACK),[0,45],nome="rotação posterior")],f"Esternoclavicular {'direita' if s=='d' else 'esquerda'}")
    Sc=V(f"{side} scapula");inf=Sc[np.argmin(Sc@UP)];medb=Sc[np.argmin(Sc@LAT)]
    di=nz(inf-lat_end)
    add(f"esc_{s}",f"cla_{s}",lat_end,[
      dof("rot_sup",signed_axis(np.cross(di,FRONT),di,LAT),[-10,30],nome="rotação superior (+) / inferior (−)"),
      dof("rot_int",signed_axis(UP,nz(medb-lat_end),BACK),[-10,15],nome="rotação interna (+) / externa (−)"),
      dof("incl_post",signed_axis(np.cross(di,LAT),di,FRONT),[-10,25],nome="inclinação posterior (+) / anterior (−)")],f"Acromioclavicular {'direita' if s=='d' else 'esquerda'}")
    # ---- glenohumeral: sphere on the humeral head
    Hu=V(f"{side} humerus");hc0,ha=long_axis(Hu,toward=Hu[np.argmax(Hu@UP)]);t=(Hu-hc0)@ha
    top=Hu[t>t.max()-48];P=hc0+np.outer((top-hc0)@ha,ha);rad=top-P;mm=perp(MED,ha)
    head=top[(rad@mm)>0.25*np.linalg.norm(rad,axis=1)]
    ghc,ghr=sphere_refit(head)
    lo=Hu[t<t.min()+50];lx=lo@perp(LAT,ha);EL=lo[np.argmax(lx)];EM=lo[np.argmin(lx)]   # epicondyles: extremes across the humerus (the arm is out in the A-pose)
    blk=Hu[t<t.min()+18];elc=blk.mean(0)
    hd=nz(elc-ghc)
    rest_abd=np.degrees(np.arctan2(hd@LAT,-(hd@UP)));rest_flex=np.degrees(np.arctan2(hd@FRONT,-(hd@UP)))
    add(f"ombro_{s}",f"esc_{s}",ghc,[
      dof("flex",signed_axis(LAT,DOWN,FRONT),[-60,180],rest_flex,"flexão (+) / extensão (−)"),
      dof("abd",signed_axis(FRONT,DOWN,LAT),[-30,180],rest_abd,"abdução (+) / adução (−)"),
      dof("rot",signed_axis(hd,FRONT,MED),[-90,70],0,"rotação interna (+) / externa (−)")],f"Ombro {'direito' if s=='d' else 'esquerdo'} (glenoumeral, raio da cabeça {ghr:.0f} mm)")
    # ---- elbow: epicondyles; centre in the trochlea–capitulum block
    Ul=V(f"{side} ulna");Ra=V(f"{side} radius")
    fa_c,fa=long_axis(np.vstack([Ul,Ra]),toward=elc);fd=-fa   # forearm direction, from the elbow to the wrist
    eax=nz(EM-EL)
    rest_el=pang(hd,fd,eax)   # the carrying angle (valgus) is not flexion
    add(f"cotovelo_{s}",f"ombro_{s}",elc,[dof("flex",signed_axis(eax,fd,FRONT),[0,150],rest_el,"flexão")],f"Cotovelo {'direito' if s=='d' else 'esquerdo'}")
    # ---- forearm rotation: radial head → ulnar head
    tr=(Ra-fa_c)@fa;rh=Ra[tr>tr.max()-9].mean(0);tu=(Ul-fa_c)@fa;uh=Ul[tu<tu.min()+14].mean(0)
    pax=nz(uh-rh)
    # the model stands in the anatomical position (palms forward) = full supination; 0 = neutral (thumb forward)
    add(f"antebraco_{s}",f"cotovelo_{s}",rh,[dof("pron",signed_axis(pax,FRONT,MED),[-80,80],-80,"pronação (+) / supinação (−)")],f"Antebraço {'direito' if s=='d' else 'esquerdo'} (radioulnar)")
    # ---- wrist: head of the capitate; flexion around the line through the styloid processes
    Cp=V(f"{side} capitate");cpt=(Cp-Cp.mean(0))@fd;cap=Cp[cpt<np.percentile(cpt,40)].mean(0)
    rs=Ra[np.argmax((Ra-fa_c)@fd)];us=Ul[np.argmax((Ul-fa_c)@fd)];wax=nz(us-rs)
    add(f"punho_{s}",f"antebraco_{s}",cap,[dof("flex",signed_axis(wax,fd,FRONT),[-70,80],0,"flexão (+) / extensão (−)"),
      dof("desv",signed_axis(np.cross(fd,wax),fd,MED),[-20,30],0,"desvio ulnar (+) / radial (−)")],f"Punho {'direito' if s=='d' else 'esquerdo'}")
    # ---- fingers 2–5: heads of the metacarpals / phalanges
    MCh={}
    for k in (2,3,4,5):
      mc=V(f"{side} {ORD[k-1]} metacarpal bone");c0,a0=long_axis(mc,toward=mc.mean(0)+fd*50);tt=(mc-c0)@a0
      hc,hr=sphere_refit(mc[tt>tt.max()-11]);MCh[k]=hc
    hand_ml=nz(MCh[5]-MCh[2])
    for k,f in FING.items():
      pp=V(f"proximal phalanx of {side} {f}");mp=V(f"middle phalanx of {side} {f}");dp=V(f"distal phalanx of {side} {f}")
      def head(B,dirn):c0,a0=long_axis(B,toward=B.mean(0)+dirn*30);tt=(B-c0)@a0;return sphere_refit(B[tt>tt.max()-7])[0]
      fdir=nz(dp.mean(0)-MCh[k]);pip=head(pp,fdir);dip=head(mp,fdir)
      for jid,par,c,d,rom,nm in ((f"mcf{k}_{s}",f"punho_{s}",MCh[k],nz(pp.mean(0)-MCh[k]),[-30,90],"MCF"),(f"ifp{k}_{s}",f"mcf{k}_{s}",pip,nz(mp.mean(0)-pip),[0,100],"IFP"),(f"ifd{k}_{s}",f"ifp{k}_{s}",dip,nz(dp.mean(0)-dip),[-10,80],"IFD")):
        dofs=[dof("flex",signed_axis(perp(hand_ml,d),d,FRONT),rom,0,"flexão")]
        if nm=="MCF":dofs.append(dof("abd",signed_axis(np.cross(d,perp(hand_ml,d)),d,hand_ml*(1 if k>=3 else -1)),[-20,20],0,"abdução (afasta do dedo médio)"))
        add(jid,par,c,dofs,f"Dedo {k} {nm} {'direito' if s=='d' else 'esquerdo'}")
    # ---- thumb: CMC (saddle, base of the 1st metacarpal), MCP, IP
    m1=V(f"{side} first metacarpal bone");c1,a1=long_axis(m1,toward=m1.mean(0)+fd*40);t1=(m1-c1)@a1
    base=m1[t1<t1.min()+7].mean(0);mh=sphere_refit(m1[t1>t1.max()-10])[0]
    tp=V(f"proximal phalanx of {side} thumb");td=V(f"distal phalanx of {side} thumb");c2,a2=long_axis(tp,toward=td.mean(0));t2=(tp-c2)@a2;ip=sphere_refit(tp[t2>t2.max()-7])[0]
    d1=nz(mh-base)
    add(f"cmc1_{s}",f"punho_{s}",base,[dof("flex",signed_axis(np.cross(d1,FRONT),d1,MED),[-20,15],0,"flexão (atravessa a palma) / extensão"),
      dof("abd",signed_axis(np.cross(d1,MED),d1,FRONT),[0,70],0,"abdução palmar (afasta da palma)")],f"Polegar CMC {'direito' if s=='d' else 'esquerdo'}")
    d2=nz(tp.mean(0)-mh);add(f"mcf1_{s}",f"cmc1_{s}",mh,[dof("flex",signed_axis(np.cross(d2,FRONT),d2,MED),[-10,50],0,"flexão")],f"Polegar MCF {'direito' if s=='d' else 'esquerdo'}")
    d3=nz(td.mean(0)-ip);add(f"if1_{s}",f"mcf1_{s}",ip,[dof("flex",signed_axis(np.cross(d3,FRONT),d3,MED),[-20,80],0,"flexão")],f"Polegar IF {'direito' if s=='d' else 'esquerdo'}")
    # ---- hip: sphere on the femoral head
    Fe=V(f"{side} femur");fc0,fa_=long_axis(Fe,toward=Fe[np.argmax(Fe@UP)]);tf=(Fe-fc0)@fa_
    top=Fe[tf>tf.max()-60];P=fc0+np.outer((top-fc0)@fa_,fa_);rad=top-P;mm=perp(MED,fa_)
    head=top[(rad@mm)>0.35*np.linalg.norm(rad,axis=1)];hpc,hpr=sphere_refit(head)
    lo=Fe[tf<tf.min()+60];lx=lo@perp(LAT,fa_);FEl=lo[np.argmax(lx)];FEm=lo[np.argmin(lx)];knee=(FEl+FEm)/2
    md=nz(knee-hpc)   # mechanical axis of the femur
    add(f"quadril_{s}","pelve",hpc,[dof("flex",signed_axis(LAT,md,FRONT),[-30,120],np.degrees(np.arctan2(md@FRONT,-(md@UP))),"flexão (+) / extensão (−)"),
      dof("abd",signed_axis(FRONT,md,LAT),[-30,45],np.degrees(np.arctan2(md@LAT,-(md@UP))),"abdução (+) / adução (−)"),
      dof("rot",signed_axis(md,FRONT,MED),[-45,40],0,"rotação interna (+) / externa (−)")],f"Quadril {'direito' if s=='d' else 'esquerdo'} (raio da cabeça {hpr:.0f} mm)")
    # ---- knee: transepicondylar axis
    Ti=V(f"{side} tibia");Fi=V(f"{side} fibula");tc0,ta=long_axis(Ti,toward=Ti[np.argmin(Ti@UP)]);tt=(Ti-tc0)@ta
    dist=Ti[tt>tt.max()-30];mal_m=dist[(dist@LAT)<np.percentile(dist@LAT,25)];mm_tip=mal_m[np.argmin(mal_m@UP)]   # medial malleolus tip
    lm_tip=Fi[np.argmin(Fi@UP)]
    ank=(mm_tip+lm_tip)/2+DOWN*5;sd_=nz(ank-knee)   # shank direction
    kax=nz(FEm-FEl)
    add(f"joelho_{s}",f"quadril_{s}",knee,[dof("flex",signed_axis(kax,sd_,BACK),[-5,140],pang(md,sd_,kax),"flexão (+) / hiperextensão (−)"),
      dof("rot",signed_axis(sd_,FRONT,MED),[-30,10],0,"rotação interna (+) / externa (−) da tíbia (só com o joelho dobrado)")],f"Joelho {'direito' if s=='d' else 'esquerdo'}")
    add(f"patela_{s}",f"quadril_{s}",knee,[dof("flex",signed_axis(kax,sd_,BACK),[0,140],0,"acompanha o joelho")],f"Patela {'direita' if s=='d' else 'esquerda'}")
    # ---- ankle (talocrural): through the tips of the malleoli, 5 mm below (Inman)
    aax=nz(mm_tip-lm_tip)
    M2=V(f"{side} second metatarsal bone");Ca=V(f"{side} calcaneus");heel=Ca[np.argmax(Ca@BACK)];m2h=M2[np.argmax(M2@FRONT)]
    foot=nz(m2h-heel)
    add(f"tornozelo_{s}",f"joelho_{s}",ank,[dof("flex",signed_axis(aax,foot,UP),[-50,20],90-pang(-sd_,foot,aax),"dorsiflexão (+) / flexão plantar (−)")],f"Tornozelo {'direito' if s=='d' else 'esquerdo'} (talocrural)")
    # ---- subtalar: 42° up and 23° medial from the long axis of the foot (Inman)
    fh=perp(foot,UP);medh=perp(MED,UP)
    sax=nz(np.cos(np.radians(42))*(np.cos(np.radians(23))*fh+np.sin(np.radians(23))*medh)+np.sin(np.radians(42))*UP)
    Ta=V(f"{side} talus");stc=Ta[(Ta@UP)<np.percentile(Ta@UP,25)].mean(0)   # under the talus, at the posterior talocalcaneal facet
    add(f"subtalar_{s}",f"tornozelo_{s}",stc,[dof("inv",signed_axis(sax,DOWN,MED),[-15,35],0,"inversão (+) / eversão (−)")],f"Subtalar {'direita' if s=='d' else 'esquerda'}")
    # ---- toes: metatarsal heads; flexion around the metatarsal break (line through heads 1 and 5)
    MTh={}
    for k in range(1,6):
      mt=V(f"{side} {ORD[k-1]} metatarsal bone");c0,a0=long_axis(mt,toward=mt.mean(0)+foot*40);tt=(mt-c0)@a0;MTh[k]=sphere_refit(mt[tt>tt.max()-12])[0]
    brk=nz(MTh[5]-MTh[1])
    for k,tn in TOES.items():
      pp=V(f"proximal phalanx of {side} {tn}");dp=V(f"distal phalanx of {side} {tn}");dd=nz(pp.mean(0)-MTh[k])
      add(f"mtf{k}_{s}",f"subtalar_{s}",MTh[k],[dof("flex",signed_axis(perp(brk,dd),dd,DOWN),[-80 if k==1 else -70,35 if k==1 else 40],0,"flexão (+) / extensão (−)")],f"Dedo do pé {k} MTF {'direito' if s=='d' else 'esquerdo'}")
      def headp(B,dirn):c0,a0=long_axis(B,toward=B.mean(0)+dirn*20);tt=(B-c0)@a0;return sphere_refit(B[tt>tt.max()-5])[0]
      if k==1:
        ipc=headp(pp,dd);add(f"ifh_{s}",f"mtf1_{s}",ipc,[dof("flex",signed_axis(perp(brk,dd),dd,DOWN),[0,80],0,"flexão")],f"Hálux IF {'direito' if s=='d' else 'esquerdo'}")
      else:
        mp=V(f"middle phalanx of {side} {tn}");a=headp(pp,dd);b=headp(mp,dd)
        add(f"ifpp{k}_{s}",f"mtf{k}_{s}",a,[dof("flex",signed_axis(perp(brk,dd),dd,DOWN),[0,60],0,"flexão")],f"Dedo do pé {k} IFP")
        add(f"ifdp{k}_{s}",f"ifpp{k}_{s}",b,[dof("flex",signed_axis(perp(brk,dd),dd,DOWN),[0,60],0,"flexão")],f"Dedo do pé {k} IFD")
    # couplings: scapulohumeral rhythm (after 30° the scapula adds 1° for every 2° of the humerus — Inman 1944), the
    # patella follows ~70% of the knee, and the tibia turns out ~10° in the last 20° of knee extension ("screw-home")
    CP+= [{"de":f"ombro_{s}.abd","apos":30,"para":[[f"cla_{s}.elev",0.2],[f"esc_{s}.rot_sup",0.13],[f"cla_{s}.rot",0.2]],"nota":"ritmo escapuloumeral (o ângulo pedido para o braço é contra o tronco; o app tira da glenoumeral o que a escápula fez)"},
          {"de":f"ombro_{s}.flex","apos":30,"para":[[f"cla_{s}.elev",0.2],[f"esc_{s}.rot_sup",0.13],[f"cla_{s}.rot",0.2]],"nota":"ritmo escapuloumeral (o ângulo pedido para o braço é contra o tronco; o app tira da glenoumeral o que a escápula fez)"},
          {"de":f"joelho_{s}.flex","apos":0,"para":[[f"patela_{s}.flex",0.7]],"nota":"patela acompanha o joelho"},
          {"de":f"joelho_{s}.flex","ate":20,"para":[[f"joelho_{s}.rot",-0.5]],"nota":"screw-home: a tíbia gira para fora no fim da extensão"}]
  root=V("sacrum").mean(0)
  J["pelve"]={"pai":None,"centro":[round(x,5) for x in to_app(root)],"nome":"Pelve (raiz)","mov":[]}
  return J,CP
