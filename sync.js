/* Conta e sincronização (pedido do dono, 0.23): login com Google pelo Firebase e os dados do app guardados no Firestore,
   iguais em todos os aparelhos da pessoa. O app continua funcionando sem conta, como antes; este arquivo só é baixado
   por quem abre Configurações ou já entrou numa conta.

   Como funciona
   - Cada registro vira um documento: users/{uid}/w/{id} (treinos feitos/começados), users/{uid}/p/{id} (Meus treinos,
     com a posição na lista) e users/{uid}/k/{rank|conf|ach}. O conteúdo vai como texto JSON em `d` (o Firestore não
     aceita listas dentro de listas); apagado = `d:null` (fica a marca, para o apagado sumir nos outros aparelhos).
   - `base` guarda, para cada registro, a "impressão digital" (hash) da última versão que este aparelho sabe que está na
     nuvem. Mudou aqui e não lá → envia. Mudou lá e não aqui → aplica. Mudou nos dois → fica a deste aparelho e envia.
     Na 1ª entrada a base está vazia: tudo do aparelho sobe e tudo da conta desce (junta, sem duplicar: mesmo id = um só).
   - Sem internet o Firestore guarda os envios no próprio aparelho (IndexedDB) e manda quando a internet volta.
   - O app (index.html) entrega `app.data()` (o que está no aparelho) e `app.apply(D)` (troca e redesenha). */
const V="13.1.0",G=`https://www.gstatic.com/firebasejs/${V}/`;
let A,F,auth,db,app,user=null,unsubs=[],base=new Map(),ready={w:0,p:0,k:0},timer=0,st="off",pend=0,started=false,fresh=false;

/* tiny hash (cyrb53): we only need to know if a record changed */
function h(s){let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}
  a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);
  return (4294967296*(2097151&b)+(a>>>0)).toString(36)}
const DEL="-";
const bKey=()=>"atlas-sync-base-"+user.uid;
function loadBase(){try{base=new Map(Object.entries(JSON.parse(localStorage.getItem(bKey())||"{}")))}catch(e){base=new Map()}}
function saveBase(){try{localStorage.setItem(bKey(),JSON.stringify(Object.fromEntries(base)))}catch(e){}}

/* everything the app has right now, as key → JSON text */
function snap(){const D=app.data(),m=new Map();
  D.w.forEach(x=>{if(x&&x.id)m.set("w/"+x.id,JSON.stringify(x))});
  D.p.forEach((x,i)=>{if(x&&x.id)m.set("p/"+x.id,JSON.stringify([i,x]))});
  for(const k in D.k)if(D.k[k]!=null)m.set("k/"+k,JSON.stringify(D.k[k]));
  return m}

function setSt(s){if(s===st)return;st=s;app.status(st)}
function status(){if(!user)return "off";if(!navigator.onLine)return "offline";return pend>0?"sync":"ok"}

/* send what changed on this device */
async function push(){
  clearTimeout(timer);timer=0;
  if(!user||!(ready.w&&ready.p&&ready.k))return;
  const loc=snap(),ops=[];
  for(const [key,j] of loc){const hh=h(j);if(base.get(key)!==hh)ops.push([key,j,hh])}
  for(const [key,bh] of base)if(!loc.has(key)&&bh!==DEL)ops.push([key,null,DEL]);
  if(!ops.length)return;
  for(let i=0;i<ops.length;i+=400){
    const b=F.writeBatch(db);
    for(const [key,j,hh] of ops.slice(i,i+400)){const [c,id]=key.split("/");b.set(F.doc(db,"users",user.uid,c,id),{d:j,t:F.serverTimestamp()});base.set(key,hh)}
    pend++;setSt(status());
    b.commit().catch(e=>{console.warn("sync",e);app.status("err",e&&e.code)}).finally(()=>{pend--;setSt(status())});
  }
  saveBase();
}
export function dirty(){if(!user)return;clearTimeout(timer);timer=setTimeout(push,700)}

