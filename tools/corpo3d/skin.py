# Muscle Atlas — pesos da pele (0.76, etapa 2 da animação; pedido do dono: "faça 1 e 2").
# Cada vértice do corpo aprende quais peças do esqueleto segue (até 4) e quanto. Chamado pelo build.py; também roda
# sozinho a partir do cache que o build deixa (corpo-skin.pkl / corpo-f-skin.pkl):  python3 skin.py [f]
#   1. distância do vértice aos ossos de cada peça; a peça mais perto manda, as outras entram com uma gaussiana de
#      quanto estão mais longe (quanto mais longe de qualquer osso — glúteo, barriga — mais suave a mistura);
#   2. alisamento no espaço: o peso de cada vértice vira a média dos pesos ao redor (raio ~2 cm), de todas as malhas
#      juntas. Assim músculos que se tocam, e as camadas de dentro e de fora, seguem igual e não rasgam ao dobrar;
#   3. as mamas (longe dos ossos) copiam os pesos do músculo embaixo delas, só da coluna (não seguem o braço).
# Saída: atributos "_skinidx" (índice na lista "pele" do rig) e "_skinw" (0–255) no glb.
import numpy as np,trimesh,os,sys,pickle,re
from scipy.spatial import cKDTree
SOFT=("mama",)
S0=float(os.environ.get("SKIN_S0","0.012"));SK=float(os.environ.get("SKIN_SK","0.12"));RS=float(os.environ.get("SKIN_R","0.02"))
def run(sc,SP,ORDEM,OUT):
  IX={k:i for i,k in enumerate(ORDEM)};TR={k:cKDTree(v) for k,v in SP.items() if k in IX}
  keys=list(sc.geometry.keys());VV=[np.asarray(sc.geometry[k].vertices) for k in keys];ALL=np.vstack(VV)
  def raw(V):
    D=np.full((len(V),len(ORDEM)),np.inf,np.float32)
    for k,t in TR.items():D[:,IX[k]]=t.query(V,distance_upper_bound=0.3)[0]
    dmin=D.min(1);bad=~np.isfinite(dmin);D[bad,IX["pelve"]]=0;dmin[bad]=0
    sig=S0+SK*dmin;W=np.exp(-np.square(D-dmin[:,None])/(2*np.square(sig[:,None])));W[~np.isfinite(D)]=0
    return (W/W.sum(1,keepdims=True)).astype(np.float32)
  rng=np.random.default_rng(7);sub=ALL[rng.choice(len(ALL),min(len(ALL),70000),replace=False)];Wsub=raw(sub);T=cKDTree(sub)
  def smooth(V):
    if RS<=0:return raw(V)
    d,ii=T.query(V,k=32);g=np.exp(-np.square(d)/(2*RS*RS));g/=g.sum(1,keepdims=True)
    return np.einsum('nk,nkj->nj',g,Wsub[ii])
  WW={k:smooth(V) for k,V in zip(keys,VV) if k not in SOFT}
  # 3. partes moles longe dos ossos (as mamas, 0.76): copiam os pesos do músculo logo embaixo (8 vizinhos mais perto),
  #    senão a mistura larga puxava pedaços para o braço e eles flutuavam fora do peito ao levantar os braços
  if any(k in SOFT for k in keys):
    UK=[k for k in keys if k not in SOFT and k not in ("pele","pele_n","cabeca")];TU=cKDTree(np.vstack([VV[keys.index(k)] for k in UK]));WU=np.vstack([WW[k] for k in UK])
    tr=np.array([bool(re.match(r"^(T\d+|L\d|C\d|pelve)$",o)) for o in ORDEM])
    for k,V in zip(keys,VV):
      if k not in SOFT:continue
      d,ii=TU.query(V,k=8);g=1/(d+1e-3);g/=g.sum(1,keepdims=True);W=np.einsum('nk,nkj->nj',g,WU[ii])
      W[:,~tr]=0;z=W.sum(1)<1e-6;W[z,IX["T6"]]=1;WW[k]=W/W.sum(1,keepdims=True)   # só a coluna: a mama não segue o braço
  for k,V in zip(keys,VV):
    W=WW[k]
    top=np.argsort(-W,1)[:,:4];w4=np.take_along_axis(W,top,1);w4/=w4.sum(1,keepdims=True)
    q=np.floor(w4*255+0.5).astype(int);q[:,0]+=255-q.sum(1)
    geom=sc.geometry[k];geom.vertex_attributes["skinidx"]=top.astype(np.uint8);geom.vertex_attributes["skinw"]=q.clip(0,255).astype(np.uint8)
  open(OUT+".glb","wb").write(trimesh.exchange.gltf.export_glb(sc,include_normals=True));print("pesos da pele gravados em",OUT+".glb")
if __name__=="__main__":
  f="corpo-f-skin.pkl" if len(sys.argv)>1 and sys.argv[1]=="f" else "corpo-skin.pkl"
  run(*pickle.load(open(f,"rb")))
