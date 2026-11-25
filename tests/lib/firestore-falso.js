/* Firestore "de mentira" para os testes da conta (tests/conta.js). O emulador de verdade do Firestore precisa de um
   arquivo .jar que o ambiente de teste não consegue baixar, então este módulo imita só o que o sync.js usa:
   escrever em lote, ouvir uma coleção (com docChanges e hasPendingWrites), ler tudo, esperar os envios, encerrar.
   Ele conversa com a "nuvem falsa" (servidor que o teste sobe em NUVEM) e, como o Firestore real, guarda no próprio
   aparelho o que ainda não foi enviado (localStorage), mostra a escrita na hora e envia quando a internet volta. */
const NUVEM="http://127.0.0.1:8790";
const LQ="__ff_q",LC="__ff_cache";
const rd=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let dbs=[];
export const persistentLocalCache=()=>({}),persistentMultipleTabManager=()=>({}),connectFirestoreEmulator=()=>{},serverTimestamp=()=>({__ts:1});
export function initializeFirestore(){const db={q:rd(LQ,[]),cache:rd(LC,{}),ls:new Set(),dead:false,waits:[],t:0};dbs.push(db);db.t=setInterval(()=>tick(db),150);return db}
export const doc=(db,...p)=>({path:p.join("/"),id:p[p.length-1]});
export const collection=(db,...p)=>({path:p.join("/")});
// "only what changed" (0.53): query(collection, where("t", ">", Timestamp)); t here is a number (ms)
export const Timestamp={fromMillis:ms=>({ms,toMillis:()=>ms})};
export const where=(f,op,v)=>({f,op,v});
export const query=(ref,...w)=>({path:ref.path,w});
const pass=(l,data)=>!l.w||l.w.every(c=>c.f==="t"&&c.op===">"?(data&&data.t||0)>c.v.toMillis():true);
// reads counted like the real bill: every document that comes from the server to a listener
self.__ffReads=0;
const parentOf=p=>p.split("/").slice(0,-1).join("/");
function emit(db,col,changes,pending,fromCache=false,force=false){for(const l of db.ls)if(l.col===col&&(changes.length||force))l.next({metadata:{fromCache},docChanges:()=>changes.map(c=>({type:c.type,doc:{id:c.id,data:()=>c.data,metadata:{hasPendingWrites:pending}}}))})}
export function writeBatch(db){const ops=[];return {set(r,data){ops.push({p:r.path,data:{...data,t:Date.now()}})},delete(r){ops.push({p:r.path,del:true})},
  commit(){if(db.dead)return Promise.reject(new Error("terminated"));
    const byCol={};
    for(const o of ops){const had=o.p in db.cache;if(o.del)delete db.cache[o.p];else db.cache[o.p]=o.data;
      (byCol[parentOf(o.p)]??=[]).push({type:o.del?"removed":had?"modified":"added",id:o.p.split("/").pop(),data:o.data})}
    wr(LC,db.cache);db.q.push(...ops);wr(LQ,db.q);
    for(const c in byCol)emit(db,c,byCol[c],true);
    return new Promise(res=>db.waits.push(res))}}}
async function tick(db){
  if(db.dead||db.busy)return;db.busy=1;
  try{
    if(db.q.length){const ops=db.q.slice();const r=await fetch(NUVEM+"/write",{method:"POST",body:JSON.stringify(ops)});if(r.ok){db.q=db.q.slice(ops.length);wr(LQ,db.q);if(!db.q.length){db.waits.splice(0).forEach(f=>f())}}}
    for(const l of db.ls){const r=await fetch(NUVEM+"/list?col="+encodeURIComponent(l.col)+"&since="+l.v);if(!r.ok)continue;const j=await r.json();l.v=j.v;
      const ch=[];for(const d of j.docs){const p=l.col+"/"+d.id,cur=db.cache[p];
        if(!d.del&&!pass(l,d.data))continue;
        if(db.q.some(o=>o.p===p))continue;   // our own write is still on its way: the local version wins for now
        if(d.del){if(cur!==undefined){delete db.cache[p];ch.push({type:"removed",id:d.id,data:cur})}continue}
        if(cur&&JSON.stringify(cur.d)===JSON.stringify(d.data.d)){if(l.meta)ch.push({type:"modified",id:d.id,data:d.data});continue}   // our own write confirmed (no read billed)
        self.__ffReads++;
        db.cache[p]=d.data;ch.push({type:cur?"modified":"added",id:d.id,data:d.data})}
      wr(LC,db.cache);emit(db,l.col,ch,false,false,!l.srv);l.srv=1}
  }catch(e){}finally{db.busy=0}}
export function onSnapshot(ref,a,b,c){const o=typeof a==="object"&&a?a:null,next=o?b:a;const db=dbs[dbs.length-1];const l={col:ref.path,next,v:0,w:ref.w,meta:!!(o&&o.includeMetadataChanges)};db.ls.add(l);
  // first answer comes from what this device already has (like the real offline cache)
  const pre=Object.keys(db.cache).filter(p=>parentOf(p)===ref.path&&pass(l,db.cache[p])).map(p=>({type:"added",id:p.split("/").pop(),data:db.cache[p]}));
  setTimeout(()=>emit(db,ref.path,pre,false,true,true),0);   // like the real one: first what is on the device (fromCache), then the server
  return ()=>db.ls.delete(l)}
export async function getDocs(ref){const r=await fetch(NUVEM+"/list?col="+encodeURIComponent(ref.path)+"&since=0");const j=await r.json();
  return {docs:j.docs.filter(d=>!d.del).map(d=>({id:d.id,ref:{path:ref.path+"/"+d.id,id:d.id},data:()=>d.data}))}}
export function waitForPendingWrites(db){return db.q.length?new Promise(res=>db.waits.push(res)):Promise.resolve()}
export async function terminate(db){db.dead=true;clearInterval(db.t);db.ls.clear()}
export async function clearIndexedDbPersistence(){localStorage.removeItem(LQ);localStorage.removeItem(LC)}