/* what arrived from the account */
function onRemote(col,snapq){
  const loc=snap(),take=[];
  for(const ch of snapq.docChanges()){
    if(ch.doc.metadata.hasPendingWrites)continue;
    const key=col+"/"+ch.doc.id,d=ch.type==="removed"?null:(ch.doc.data().d??null);
    const rh=d==null?DEL:h(d),lj=loc.get(key),lh=lj==null?DEL:h(lj),bh=base.get(key);
    if(rh===lh){base.set(key,rh);continue}
    // settings, weight and achievements (k/…) on the 1st sign-in of a device: join both, the account's values first
    // (a new phone's empty defaults must not wipe what is in the account)
    if(bh===undefined&&lj!=null&&d!=null&&col==="k"){let m=null;try{m=JSON.stringify(app.mergeK(ch.doc.id,JSON.parse(lj),JSON.parse(d)))}catch(e){}
      if(m){take.push([key,m]);base.set(key,rh);continue}}
    const localUntouched=bh===undefined?lj==null:lh===bh;
    if(localUntouched){take.push([key,d]);base.set(key,rh)}
  }
  if(take.length)apply(take);
  saveBase();
  // a device's 1st sync waits for the account's answer from the server (not just this device's empty copy), so nothing
  // from the account is overwritten by a new phone's defaults; offline it simply waits
  if(!ready[col]){if(fresh&&snapq.metadata&&snapq.metadata.fromCache)return;
    ready[col]=1;if(ready.w&&ready.p&&ready.k){push();if(fresh)app.status("first")}}
  else dirty();
}
function apply(take){
  const D=app.data();
  const W=new Map(D.w.map(x=>[x.id,x])),P=new Map(D.p.map((x,i)=>[x.id,[i,x]]));let pTouched=false;
  for(const [key,d] of take){const [c,id]=key.split("/");let v=null;try{v=d==null?null:JSON.parse(d)}catch(e){continue}
    if(c==="w"){if(v)W.set(id,v);else W.delete(id)}
    else if(c==="p"){pTouched=true;if(v)P.set(id,[+v[0]||0,v[1]]);else P.delete(id)}
    else if(c==="k"&&v)D.k[id]=v}
  D.w=[...W.values()];
  if(pTouched)D.p=[...P.values()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  app.apply(D);
}

function listen(){
  stop();ready={w:0,p:0,k:0};loadBase();fresh=base.size===0;
  for(const c of ["w","p","k"])
    unsubs.push(F.onSnapshot(F.collection(db,"users",user.uid,c),s=>onRemote(c,s),e=>{console.warn("sync listen",e);app.status("err",e&&e.code)}));
}
function stop(){unsubs.forEach(u=>u());unsubs=[]}

/* start: Firebase loads, the saved login comes back by itself (IndexedDB) */
export async function start(appApi){
  if(started)return;started=true;app=appApi;
  const [FA,AA,FF]=await Promise.all([import(G+"firebase-app.js"),import(G+"firebase-auth.js"),import(G+"firebase-firestore.js")]);A=AA;F=FF;
  const fapp=FA.initializeApp(app.cfg);
  auth=A.getAuth(fapp);
  try{db=F.initializeFirestore(fapp,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})})}
  catch(e){db=F.initializeFirestore(fapp,{})}
  if(app.emu){A.connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});F.connectFirestoreEmulator(db,"127.0.0.1",8080)}
  A.getRedirectResult(auth).catch(e=>app.status("err",e&&e.code)).finally(()=>{try{localStorage.removeItem("atlas-sync-redir")}catch(e){}});
  A.onAuthStateChanged(auth,u=>{
    user=u;
    if(u){app.user({uid:u.uid,name:u.displayName||"",email:u.email||"",photo:u.photoURL||""});listen();setSt(status())}
    else{stop();app.user(null);setSt("off")}
  });
  addEventListener("online",()=>setSt(status()));addEventListener("offline",()=>setSt(status()));
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")push()});
}

const nativeAuth=()=>{const C=window.Capacitor;return C&&C.isNativePlatform&&C.isNativePlatform()&&C.Plugins&&C.Plugins.FirebaseAuthentication||null};
/* Entrar com Google: janela do Google; se o navegador não deixar abrir janela, vai pela página inteira */
export async function signIn(){
  /* app das lojas (Capacitor): o Google não deixa entrar por janela dentro do app, então o login é o nativo do celular
     (@capacitor-firebase/authentication) e o token dele entra no Firebase da página, que segue sincronizando igual */
  const FA=nativeAuth();
  if(FA){const r=await FA.signInWithGoogle();const t=r&&r.credential&&r.credential.idToken;if(!t)return;
    return A.signInWithCredential(auth,A.GoogleAuthProvider.credential(t))}
  const p=new A.GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});
  try{await A.signInWithPopup(auth,p)}
  catch(e){const c=e&&e.code||"";
    if(/popup-blocked|operation-not-supported|web-storage-unsupported/.test(c)){try{localStorage.setItem("atlas-sync-redir","1")}catch(x){}return A.signInWithRedirect(auth,p)}
    if(!/popup-closed|cancelled-popup/.test(c))throw e}
}
/* tests only (emulator): log in with a made-up Google account */
export function testLogin(json){return A.signInWithCredential(auth,A.GoogleAuthProvider.credential(json))}

/* Sair: os dados continuam neste aparelho; a cópia local da nuvem é apagada */
export async function signOut(){await push();stop();try{if(navigator.onLine)await Promise.race([F.waitForPendingWrites(db),new Promise(r=>setTimeout(r,4000))])}catch(e){}
  try{localStorage.removeItem(bKey())}catch(e){}
  await A.signOut(auth);try{const FA=nativeAuth();if(FA)await FA.signOut()}catch(e){}try{await F.terminate(db);await F.clearIndexedDbPersistence(db)}catch(e){}}

/* Apagar minha conta: apaga tudo da nuvem e a conta; os dados deste aparelho ficam */
export async function deleteAccount(){
  if(!user)return;stop();const uid=user.uid;
  for(const c of ["w","p","k"]){const s=await F.getDocs(F.collection(db,"users",uid,c));
    for(let i=0;i<s.docs.length;i+=400){const b=F.writeBatch(db);s.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit()}}
  try{await user.delete()}
  catch(e){if(e&&e.code==="auth/requires-recent-login"){await A.reauthenticateWithPopup(user,new A.GoogleAuthProvider());await auth.currentUser.delete()}else throw e}
  try{localStorage.removeItem("atlas-sync-base-"+uid)}catch(e){}
  try{await F.terminate(db);await F.clearIndexedDbPersistence(db)}catch(e){}
}
export const now=()=>({st,user:user?{uid:user.uid}:null});
export const flush=()=>push();
